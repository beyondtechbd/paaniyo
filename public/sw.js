// Paaniyo Service Worker
// Provides offline support for the water tracker PWA

const CACHE_NAME = 'paaniyo-v1';
const OFFLINE_URL = '/tracker/offline';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/tracker',
  '/tracker/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache precache assets
      await cache.addAll(PRECACHE_ASSETS);
      // Force activation
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // Take control of all clients
      await self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first for navigation
          const networkResponse = await fetch(request);
          
          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (error) {
          // Network failed, try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Return offline page for tracker routes
          if (url.pathname.startsWith('/tracker')) {
            const offlineResponse = await caches.match(OFFLINE_URL);
            if (offlineResponse) {
              return offlineResponse;
            }
          }
          
          // Return a basic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })()
    );
    return;
  }

  // Handle static assets (cache-first strategy)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      (async () => {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network
        try {
          const networkResponse = await fetch(request);
          
          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (error) {
          // Return empty response for failed static assets
          return new Response('', { status: 404 });
        }
      })()
    );
    return;
  }

  // Handle API requests (network-only with offline queue)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (error) {
          // For tracker API, we could queue the request for later
          // For now, return error response
          return new Response(
            JSON.stringify({ error: 'Offline', offline: true }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })()
    );
    return;
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, badge, data: notificationData } = data;

  const options = {
    body: body || 'Time to drink water! 💧',
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: notificationData || {},
    actions: [
      {
        action: 'log',
        title: 'Log Water',
        icon: '/icons/action-log.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Paaniyo Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  let url = '/tracker';

  if (action === 'log') {
    url = '/tracker?action=log';
  } else if (notificationData?.url) {
    url = notificationData.url;
  }

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes('/tracker') && 'focus' in client) {
          await client.focus();
          if (action === 'log') {
            client.postMessage({ type: 'LOG_WATER' });
          }
          return;
        }
      }
      
      // Open new window
      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })()
  );
});

// Handle background sync for offline water logging
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-water-logs') {
    event.waitUntil(syncWaterLogs());
  }
});

// Sync queued water logs when back online
async function syncWaterLogs() {
  try {
    // Get queued logs from IndexedDB
    const db = await openDatabase();
    const logs = await getQueuedLogs(db);

    for (const log of logs) {
      try {
        const response = await fetch('/api/tracker/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log.data),
        });

        if (response.ok) {
          await removeQueuedLog(db, log.id);
        }
      } catch (error) {
        // Keep in queue for next sync
        console.error('Failed to sync log:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('paaniyo-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('water-logs')) {
        db.createObjectStore('water-logs', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getQueuedLogs(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('water-logs', 'readonly');
    const store = transaction.objectStore('water-logs');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeQueuedLog(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('water-logs', 'readwrite');
    const store = transaction.objectStore('water-logs');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
