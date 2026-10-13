// Bác sĩ Tâm An - Service Worker for Background Reminders & Offline PWA
const CACHE_NAME = 'tam-an-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Active reminders in memory of service worker
let scheduledReminders = [];
let nextWaterTimestamp = 0;
let waterIntervalMinutes = 60;
let waterEnabled = false;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// Periodic reminder check in service worker
function checkBackgroundReminders() {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayDateStr = now.toISOString().split('T')[0];
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Check medication & vitals reminders
  if (scheduledReminders && scheduledReminders.length > 0) {
    scheduledReminders.forEach((reminder) => {
      if (!reminder.enabled) return;

      const [rHours, rMins] = (reminder.time || '08:00').split(':').map(Number);
      const reminderTotalMinutes = (isNaN(rHours) ? 8 : rHours) * 60 + (isNaN(rMins) ? 0 : rMins);
      const isDue = reminder.time === currentTimeStr || 
        (reminder.lastTriggeredDate !== todayDateStr && currentTotalMinutes >= reminderTotalMinutes && currentTotalMinutes <= reminderTotalMinutes + 45);

      if (isDue && reminder.lastTriggeredDate !== todayDateStr) {
        reminder.lastTriggeredDate = todayDateStr;
        const text = (reminder.medName || '').toLowerCase();
        const hasMed = reminder.category === 'medication' || /thuốc|dược|kháng sinh|viên|liều|vitamin|siro/i.test(text);
        const hasVital = reminder.category === 'vitals' || ['glucose', 'blood_pressure', 'spo2', 'temperature', 'weight'].includes(reminder.category) || /đo|huyết áp|đường huyết|tiểu đường|glucose|spo2|oxy|thân nhiệt|cân nặng|chỉ số|sinh hiệu/i.test(text);
        const isVitals = hasVital || (!hasMed && text.startsWith('đo'));

        const title = isVitals 
          ? `🩺 Lịch nhắc đo chỉ số: ${reminder.medName} (${reminder.time})`
          : `💊 Lịch nhắc uống thuốc: ${reminder.medName} (${reminder.time})`;
        const body = reminder.dosage 
          ? `Đã đến giờ! ${isVitals ? 'Chỉ số mục tiêu' : 'Liều lượng'}: ${reminder.dosage}.${reminder.notes ? ' Ghi chú: ' + reminder.notes : ''}`
          : (isVitals ? 'Đã đến giờ kiểm tra chỉ số sức khỏe định kỳ.' : 'Đã đến giờ uống thuốc theo lịch cài đặt.');

        self.registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `reminder-${reminder.id}-${todayDateStr}`,
          renotify: true,
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
          data: {
            url: '/',
            type: isVitals ? 'vitals' : 'medication',
            id: reminder.id
          }
        });
      }
    });
  }

  // 2. Check hydration reminder
  if (waterEnabled && nextWaterTimestamp > 0 && Date.now() >= nextWaterTimestamp) {
    nextWaterTimestamp = Date.now() + (waterIntervalMinutes * 60 * 1000);
    self.registration.showNotification('💧 Đã đến giờ uống nước!', {
      body: 'Hãy tiếp thêm tinh chất nước tinh khiết để bồi bổ tế bào và đào thải độc tố cơ thể nhé!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'water-reminder-' + Math.floor(Date.now() / 60000),
      renotify: true,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: {
        url: '/',
        type: 'water'
      }
    });
  }
}

// Check every 15 seconds while service worker is active
setInterval(checkBackgroundReminders, 15000);

// Schedule precise timeouts for upcoming reminders
let activeTimeouts = [];
function scheduleDirectTimeouts() {
  activeTimeouts.forEach(clearTimeout);
  activeTimeouts = [];

  const now = new Date();
  const currentTotalMs = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000;

  if (scheduledReminders && scheduledReminders.length > 0) {
    scheduledReminders.forEach((r) => {
      if (!r.enabled) return;
      const [h, m] = (r.time || '08:00').split(':').map(Number);
      const targetMs = ((isNaN(h) ? 8 : h) * 3600 + (isNaN(m) ? 0 : m) * 60) * 1000;
      const diffMs = targetMs - currentTotalMs;
      if (diffMs > 0 && diffMs <= 86400000) {
        const tid = setTimeout(() => {
          checkBackgroundReminders();
        }, diffMs);
        activeTimeouts.push(tid);
      }
    });
  }
}

// Listen to messages from clients
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SYNC_REMINDERS') {
    scheduledReminders = data.reminders || [];
    waterEnabled = Boolean(data.waterEnabled);
    waterIntervalMinutes = Number(data.waterIntervalMinutes) || 60;
    if (data.nextWaterTimestamp) {
      nextWaterTimestamp = Number(data.nextWaterTimestamp);
    } else if (waterEnabled) {
      nextWaterTimestamp = Date.now() + (waterIntervalMinutes * 60 * 1000);
    }
    // Schedule precise alarms & run immediate check
    scheduleDirectTimeouts();
    checkBackgroundReminders();
  }

  if (data.type === 'TRIGGER_NOTIFICATION') {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'general-notification',
      renotify: true,
      vibrate: data.vibrate || [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: data.data || { url: '/' }
    });
  }
});

// Click notification to open / focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
