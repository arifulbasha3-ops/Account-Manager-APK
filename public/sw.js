// KILL SWITCH SERVICE WORKER
// This worker replaces the old caching worker.
// It deletes all caches and forces network-only requests.

const CACHE_NAME = 'smartspend-cleanup-final';

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
  console.log('Cleanup Service Worker Installed');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all pages immediately
      self.clients.claim(),
      // Delete ALL caches found
      caches.keys().then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          })
        );
      })
    ])
  );
  console.log('Cleanup Service Worker Activated - Caches Cleared');
});

self.addEventListener('fetch', (event) => {
  // Network Only - bypass cache completely
  event.respondWith(fetch(event.request));
});