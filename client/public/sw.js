/**
 * Service Worker pour PWA - Cache stratégique et offline support
 * Version: 1.0.0
 */

const CACHE_NAME = 'typingpvp-v1';
const RUNTIME_CACHE = 'typingpvp-runtime-v1';

// Ressources à mettre en cache immédiatement (shell app)
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  '/favicon.svg'
];

// Installer le Service Worker et mettre en cache les ressources statiques
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS).catch((error) => {
        console.warn('[SW] Failed to cache some static assets:', error);
        // Continuer même si certains fichiers échouent
        return Promise.resolve();
      });
    })
  );
  
  // Activer immédiatement le nouveau service worker
  self.skipWaiting();
});

// Activer le Service Worker et nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prendre le contrôle de toutes les pages
  return self.clients.claim();
});

// Stratégie de cache : Network First avec fallback Cache
// Pour les requêtes API et données dynamiques
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes Socket.io
  if (url.pathname.startsWith('/socket.io/')) {
    return;
  }
  
  // Ignorer les requêtes vers des domaines externes (sauf ressources statiques)
  if (url.origin !== self.location.origin) {
    // Permettre les ressources statiques externes (fonts, etc.)
    if (url.pathname.includes('.woff') || url.pathname.includes('.woff2') || url.pathname.includes('.ttf')) {
      event.respondWith(
        caches.open(RUNTIME_CACHE).then((cache) => {
          return cache.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return fetch(request).then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            });
          });
        })
      );
    }
    return;
  }
  
  // Stratégie pour les pages HTML : Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache la réponse si valide
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback vers le cache si réseau indisponible
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback vers index.html pour SPA
            return caches.match('/index.html');
          });
        })
    );
    return;
  }
  
  // Stratégie pour les assets statiques (images, CSS, JS) : Cache First
  if (
    request.url.match(/\.(jpg|jpeg|png|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i) ||
    url.pathname.startsWith('/uploads/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Stratégie pour les API : Network First avec cache court
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache seulement les réponses GET réussies
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              // Cache avec expiration (TTL court pour données dynamiques)
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback vers le cache si réseau indisponible
          return caches.match(request);
        })
    );
    return;
  }
  
  // Par défaut : Network First
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Gérer les messages depuis l'application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    caches.delete(RUNTIME_CACHE);
  }
});

