const CACHE_NAME = 'allaf-feeds-v19'; // تم التحديث ليتوافق مع أحدث إصدار وقاعدة بيانات المزارع
const assetsToCache = [
  './',
  './index.html',
  './admin.html',
  './Map.html',
  './product.html',
  './branches.html',
  './kitchen-display.html',
  './privacy.html',
  './rewards.html',
  './convert.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon1-512.png',
   './icon1-192.png',
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

  // تجاوز طلبات قواعد البيانات السحابية وخدمات جوجل
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
