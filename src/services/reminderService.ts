// Bác sĩ Tâm An - Background Reminder Service for Mobile & Tablet
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export interface ScheduledReminderItem {
  id: string;
  medName: string;
  dosage: string;
  time: string; // HH:mm
  notes?: string;
  enabled: boolean;
  category?: string;
  lastTriggeredDate?: string;
}

export interface AppNotificationItem {
  id: string;
  type: 'water' | 'medication' | 'vitals' | 'general';
  title: string;
  body: string;
  timeStr: string;
  timestamp: number;
  read: boolean;
  actionType?: 'drink_water' | 'take_med' | 'log_vital';
  metadata?: any;
}

/**
 * Accurately determines if a reminder item is for measuring health metrics/vitals
 * (e.g. blood pressure, glucose, SpO2, temperature, weight) vs taking medication.
 */
export function isVitalsOrMetric(category?: string, name?: string, id?: string): boolean {
  if (id && id.startsWith('vitals-')) return true;

  const text = `${category || ''} ${name || ''}`.toLowerCase();
  const hasVitalKeywords = /đo|huyết áp|đường huyết|tiểu đường|glucose|hba1c|spo2|oxy|thân nhiệt|nhiệt độ|sốt|cân nặng|bmi|thể trọng|chỉ số|sinh hiệu|nhịp tim|vòng eo|vitals/i.test(text);
  const hasMedKeywords = /thuốc|dược liệu|kháng sinh|viên|liều|uống viên|uống liều|vitamin|siro|cao xoa|đông y/i.test(text);

  // If category is an explicit vitals/metric type
  if (category && ['vitals', 'measurement', 'glucose', 'blood_pressure', 'spo2', 'temperature', 'weight'].includes(category)) {
    return true;
  }

  // If name or notes has vital keywords (e.g. "Đo huyết áp", "Đo đường huyết") and is not purely medication
  if (hasVitalKeywords && (!hasMedKeywords || text.includes('đo '))) {
    return true;
  }

  if (category === 'medication') return false;

  return false;
}

