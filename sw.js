const CACHE_NAME = 'el-omda-cache-v1';
const assetsToCache = [
  '/el-omda-app/',
  '/el-omda-app/index.html',
  '/el-omda-app/style.css',
  '/el-omda-app/app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// تثبيت التخزين المؤقت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم فتح التخزين المؤقت بنجاح');
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل وتحديث النسخ القديمة
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

// جلب الملفات (استراتيجية الشبكة أولاً ثم التخزين المؤقت أو العكس حسب الحاجة)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // في حال انقطاع الإنترنت تماماً
        if (event.request.mode === 'navigate') {
          return caches.match('/el-omda-app/index.html');
        }
      });
    })
  );
});
