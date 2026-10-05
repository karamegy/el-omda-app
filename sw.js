const CACHE_NAME = 'el-omda-exclusive-cache-v23';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icon1-192.png',
  './icon1-512.png'
];

// تثبيت الـ Service Worker بشكل آمن يمنع توقف التثبيت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        urlsToCache.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('فشل تخزين الملف مؤقتاً:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// التعامل الذكي مع الطلبات لمنع ظهور النسخ المحذوفة
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // إذا كان الطلب عبارة عن فتح الصفحة الرئيسية أو التنقل، نجرب الشبكة أولاً
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
           return caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, networkResponse.clone());
             return networkResponse;
           });
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // باقي الملفات (CSS, JS, الصور)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      })
  );
});

// تفعيل وتحديث الكاش وحذف أي نسخ قديمة نهائياً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('el-omda-') && cacheName !== CACHE_NAME) {
            console.log('تم مسح الكاش القديم بالكامل:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