class ReminderService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private worker: Worker | null = null;
  private reminders: ScheduledReminderItem[] = [];
  private waterEnabled: boolean = false;
  private waterIntervalMinutes: number = 60;
  private nextWaterTimestamp: number = 0;
  private currentUserId: string | null = null;
  private unsubscribeFirestore: (() => void) | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Lazy initialized
  }

  public async init(userId?: string | null) {
    if (typeof window === 'undefined') return;

    this.currentUserId = userId || null;

    // 1. Register Service Worker for mobile/tablet background notifications
    await this.registerServiceWorker();

    // 2. Load water reminder settings
    this.loadWaterSettings();

    // 3. Start Firestore listener if logged in, or local reminders
    this.setupRemindersListener();

    // 4. Start Web Worker background timer heartbeat
    this.startBackgroundHeartbeat();

    // 5. Setup visibility change listener (when mobile user re-opens or hides app)
    this.setupVisibilityListener();

    this.isInitialized = true;
  }

  public updateUser(userId: string | null) {
    this.currentUserId = userId;
    this.setupRemindersListener();
    this.loadWaterSettings();
    this.syncToServiceWorker();
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showNotification(
          '🔔 Đã kích hoạt thông báo chạy ngầm',
          'Bác sĩ Tâm An sẽ nhắc nhở bạn uống thuốc, đo chỉ số và uống nước đúng giờ ngay cả khi đóng ứng dụng.'
        );
      }
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  public getNotificationPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public updateWaterConfig(enabled: boolean, intervalMinutes: number) {
    this.waterEnabled = enabled;
    this.waterIntervalMinutes = intervalMinutes;
    if (enabled) {
      this.nextWaterTimestamp = Date.now() + (intervalMinutes * 60 * 1000);
      localStorage.setItem('waterReminderNextTimestamp', String(this.nextWaterTimestamp));
      // Do not push premature notification: wait until nextWaterTimestamp arrives
    } else {
      this.nextWaterTimestamp = 0;
      localStorage.removeItem('waterReminderNextTimestamp');
    }
    this.syncToServiceWorker();
  }

  public recordWaterIntake(amountMl: number = 250) {
    if (typeof window === 'undefined') return;
    if (this.waterEnabled) {
      this.nextWaterTimestamp = Date.now() + (this.waterIntervalMinutes * 60 * 1000);
      localStorage.setItem('waterReminderNextTimestamp', String(this.nextWaterTimestamp));
      this.syncToServiceWorker();
    }
  }

  public setReminders(reminders: ScheduledReminderItem[]) {
    this.reminders = reminders;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tam_an_scheduled_reminders', JSON.stringify(reminders));
    }
    this.syncToServiceWorker();
    this.scheduleReminderTimeouts();
    this.ensureActiveRemindersInNotificationCenter();
  }

  private scheduleReminderTimeouts() {
    if (typeof window === 'undefined' || !this.reminders || this.reminders.length === 0) return;
    const now = new Date();
    const currentTotalMs = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000;

    this.reminders.forEach((r) => {
      if (!r.enabled) return;
      const [h, m] = (r.time || '08:00').split(':').map(Number);
      const targetMs = ((isNaN(h) ? 8 : h) * 3600 + (isNaN(m) ? 0 : m) * 60) * 1000;

      // 1. Timeout for 15 minutes before (Pre-alert)
      const preTargetMs = targetMs - 15 * 60 * 1000;
      const preDiffMs = preTargetMs - currentTotalMs;
      if (preDiffMs > 0 && preDiffMs <= 86400000) {
        setTimeout(() => {
          this.checkAndTriggerReminders();
        }, preDiffMs);
      }

      // 2. Timeout for exact scheduled time
      const diffMs = targetMs - currentTotalMs;
      if (diffMs > 0 && diffMs <= 86400000) {
        setTimeout(() => {
          this.checkAndTriggerReminders();
        }, diffMs);
      }
    });
  }

  public syncReminderToNotificationCenter(item: ScheduledReminderItem) {
    if (!item.enabled) return;
    // Update schedule in memory and persistent storage
    const exists = this.reminders.some(r => r.id === item.id);
    if (!exists) {
      this.reminders.push(item);
    } else {
      this.reminders = this.reminders.map(r => r.id === item.id ? item : r);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('tam_an_scheduled_reminders', JSON.stringify(this.reminders));
    }
    this.scheduleReminderTimeouts();
    this.syncToServiceWorker();
    
    // Check if it is currently due (within 15 minutes before or exact time)
    // If not due yet, DO NOT send notification immediately!
    this.checkAndTriggerReminders();
  }

  public ensureActiveRemindersInNotificationCenter() {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const currentNotifs = this.getNotifications();
    let updated = false;

    // Water reminders are only created when due via checkAndTriggerReminders()

    // 2. Only add reminders if they have actually reached the alert window (within 15 minutes before or due today)
    this.reminders.forEach(r => {
      if (!r.enabled) return;
      const [rHours, rMins] = (r.time || '08:00').split(':').map(Number);
      const reminderTotalMinutes = (isNaN(rHours) ? 8 : rHours) * 60 + (isNaN(rMins) ? 0 : rMins);

      // STRICT TIMING: If reminder time is more than 15 minutes in the future today, DO NOT show yet!
      const isDueOrWithin15 = currentTotalMinutes >= reminderTotalMinutes - 15 && currentTotalMinutes <= reminderTotalMinutes + 60;
      if (!isDueOrWithin15) {
        return; // Wait until 15 minutes before or exact time
      }

      const isVitals = isVitalsOrMetric(r.category, r.medName, r.id);
      const targetType = isVitals ? 'vitals' : 'medication';
      const exists = currentNotifs.some(n => n.type === targetType && (n.metadata?.id === r.id || n.title.includes(r.medName)));
      if (!exists) {
        const isPreAlert = currentTotalMinutes < reminderTotalMinutes;
        const schedNotif: AppNotificationItem = {
          id: `sched-${r.id}-${Date.now()}`,
          type: targetType,
          title: isPreAlert
            ? `⏰ Sắp đến giờ: ${r.medName} (${r.time})`
            : (isVitals 
                ? `🩺 Lịch nhắc đo chỉ số: ${r.medName} (${r.time})`
                : `💊 Lịch nhắc uống thuốc: ${r.medName} (${r.time})`),
          body: isPreAlert
            ? `Còn ít phút nữa đến giờ ${isVitals ? 'đo chỉ số' : 'uống thuốc'} (${r.time}). Hãy chuẩn bị sẵn sàng!`
            : (isVitals
                ? (r.dosage 
                    ? `Đã đến giờ kiểm tra! Mục tiêu/Chỉ số: ${r.dosage}.${r.notes ? ' Ghi chú: ' + r.notes : ' Hãy ngồi nghỉ ngơi thư giãn 5 phút trước khi tiến hành đo.'}`
                    : `Đã đến giờ kiểm tra chỉ số sức khỏe theo lịch cài đặt.`)
                : (r.dosage 
                    ? `Đã đến giờ uống thuốc: ${r.dosage}.${r.notes ? ' Ghi chú: ' + r.notes : ' Hãy dùng thuốc đúng giờ theo chỉ định của bác sĩ.'}`
                    : `Đã đến giờ uống thuốc theo phác đồ cài đặt.`)),
          timeStr: r.time,
          timestamp: Date.now(),
          read: false,
          actionType: isVitals ? 'log_vital' : 'take_med',
          metadata: r
        };
        currentNotifs.unshift(schedNotif);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('tam_an_notification_center_items', JSON.stringify(currentNotifs.slice(0, 40)));
      window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: currentNotifs }));
    }
  }

  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;

      // When service worker takes control
      navigator.serviceWorker.ready.then((readyReg) => {
        this.swRegistration = readyReg;
        this.syncToServiceWorker();
      });
    } catch (err) {
      console.warn('Service Worker registration skipped or failed:', err);
    }
  }

  private loadWaterSettings() {
    if (typeof window === 'undefined') return;

    const savedEnabled = localStorage.getItem('waterReminderEnabled');
    this.waterEnabled = savedEnabled === 'true';

    const savedInterval = localStorage.getItem('waterReminderInterval');
    const val = savedInterval ? parseFloat(savedInterval) : 60;
    this.waterIntervalMinutes = val === 30 ? 60 : val;

    const savedNextTime = localStorage.getItem('waterReminderNextTimestamp');
    if (savedNextTime) {
      this.nextWaterTimestamp = parseInt(savedNextTime, 10);
    } else if (this.waterEnabled) {
      this.nextWaterTimestamp = Date.now() + (this.waterIntervalMinutes * 60 * 1000);
      localStorage.setItem('waterReminderNextTimestamp', String(this.nextWaterTimestamp));
    }
  }

  private setupRemindersListener() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    if (!this.currentUserId) {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('tam_an_scheduled_reminders');
        if (local) {
          try {
            this.reminders = JSON.parse(local);
          } catch {
            this.reminders = [];
          }
        }
      }
      this.syncToServiceWorker();
      this.ensureActiveRemindersInNotificationCenter();
      return;
    }

    try {
      const qMed = query(
        collection(db, 'medicationReminders'),
        where('userId', '==', this.currentUserId)
      );

      const qVitals = query(
        collection(db, 'reminders'),
        where('userId', '==', this.currentUserId)
      );

      let medList: ScheduledReminderItem[] = [];
      let vitalsList: ScheduledReminderItem[] = [];

      const updateAllReminders = () => {
        this.reminders = [...medList, ...vitalsList];
        if (typeof window !== 'undefined') {
          localStorage.setItem('tam_an_scheduled_reminders', JSON.stringify(this.reminders));
        }
        this.syncToServiceWorker();
        this.ensureActiveRemindersInNotificationCenter();
      };

      const unsubMed = onSnapshot(qMed, (snapshot) => {
        const list: ScheduledReminderItem[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          list.push({
            id: doc.id,
            medName: d.medName || 'Uống thuốc',
            dosage: d.dosage || '',
            time: d.time || '08:00',
            notes: d.notes || '',
            enabled: d.enabled ?? true,
            category: d.category || 'medication'
          });
        });
        medList = list;
        updateAllReminders();
      }, (err) => {
        console.warn('Error syncing medicationReminders from Firestore:', err);
      });

      const unsubVitals = onSnapshot(qVitals, (snapshot) => {
        const list: ScheduledReminderItem[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          if (d.enabled) {
            list.push({
              id: 'vitals-' + doc.id,
              medName: 'Đo & Ghi lại chỉ số sinh hiệu',
              dosage: 'Huyết áp, Đường huyết, SpO2, Thân nhiệt',
              time: d.time || '08:00',
              notes: 'Kiểm tra sức khỏe định kỳ mỗi ngày',
              enabled: Boolean(d.enabled),
              category: 'vitals'
            });
          }
        });
        vitalsList = list;
        updateAllReminders();
      }, (err) => {
        console.warn('Error syncing vitals reminders from Firestore:', err);
      });

      this.unsubscribeFirestore = () => {
        unsubMed();
        unsubVitals();
      };
    } catch (err) {
      console.warn('Could not setup Firestore snapshot listener:', err);
    }
  }

  private syncToServiceWorker() {
    const payload = {
      type: 'SYNC_REMINDERS',
      reminders: this.reminders,
      waterEnabled: this.waterEnabled,
      waterIntervalMinutes: this.waterIntervalMinutes,
      nextWaterTimestamp: this.nextWaterTimestamp
    };

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(payload);
    }

    if (this.swRegistration && this.swRegistration.active) {
      this.swRegistration.active.postMessage(payload);
    }
  }

  private startBackgroundHeartbeat() {
    if (typeof window === 'undefined') return;

    // Use an inline Web Worker to avoid browser background timer throttling on mobile/tablet
    const workerScript = `
      let intervalId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(function() {
            self.postMessage('tick');
          }, 10000); // Heartbeat every 10 seconds
        } else if (e.data === 'stop') {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
        }
      };
    `;

    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => {
        if (e.data === 'tick') {
          this.checkAndTriggerReminders();
        }
      };

      this.worker.postMessage('start');
    } catch (err) {
      console.warn('Inline Web Worker not available, falling back to window interval:', err);
      setInterval(() => {
        this.checkAndTriggerReminders();
      }, 10000);
    }
  }

  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // App resumed from background - check if any reminder was due
        this.checkAndTriggerReminders();
        this.syncToServiceWorker();
      } else {
        // App went to background - push latest schedule to service worker
        this.syncToServiceWorker();
      }
    });
  }

  public checkAndTriggerReminders() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayDateStr = now.toISOString().split('T')[0];
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Check Medication & Vitals reminders
    if (this.reminders && this.reminders.length > 0) {
      this.reminders.forEach((r) => {
        if (!r.enabled) return;

        const [rHours, rMins] = (r.time || '08:00').split(':').map(Number);
        const reminderTotalMinutes = (isNaN(rHours) ? 8 : rHours) * 60 + (isNaN(rMins) ? 0 : rMins);
        const isVitals = isVitalsOrMetric(r.category, r.medName, r.id);

        // A. Nhắc trước 15 phút (Pre-alert)
        const is15MinBefore = currentTotalMinutes >= reminderTotalMinutes - 15 && currentTotalMinutes < reminderTotalMinutes;
        const preAlertKey = `preAlert_${r.id}_${todayDateStr}`;
        const alreadyPreAlerted = localStorage.getItem(preAlertKey);

        if (is15MinBefore && !alreadyPreAlerted) {
          localStorage.setItem(preAlertKey, 'true');
          const preTitle = isVitals
            ? `⏰ Sắp đến giờ đo chỉ số: ${r.medName} (${r.time})`
            : `⏰ Sắp đến giờ uống thuốc: ${r.medName} (${r.time})`;
          const preBody = isVitals
            ? `Còn 15 phút nữa đến giờ kiểm tra (${r.time}). Mục tiêu: ${r.dosage || 'Đo chỉ số'}. Hãy chuẩn bị thiết bị và nghỉ ngơi thư giãn 5 phút.`
            : `Còn 15 phút nữa đến giờ uống thuốc (${r.time}): ${r.dosage || '1 liều'}. Hãy chuẩn bị nước ấm hoặc dùng bữa phù hợp.`;

          this.showNotification(
            preTitle,
            preBody,
            `reminder-pre-${r.id}`,
            isVitals ? 'vitals' : 'medication',
            r
          );
          this.dispatchInAppEvent(isVitals ? 'vitals' : 'medication', r);
        }

        // B. Nhắc khi đến đúng giờ đặt (hoặc trễ trong vòng 45 phút)
        const lastKey = `lastTriggered_${r.id}_${todayDateStr}`;
        const alreadyTriggered = localStorage.getItem(lastKey);
        const isDue = r.time === currentTimeStr || 
          (!alreadyTriggered && currentTotalMinutes >= reminderTotalMinutes && currentTotalMinutes <= reminderTotalMinutes + 45);

        if (isDue && !alreadyTriggered) {
          localStorage.setItem(lastKey, 'true');
          const title = isVitals 
            ? `🩺 Lịch nhắc đo chỉ số: ${r.medName} (${r.time})`
            : `💊 Lịch nhắc uống thuốc: ${r.medName} (${r.time})`;
          const body = isVitals
            ? (r.dosage
                ? `Đã đến giờ kiểm tra! Chỉ số mục tiêu: ${r.dosage}.${r.notes ? ' Ghi chú: ' + r.notes : ' Hãy ngồi nghỉ ngơi 5 phút trước khi đo.'}`
                : `Đã đến giờ kiểm tra chỉ số sức khỏe định kỳ theo lịch cài đặt.`)
            : (r.dosage
                ? `Đã đến giờ uống thuốc: ${r.dosage}.${r.notes ? ' Ghi chú: ' + r.notes : ' Hãy dùng thuốc đúng giờ theo chỉ định.'}`
                : `Đã đến giờ uống thuốc theo phác đồ cài đặt.`);

          this.showNotification(
            title, 
            body, 
            `reminder-${r.id}`,
            isVitals ? 'vitals' : 'medication',
            r
          );
          this.dispatchInAppEvent(isVitals ? 'vitals' : 'medication', r);
        }
      });
    }

    // 2. Check Hydration Water Reminder
    if (this.waterEnabled) {
      const nowTs = Date.now();
      if (this.nextWaterTimestamp > 0 && nowTs >= this.nextWaterTimestamp) {
        this.nextWaterTimestamp = nowTs + (this.waterIntervalMinutes * 60 * 1000);
        localStorage.setItem('waterReminderNextTimestamp', String(this.nextWaterTimestamp));
        this.syncToServiceWorker();

        this.showNotification(
          '💧 Nhắc nhở uống nước định kỳ',
          'Đã đến lúc bổ sung 200 - 250ml nước tinh khiết để thanh lọc tế bào, bảo vệ thận và kích hoạt năng lượng!',
          'water-alert',
          'water',
          { amount: 250 }
        );
        this.dispatchInAppEvent('water', { interval: this.waterIntervalMinutes });
      }
    }
  }

  public showNotification(
    title: string, 
    body: string, 
    tag: string = 'health-reminder',
    type: 'water' | 'medication' | 'vitals' | 'general' = 'general',
    metadata?: any
  ) {
    if (typeof window === 'undefined') return;

    // 1. Play chime and haptic vibration
    this.playAudioAlert();
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // Ignore vibration error
    }

    // 2. Add to Notification Center storage
    const newNotif: AppNotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      body,
      timeStr: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      read: false,
      actionType: type === 'water' ? 'drink_water' : type === 'medication' ? 'take_med' : type === 'vitals' ? 'log_vital' : undefined,
      metadata
    };
    this.saveNotificationToHistory(newNotif);

    // 3. Dispatch event for In-App Notification Center and Top Floating Banner
    window.dispatchEvent(new CustomEvent('app-new-notification', {
      detail: newNotif
    }));

    // 4. Native Browser / Device Notification
    const options: any = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      renotify: true,
      data: { url: '/', type, id: newNotif.id }
    };

    // Deliver to mobile system notification shade via Service Worker (Android / iOS PWA / Desktop)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const fullIconUrl = `${window.location.origin}/icon-192.png`;
      const fullBadgeUrl = `${window.location.origin}/icon-192.png`;
      const swOptions = {
        ...options,
        icon: fullIconUrl,
        badge: fullBadgeUrl
      };

      if ('serviceWorker' in navigator) {
        // 1. Post to active controller for instant dispatch
        if (navigator.serviceWorker.controller) {
          try {
            navigator.serviceWorker.controller.postMessage({
              type: 'TRIGGER_NOTIFICATION',
              title,
              body,
              icon: fullIconUrl,
              badge: fullBadgeUrl,
              tag,
              data: options.data
            });
          } catch (e) {
            console.warn('postMessage to controller failed:', e);
          }
        }

        // 2. Direct showNotification via ready registration
        navigator.serviceWorker.ready.then((reg) => {
          this.swRegistration = reg;
          reg.showNotification(title, swOptions).catch((err) => {
            console.warn('reg.showNotification error, falling back:', err);
            this.fallbackNotification(title, swOptions);
          });
        }).catch(() => {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
              reg.showNotification(title, swOptions).catch(() => this.fallbackNotification(title, swOptions));
            } else {
              this.fallbackNotification(title, swOptions);
            }
          }).catch(() => {
            this.fallbackNotification(title, swOptions);
          });
        });
      } else {
        this.fallbackNotification(title, swOptions);
      }
    }
  }

  public getNotifications(): AppNotificationItem[] {
    if (typeof window === 'undefined') return [];
    let list: AppNotificationItem[] = [];
    try {
      const data = localStorage.getItem('tam_an_notification_center_items');
      if (data) {
        list = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading notifications:', e);
    }

    if (!list || list.length === 0) {
      list = [];
    } else {
      // Auto-sanitize existing notifications: fix any legacy entries where vitals/metrics were mistakenly saved with title "uống thuốc" or type "medication"
      list = list.map(item => {
        const isVitals = item.type === 'vitals' || isVitalsOrMetric(item.metadata?.category, item.metadata?.medName || item.title, item.id);
        if (isVitals && item.type !== 'water') {
          let cleanedTitle = item.title;
          if (cleanedTitle.includes('uống thuốc & đo chỉ số')) {
            cleanedTitle = cleanedTitle.replace('💊 Lịch nhắc uống thuốc & đo chỉ số', '🩺 Lịch nhắc đo chỉ số');
          } else if (cleanedTitle.startsWith('💊 Lịch nhắc uống thuốc:')) {
            cleanedTitle = cleanedTitle.replace('💊 Lịch nhắc uống thuốc:', '🩺 Lịch nhắc đo chỉ số:');
          }
          let cleanedBody = item.body;
          if (cleanedBody.includes('Hãy uống thuốc đúng giờ')) {
            cleanedBody = cleanedBody.replace('Hãy uống thuốc đúng giờ theo chỉ định.', 'Hãy kiểm tra và ghi lại số đo đúng giờ.');
          }
          return {
            ...item,
            type: 'vitals' as const,
            title: cleanedTitle,
            body: cleanedBody,
            actionType: 'log_vital' as const
          };
        }
        return item;
      });
    }

    // STRICT CHECK: Remove any notifications with scheduled reminder times that haven't arrived yet
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const nowTs = Date.now();

    list = list.filter(item => {
      // 1. FILTER WATER NOTIFICATIONS THAT HAVE NOT REACHED THEIR TIME
      if (item.type === 'water') {
        // If water reminder is disabled, filter out
        if (!this.waterEnabled) return false;

        // Purge legacy premature/synthetic water notifications created before due time
        if (item.id === 'init-water-1' || item.id === 'water-alert-active' || item.id.startsWith('water-active-')) {
          return false;
        }

        // Filter out if timestamp or targetTimestamp is in the future
        if (item.timestamp && item.timestamp > nowTs) {
          return false;
        }
        if (item.metadata?.targetTimestamp && item.metadata.targetTimestamp > nowTs) {
          return false;
        }
        if (item.metadata?.nextWaterTimestamp && item.metadata.nextWaterTimestamp > nowTs) {
          return false;
        }

        // If the notification specifies a specific hour (e.g. 14:00, 20:00)
        const waterScheduledTime = item.metadata?.time || (item.title && item.title.match(/(\d{1,2}:\d{2})/) ? item.title.match(/(\d{1,2}:\d{2})/)![1] : null);
        if (waterScheduledTime) {
          const [wh, wm] = waterScheduledTime.split(':').map(Number);
          if (!isNaN(wh) && !isNaN(wm)) {
            const itemMinutes = wh * 60 + wm;
            const diffMinutes = itemMinutes - currentTotalMinutes;
            // Not due yet if scheduled in future today
            if (diffMinutes > 0) {
              return false;
            }
          }
        }

        return true;
      }

      // 2. FILTER MEDICATION & VITALS NOTIFICATIONS THAT HAVE NOT REACHED THEIR TIME
      const scheduledTime = item.metadata?.time || (item.title && item.title.match(/(\d{1,2}:\d{2})/) ? item.title.match(/(\d{1,2}:\d{2})/)![1] : null);
      if (scheduledTime) {
        const [h, m] = scheduledTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const itemMinutes = h * 60 + m;
          const diffMinutes = itemMinutes - currentTotalMinutes;
          // If scheduled time is more than 15 minutes in the future today:
          // (e.g. 20:00 when now is 16:49: diff = 191 > 15 -> FILTER OUT)
          if (diffMinutes > 15) {
            return false;
          }
        }
      }
      return true;
    });

    // Only ensure reminders that are CURRENTLY DUE or within 15 minutes before scheduled time today
    if (this.reminders && this.reminders.length > 0) {
      this.reminders.forEach(r => {
        if (!r.enabled) return;
        const [rHours, rMins] = (r.time || '08:00').split(':').map(Number);
        const reminderTotalMinutes = (isNaN(rHours) ? 8 : rHours) * 60 + (isNaN(rMins) ? 0 : rMins);

        // ONLY IF within 15 minutes before or due today:
        const isDueOrWithin15 = currentTotalMinutes >= reminderTotalMinutes - 15 && currentTotalMinutes <= reminderTotalMinutes + 60;
        if (!isDueOrWithin15) return;

        const isVitals = isVitalsOrMetric(r.category, r.medName, r.id);
        const targetType = isVitals ? 'vitals' : 'medication';
        const exists = list.some(n => n.type === targetType && (n.metadata?.id === r.id || n.title.includes(r.medName)));
        if (!exists) {
          const isPreAlert = currentTotalMinutes < reminderTotalMinutes;
          list.unshift({
            id: `sched-active-${r.id}`,
            type: targetType,
            title: isPreAlert
              ? `⏰ Sắp đến giờ: ${r.medName} (${r.time})`
              : (isVitals 
                  ? `🩺 Lịch nhắc đo chỉ số: ${r.medName} (${r.time})`
                  : `💊 Lịch nhắc uống thuốc: ${r.medName} (${r.time})`),
            body: isPreAlert
              ? `Còn ít phút nữa đến giờ ${isVitals ? 'đo chỉ số' : 'uống thuốc'} (${r.time}). Hãy chuẩn bị sẵn sàng!`
              : (isVitals
                  ? (r.dosage 
                      ? `Đã đến giờ kiểm tra! Mục tiêu/Chỉ số: ${r.dosage}.${r.notes ? ' Ghi chú: ' + r.notes : ' Hãy ngồi nghỉ ngơi thư giãn 5 phút trước khi tiến hành đo.'}`
                      : `Đã đến giờ kiểm tra chỉ số sức khỏe theo lịch cài đặt.`)
                  : (r.dosage 
                      ? `Đã đến giờ uống thuốc: ${r.dosage}.${r.notes ? ' Ghi chú: ' + r.notes : ' Hãy dùng thuốc đúng giờ theo chỉ định của bác sĩ.'}`
                      : `Đã đến giờ uống thuốc theo phác đồ cài đặt.`)),
            timeStr: r.time,
            timestamp: Date.now(),
            read: false,
            actionType: isVitals ? 'log_vital' : 'take_med',
            metadata: r
          });
        }
      });
    }

    // Deduplicate notifications by ID
    const seenIds = new Set<string>();
    list = list.filter(item => {
      if (!item || !item.id || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    try {
      localStorage.setItem('tam_an_notification_center_items', JSON.stringify(list.slice(0, 40)));
    } catch {}

    return list;
  }

  public saveNotificationToHistory(notif: AppNotificationItem) {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getNotifications().filter(item => item.id !== notif.id);
      const updated = [notif, ...list].slice(0, 30);
      localStorage.setItem('tam_an_notification_center_items', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: updated }));
    } catch (e) {
      console.warn('Error saving notification:', e);
    }
  }

  public markAllAsRead() {
    if (typeof window === 'undefined') return;
    const list = this.getNotifications().map(item => ({ ...item, read: true }));
    localStorage.setItem('tam_an_notification_center_items', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: list }));
  }

  public markAsRead(id: string) {
    if (typeof window === 'undefined') return;
    const list = this.getNotifications().map(item => item.id === id ? ({ ...item, read: true }) : item);
    localStorage.setItem('tam_an_notification_center_items', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: list }));
  }

  public deleteNotification(id: string) {
    if (typeof window === 'undefined') return;
    const list = this.getNotifications().filter(item => item.id !== id);
    localStorage.setItem('tam_an_notification_center_items', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: list }));
  }

  public removeReminderNotifications(reminderId: string) {
    if (typeof window === 'undefined') return;
    const list = this.getNotifications().filter(item => {
      if (item.id === `sched-active-${reminderId}` || item.id === `reminder-sync-${reminderId}` || item.id === `reminder-${reminderId}`) {
        return false;
      }
      if (item.metadata && (item.metadata.id === reminderId || item.metadata.reminderId === reminderId)) {
        return false;
      }
      return true;
    });
    localStorage.setItem('tam_an_notification_center_items', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: list }));
  }

  public clearNotifications() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tam_an_notification_center_items', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: [] }));
  }

  public triggerTestWaterNotification() {
    this.showNotification(
      '💧 Nhắc nhở uống nước định kỳ',
      'Đã đến lúc bổ sung 200 - 250ml nước tinh khiết để thanh lọc tế bào, bảo vệ thận và kích hoạt năng lượng!',
      'water-alert-test',
      'water',
      { amount: 250 }
    );
  }

  public triggerTestMedicationNotification(medName: string = 'Thuốc hạ áp / Bổ dưỡng') {
    this.showNotification(
      `💊 Lịch nhắc uống thuốc: ${medName}`,
      `Đã đến giờ uống thuốc: ${medName} (1 viên) - Dùng sau bữa ăn theo chỉ định của bác sĩ.`,
      'med-alert-test',
      'medication',
      { medName, dosage: '1 viên' }
    );
  }

  public triggerTestVitalsNotification(vitalType: string = 'Huyết áp & SpO2') {
    this.showNotification(
      `🩺 Lịch kiểm tra chỉ số sinh hiệu`,
      `Đã đến giờ đo & ghi lại chỉ số: ${vitalType}. Hãy ngồi nghỉ 5 phút trước khi tiến hành đo.`,
      'vitals-alert-test',
      'vitals',
      { vitalType }
    );
  }

  private fallbackNotification(title: string, options: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (err) {
        console.warn('Native Notification fallback error:', err);
      }
    }
  }

  private playAudioAlert() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Dual gentle chime: Tone 1 (523Hz - C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2 (659Hz - E5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.18);
      gain2.gain.setValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.6);
    } catch (e) {
      // Audio autoplay may be restricted on some devices until user gesture
    }
  }

  private dispatchInAppEvent(type: 'medication' | 'vitals' | 'water', data: any) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('app-health-reminder', {
      detail: { type, data }
    }));
  }
}

export const reminderService = new ReminderService();
