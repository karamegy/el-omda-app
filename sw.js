const CACHE_NAME = 'omda-grills-v12'; // تم رفع الإصدار لتضمين صفحة promo.html الجديدة وتحديث الكاش
const assetsToCache = [
  '/el-omda-app/',
  '/el-omda-app/index.html',
  '/el-omda-app/admin.html',
  '/el-omda-app/Map.html',
  '/el-omda-app/product.html',
  '/el-omda-app/branches.html',
  '/el-omda-app/kitchen-display.html',
  '/el-omda-app/privacy.html',
  '/el-omda-app/promo.html', // تمت إضافة صفحة العروض والبرومو كود إلى الكاش
  '/el-omda-app/rewards.html',
  '/el-omda-app/style.css',
  '/el-omda-app/app.js',
  '/el-omda-app/manifest.json',
  '/el-omda-app/icon1-512.png'
];

// تثبيت السيرفر ووركر وتخزين الملفات الجديدة
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('جاري تحديث وتخزين ملفات التطبيق وتشمل صفحة البرومو...');
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
