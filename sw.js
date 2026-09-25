const CACHE_NAME = 'omda-grills-v3';
const assetsToCache = [
  './index.html',
  './admin.html',
  './Map.html',
  './product.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon1-512.png'
];

// تثبيت السيرفر ووركر وتخزين الملفات الجديدة
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('جاري تحديث وتخزين ملفات تطبيق مشويات العمدة...');
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل السيرفر ووركر وتنظيف التخزين القديم بالكامل
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('حذف التخزين القديم:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// جلب الملفات من الكاش أو الشبكة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
