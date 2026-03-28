// Service Worker for NeuroStep PWA
// Uses Network-First strategy to ensure fresh content

const CACHE_NAME = 'neurostep-v2'; // Incremented to force cache refresh
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install event - skip caching to ensure fresh content
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v2...');
    // Force immediate activation
    self.skipWaiting();
});

// Activate event - clear ALL old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v2...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    console.log('[SW] Deleting cache:', name);
                    return caches.delete(name);
                })
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Fetch event - NETWORK FIRST strategy
// Always try network first, only use cache as fallback
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip API requests (Firebase, etc.)
    if (event.request.url.includes('firestore') ||
        event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis')) {
        return;
    }

    event.respondWith(
        // Try network first
        fetch(event.request)
            .then((networkResponse) => {
                // Optionally cache for offline use
                if (event.request.method === 'GET' && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Offline fallback for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data === 'clearCache') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => caches.delete(name))
            );
        });
    }
});
