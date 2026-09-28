// Service Worker for BakeryPOS - Offline Support

const CACHE_NAME = 'bakerypos-v1';
const STATIC_CACHE = 'bakerypos-static-v1';
const DYNAMIC_CACHE = 'bakerypos-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Clone the response before caching
            const responseToCache = networkResponse.clone();

            // Cache the fetched response
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return offline page
            return caches.match('/offline.html');
          });
      })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// Sync offline orders
async function syncOrders() {
  const offlineOrders = await getOfflineOrders();
  
  for (const order of offlineOrders) {
    try {
      // Attempt to sync each order
      await syncOrder(order);
      
      // Remove synced order from offline storage
      await removeOfflineOrder(order.id);
    } catch (error) {
      console.error('Failed to sync order:', order.id, error);
    }
  }
}

// Get offline orders from IndexedDB
async function getOfflineOrders() {
  // Implementation would use IndexedDB
  return [];
}

// Sync individual order
async function syncOrder(order) {
  // Implementation would sync with server
  console.log('Syncing order:', order.id);
}

// Remove synced order from offline storage
async function removeOfflineOrder(orderId) {
  // Implementation would remove from IndexedDB
  console.log('Removing synced order:', orderId);
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('BakeryPOS', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
