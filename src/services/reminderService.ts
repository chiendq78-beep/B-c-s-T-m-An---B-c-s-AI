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
    } else {
      this.nextWaterTimestamp = 0;
      localStorage.removeItem('waterReminderNextTimestamp');
    }
    this.syncToServiceWorker();
  }

  public setReminders(reminders: ScheduledReminderItem[]) {
    this.reminders = reminders;
    this.syncToServiceWorker();
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
      this.reminders = [];
      this.syncToServiceWorker();
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
        this.syncToServiceWorker();
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

    // 1. Check Medication & Vitals reminders
    if (this.reminders && this.reminders.length > 0) {
      this.reminders.forEach((r) => {
        if (!r.enabled) return;
        const lastKey = `lastTriggered_${r.id}_${todayDateStr}`;
        const alreadyTriggered = localStorage.getItem(lastKey);

        if (r.time === currentTimeStr && !alreadyTriggered) {
          localStorage.setItem(lastKey, 'true');
          const title = `⏰ Nhắc nhở: ${r.medName}`;
          const body = r.dosage
            ? `Đã đến giờ! Chỉ số/Liều lượng: ${r.dosage}.${r.notes ? ' Ghi chú: ' + r.notes : ''}`
            : `Đã đến giờ theo dõi sức khỏe theo lịch cài đặt.`;

          this.showNotification(title, body, `reminder-${r.id}`);
          this.playAudioAlert();
          this.dispatchInAppEvent('medication', r);
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
          '💧 Đã đến giờ uống nước!',
          'Hãy tiếp thêm tinh chất nước tinh khiết để bồi bổ tế bào và đào thải độc tố cơ thể nhé!',
          'water-alert'
        );
        this.playAudioAlert();
        this.dispatchInAppEvent('water', { interval: this.waterIntervalMinutes });
      }
    }
  }

  public showNotification(title: string, body: string, tag: string = 'health-reminder') {
    if (typeof window === 'undefined') return;

    const options: any = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: { url: '/' }
    };

    // Priority 1: ServiceWorker showNotification (delivers to mobile/tablet notification shade)
    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      this.swRegistration.showNotification(title, options).catch((err) => {
        console.warn('swRegistration.showNotification failed, trying fallback:', err);
        this.fallbackNotification(title, options);
      });
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        title,
        body,
        icon: '/icon-192.png',
        tag
      });
    } else {
      this.fallbackNotification(title, options);
    }
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

  private dispatchInAppEvent(type: 'medication' | 'water', data: any) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('app-health-reminder', {
      detail: { type, data }
    }));
  }
}

export const reminderService = new ReminderService();
