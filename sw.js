const CACHE_NAME = 'el-omda-exclusive-cache-v18';
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

// التعامل مع الطلبات باستخدام استراتيجية الشبكة أولاً (Network-First)
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات التي ليست من نوع http أو https
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // إذا كان هناك إنترنت، يتم جلب النسخة الأحدث وتحديث الكاش بها في الخلفية
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // إذا انقطع الإنترنت تماماً، يتم الرجوع إلى النسخة المحفوظة في الكاش
        return caches.match(event.request);
      })
  );
});

// تفعيل وتحديث الكاش وحذف النسخ القديمة تلقائياً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('el-omda-') && cacheName !== CACHE_NAME) {
            console.log('تم حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
