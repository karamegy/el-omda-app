const CACHE_NAME = 'el-omda-exclusive-cache-v11';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icon1-192.png',
  './icon1-512.png'
];

// تثبيت الـ Service Worker وتخزين الملفات الخاصة بتطبيق العمدة
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

// التعامل مع الطلبات لجلب الملفات من الكاش أو الشبكة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// تفعيل وتحديث الكاش وحذف النسخ القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('el-omda-') && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
