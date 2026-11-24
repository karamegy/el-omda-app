const CACHE_NAME = 'el-omda-cache-v42';

const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './omda-admin-core.js',
  './omda-pro-core.js',
  './omda-addons-core.js',
  './omda-payments-core.js',
  './omda-export-core.js',
  './privacy-policy.html',
  './manifest.json',
  './icon1-192.png',
  './icon1-512.png'
];

// تثبيت التخزين المؤقت الأساسي فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assetsToCache))
  );
  self.skipWaiting();
});

// تفعيل النسخة الجديدة وحذف أي كاش قديم فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clientsClaim();
});

// استراتيجية ذكية هجينة: سرعة فورية + تحديث صامت + حماية بيانات Firestore
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  const url = new URL(req.url);

  // 1. عدم التدخل نهائياً في طلبات Firebase و Auth و Cloudinary و الخرائط الحية
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic.com') && url.pathname.includes('firebase') ||
    url.hostname.includes('cloudinary.com')
  ) {
    return;
  }

  // 2. مكتبات الأيقونات والخطوط الخارجية (Cache-First لعدم استهلاك الباقة)
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((netRes) => {
            if (netRes && netRes.status === 200) {
              const clone = netRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return netRes;
          })
          .catch(() => new Response('', { status: 503, statusText: 'Offline' }));
      })
    );
    return;
  }

  // 3. صفحة HTML الرئيسية: الشبكة أولاً بحد أقصى 2.5 ثانية لضمان التحديث الفوري دون تعليق
  if (req.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(req, 2500)
        .then((netRes) => {
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return netRes;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // 4. ملفات التطبيق (CSS / JS / JSON / PNG): فتح فوري من الكاش في 0ms + تحديث صامت في الخلفية
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkUpdate = fetch(req)
        .then((netRes) => {
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return netRes;
        })
        .catch(() => cached || new Response('', { status: 503, statusText: 'Offline' }));

      return cached || networkUpdate;
    })
  );
});

// دالة مساعدة لمنع انتظار الشبكة البطيئة
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    fetch(request, { signal: controller.signal })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
