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

  // 1. Check medication & vitals reminders
  if (scheduledReminders && scheduledReminders.length > 0) {
    scheduledReminders.forEach((reminder) => {
      if (!reminder.enabled) return;
      if (reminder.time === currentTimeStr && reminder.lastTriggeredDate !== todayDateStr) {
        reminder.lastTriggeredDate = todayDateStr;
        const title = `⏰ Nhắc nhở: ${reminder.medName}`;
        const body = reminder.dosage 
          ? `Đã đến giờ! Liều lượng/Chỉ số: ${reminder.dosage}.${reminder.notes ? ' Ghi chú: ' + reminder.notes : ''}`
          : `Đã đến giờ theo dõi sức khỏe theo lịch cài đặt.`;

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
            type: 'medication',
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

// Check every 20 seconds while service worker is alive
setInterval(checkBackgroundReminders, 20000);

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
    // Perform an immediate check
    checkBackgroundReminders();
  }

  if (data.type === 'TRIGGER_NOTIFICATION') {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'general-notification',
      renotify: true,
      vibrate: data.vibrate || [200, 100, 200],
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
