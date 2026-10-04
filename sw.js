const CACHE_NAME = 'allaf-feeds-v26'; // تحديث رقم الإصدار لتفريغ الكاش القديم
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
      console.log('🌾 جاري تحديث وتخزين ملفات تطبيق العلاف...');
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

// جلب الملفات مع معالجة ذكية لضمان عمل الـ PWA ومعاملات البحث بسلاسة
self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);

  // 1. تجاوز طلبات قواعد البيانات السحابية وخدمات جوجل بالكامل
  if (reqUrl.hostname.includes('firestore.googleapis.com') || 
      reqUrl.hostname.includes('firebase') || 
      reqUrl.hostname.includes('google.com') ||
      reqUrl.hostname.includes('googleapis.com')) {
    return;
  }

  // 2. إذا كان الطلب عبارة عن إعادة توجيه من جوجل أو صفحة تنقل
  if (event.request.mode === 'navigate' || reqUrl.search.includes('code=') || reqUrl.search.includes('state=')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // 3. باقي الملفات الثابتة تسحب من الكاش مع تجاهل معاملات البحث لضمان عدم فشل الـ start_url والـ IDs
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return response || fetch(event.request);
    })
  );
});
