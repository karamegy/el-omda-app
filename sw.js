const CACHE_NAME = 'el-omda-exclusive-cache-v21';
const urlsToCache = [
  '/el-omda-app/',
  '/el-omda-app/index.html',
  '/el-omda-app/style.css',
  '/el-omda-app/app.js',
  '/el-omda-app/icon1-192.png',
  '/el-omda-app/icon1-512.png'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('تم فتح الكاش الخاص بمنصة العمدة بنجاح');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// التعامل الذكي مع الطلبات لمنع ظهور النسخ المحذوفة
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // إذا كان الطلب عبارة عن فتح الصفحة الرئيسية أو التنقل، نجرب الشبكة أولاً وبقوة
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
          return caches.match('/el-omda-app/index.html');
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
          // إذا فشلت الشبكة، نرجع النسخة المخزنة إن وجدت
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
