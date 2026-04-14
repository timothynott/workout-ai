// Minimal service worker for PWA installability.
// No caching strategy — offline support is not required for this app.
// See docs/todo.md Phase 8 for the PWA install prompt polish pass.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
