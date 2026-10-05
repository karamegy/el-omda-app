const CACHE_NAME = 'el-omda-cache-v27';
const assetsToCache = [
  '/el-omda-app/',
  '/el-omda-app/index.html',
  '/el-omda-app/style.css',
  '/el-omda-app/app.js'
];

// تثبيت التخزين المؤقت الأساسي
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم فتح التخزين المؤقت بنجاح');
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل وتحديث النسخ القديمة وحذفها فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('حذف التخزين المؤقت القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clientsClaim();
});

// جلب الملفات
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/el-omda-app/index.html');
        }
      });
    })
  );
});
