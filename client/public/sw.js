self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : { title: 'ActionPilot Alert', message: 'New companion update.' };
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
          url: '/'
        }
      })
    );
  } catch (error) {
    console.error('[ServiceWorker] Push event handling failed:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
