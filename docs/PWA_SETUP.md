# AeroBlood Progressive Web Application (PWA) System Architecture

This document describes the offline-first caching, app installation, and service worker protocols designed to make **AeroBlood** operational across iOS, Android, and desktop browsers, in compliance with standard Progressive Web Application specifications.

---

## 1. Web App Manifest (`manifest.json`)

To enable "Add to Home Screen" behaviors, define a standard manifest file at `public/manifest.json`.

```json
{
  "short_name": "AeroBlood",
  "name": "AeroBlood National Blood Intelligence Grid",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "any maskable"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#DC2626",
  "background_color": "#FFFFFF",
  "orientation": "portrait-primary"
}
```

---

## 2. Service Worker Registration (`sw.js`)

Implement basic background network proxy intercepting and caching of local static assets (JS, CSS, SVGs, Google web fonts) to reduce cold start visual load times.

```javascript
// public/sw.js
const CACHE_NAME = 'aeroblood-static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching Core Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event (Cleanup Old Caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing Stale Cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Intercept Requests (Stale-While-Revalidate Strategy)
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/S requests (ignore chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        return null;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
```

---

## 3. Registering Service Worker in React Frontend

Inject the service worker registration sequence at the entry point (`src/main.tsx` or `src/App.tsx` hook):

```typescript
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[SW] Registered successfully with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[SW] Registration failed:', err);
        });
    });
  }
}
```
