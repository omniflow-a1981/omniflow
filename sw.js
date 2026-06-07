// OmniFlow Service Worker — Offline Cache
const CACHE = 'omniflow-v3';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install: cache core assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS).catch(function(){
        // If some assets fail, still install
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', function(e){
  // Skip Supabase API calls — always need live data
  if(e.request.url.includes('supabase.co') ||
     e.request.url.includes('/api/') ||
     e.request.method !== 'GET'){
    return;
  }

  e.respondWith(
    fetch(e.request).then(function(response){
      // Cache successful responses
      if(response && response.status === 200){
        var clone = response.clone();
        caches.open(CACHE).then(function(cache){
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function(){
      // Offline: serve from cache
      return caches.match(e.request).then(function(cached){
        return cached || caches.match('./index.html');
      });
    })
  );
});
