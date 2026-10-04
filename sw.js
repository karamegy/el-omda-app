const CACHE_NAME = 'allaf-feeds-v13'; // تم تحديث الاسم ورقم الإصدار لتطبيق العلاف
const assetsToCache = [
  '/el-omda-app/',
  '/el-omda-app/index.html',
  '/el-omda-app/admin.html',
  '/el-omda-app/Map.html',
  '/el-omda-app/product.html',
  '/el-omda-app/branches.html',
  '/el-omda-app/kitchen-display.html',
  '/el-omda-app/privacy.html',
  '/el-omda-app/rewards.html',
  '/el-omda-app/style.css',
  '/el-omda-app/app.js',
  '/el-omda-app/manifest.json',
  '/el-omda-app/icon1-512.png'
];

// تثبيت السيرفر ووركر وتخزين ملفات تطبيق العلاف
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('🌾 جاري تحديث وتخزين ملفات تطبيق العلاف لتجارة وتوريد الأعلاف...');
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
            console.log('تطهير الكاش القديم:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// جلب الملفات مع استثناء طلبات Firebase السحابية لضمان مزامنة البيانات الحية
self.addEventListener('fetch', event => {
  const reqUrl = event.request.url;

  // تجاوز طلبات قواعد البيانات السحابية
  if (reqUrl.includes('firestore.googleapis.com') || 
      reqUrl.includes('firebase') || 
      reqUrl.includes('google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
