const CACHE_NAME = 'el-omda-cache-v28';
const assetsToCache = [
  '/el-omda-app/',
  '/el-omda-app/index.html',
  '/el-omda-app/style.css',
  '/el-omda-app/app.js',
  '/el-omda-app/manifest.json'
];

// تثبيت التخزين المؤقت الأساسي
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clientsClaim();
});

// جلب الملفات (استراتيجية الشبكة أولاً لملفات التطبيق لضمان التحديث الفوري)
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET (مثل رفع الصور لـ Cloudinary وطلبات Firestore)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/el-omda-app/index.html');
          }
        });
      })
  );
});
