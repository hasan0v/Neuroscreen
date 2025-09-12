// NeuroScreen PWA Service Worker
const CACHE_NAME = 'neuroscreen-v1.3';
const urlsToCache = [
  '/',
  '/focus',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('NeuroScreen Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('NeuroScreen Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('NeuroScreen Service Worker: All files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('NeuroScreen Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('NeuroScreen Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('NeuroScreen Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('NeuroScreen Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'eeg-data-sync') {
    console.log('NeuroScreen Service Worker: Background sync for EEG data');
    event.waitUntil(syncEEGData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('NeuroScreen Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'NeuroScreen bildirimi',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'neuroscreen-notification',
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/static/icons/open-icon.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/static/icons/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('NeuroScreen', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('NeuroScreen Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for background sync
async function syncEEGData() {
  try {
    // Implement your EEG data sync logic here
    console.log('NeuroScreen Service Worker: Syncing EEG data...');
    // You can add API calls to sync data when connection is restored
  } catch (error) {
    console.error('NeuroScreen Service Worker: Sync failed', error);
  }
}

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});