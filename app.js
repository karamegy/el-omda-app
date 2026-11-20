import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where, orderBy, limit, enableIndexedDbPersistence, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === التسجيل التلقائي والـ Service Worker ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/el-omda-app/sw.js', { scope: '/el-omda-app/' }).catch((error) => console.log('ServiceWorker registration error: ', error));
  });
}

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCU--Klxwfg7pDinUgS0UEde9cpmmsrDRM",
  authDomain: "omda-a750f.firebaseapp.com",
  projectId: "omda-a750f",
  storageBucket: "omda-a750f.firebasestorage.app",
  messagingSenderId: "1078714497381",
  appId: "1:1078714497381:android:9430672b84226b0a46898c"
};

// === إعدادات Cloudinary المجانية لرفع الصور والفيديوهات ===
const CLOUDINARY_CLOUD_NAME = "s5gtopg0";
const CLOUDINARY_UPLOAD_PRESET = "omda_media";

const GOOGLE_WEB_CLIENT_ID = "1078714497381-i2q7tsf02r39dq5m1mp5ndd66sltmced.apps.googleusercontent.com";

// بيانات التواصل المباشر للتصدير B2B
const EXPORT_WHATSAPP_NUMBER = "201114099799"; 
const EXPORT_PHONE_NUMBER = "+201114099799";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// === دالة حماية النصوص ومنع كسر التصميم (XSS Guard) ===
// ==========================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================
// === مراقبة حالة الاتصال (أونلاين / أوفلاين) ===
// ==========================================
function updateNetworkBadge() {
    const badge = document.getElementById('networkStatusBadge');
    if (!badge) return;
    if (navigator.onLine) {
        badge.classList.remove('offline');
        badge.classList.add('online');
        badge.title = t('متصل بالإنترنت - مزامنة فورية', 'Online - Live Sync');
    } else {
        badge.classList.remove('online');
        badge.classList.add('offline');
        badge.title = t('وضع الأوفلاين - البيانات محفوظة محلياً', 'Offline Mode - Local Cache Active');
    }
}
window.addEventListener('online', updateNetworkBadge);
window.addEventListener('offline', updateNetworkBadge);

// ==========================================
// === نظام الترجمة الموحد المتوافق مع index.html ===
// ==========================================
let currentLang = localStorage.getItem('omda_lang') || 'ar';

const UI_TEXT_MAP = {
    ar: {
        page_title: "منصة العمدة للأعلاف والحبوب - المتجر المتكامل",
        brand_sub: "مؤسسة",
        brand_title: "الإخلاص",
        brand_tagline: "للأعلاف الطبيعية والحبوب",
        drawer_brand: "مؤسسة الإخلاص",
        nav_home_store: "الرئيسية والمتجر",
        nav_cats_full: "أقسام الأعلاف والحبوب",
        nav_profile_track: "حسابي وتتبع الشحنات",
        nav_admin_panel: "لوحة تحكم الإدارة",
        nav_notifs: "الإشعارات والرسائل",
        cart_title: "سلة المشتريات",
        switch_lang_text: "Switch to English",
        privacy_policy: "سياسة الخصوصية والأمان",
        all_products: "كل المنتجات",
        hero_title: "اجعل مشروعك الحيواني في صدارة الإنتاج",
        hero_desc: "أجود أنواع الأعلاف والحبوب المعتمدة لتوفير أقصى تغذية وأعلى أرباح.",
        featured_badge: "عرض متطور",
        featured_products: "المنتجات المميزة والمنشورات الحالية",
        featured_sub: "انقر على أي منتج لمشاهدة الصور/الفيديوهات، التفاصيل، وحجز الكمية",
        load_more_btn: "عرض المزيد من المنتجات",
        browse_cats_title: "تصفح حسب أقسام الأعلاف والحبوب",
        browse_cats_sub: "اختر القسم لعرض المنتجات التابعة له مباشرة",
        profile_header: "حسابي الشخصي وتتبع الشحنات",
        email_label: "البريد الإلكتروني:",
        saved_phone: "رقم الهاتف المحفوظ:",
        account_role: "رتبة الحساب:",
        track_shipment_title: "تتبع شحنتك وسيارة التوصيل برقم الفاتورة",
        track_btn: "تتبع الشحنة",
        my_invoices_title: "فواتيري وحساباتي السابقة",
        delivery_loc_title: "تحديد موقع التوصيل الخاص بك",
        locate_me_btn: "تحديد موقعي الحالي تلقائياً (GPS)",
        save_loc_btn: "حفظ موقع التوصيل",
        live_chat_title: "المحادثة المباشرة مع إدارة المنصة",
        live_chat_sub: "يمكنك كتابة استفساراتك واستقبال الردود المباشرة واللحظية من الإدارة هنا.",
        send_btn: "إرسال",
        bnav_home: "الرئيسية",
        bnav_menu: "القائمة",
        bnav_cats: "الأقسام",
        bnav_profile: "حسابي",
        prod_details_title: "تفاصيل المنتج",
        cart_items_count: "عدد العناصر:",
        cart_grand_total: "المجموع الإجمالي:",
        currency: "ج.م",
        checkout_phone_label: "رقم الهاتف للتواصل والشحن (مطلوب):",
        payment_method_label: "طريقة الدفع المفضلة:",
        pay_cash: "نقدي عند الاستلام / إلكتروني",
        pay_credit: "آجل (حساب ائتماني)",
        checkout_btn: "إتمام الطلب وإصدار الفاتورة",
        rfq_modal_title: "طلب عرض سعر تصدير (B2B)",
        rfq_min_qty_label: "الحد الأدنى للطلب:",
        rfq_wa_btn: "واتساب التصدير",
        rfq_call_btn: "اتصال مباشر",
        rfq_or_form: "أو أرسل تفاصيل طلبك رسمياً وسيتم التواصل معك",
        rfq_company_label: "اسم الشركة / الجهة المستوردة",
        rfq_dest_label: "دولة وميناء الوصول المستهدف",
        rfq_qty_label: "الكمية المطلوبة (بالطن)",
        rfq_incoterm_label: "شرط التسليم المفضّل",
        rfq_phone_label: "رقم هاتف التواصل (مع الكود الدولي)",
        rfq_submit_btn: "إرسال طلب عرض السعر",
        inv_modal_title: "معاينة الفاتورة الإلكترونية",
        save_img_btn: "حفظ كصورة",
        print_inv_btn: "طباعة الفاتورة",
        close_btn: "إغلاق",
        no_notifs: "لا توجد إشعارات حالياً.",
        auth_modal_title: "تسجيل الدخول إلى حسابك",
        google_login_btn: "تسجيل الدخول باستخدام جوجل",
        or_email: "أو بالبريد الإلكتروني",
        email_input_label: "البريد الإلكتروني",
        password_input_label: "كلمة المرور",
        login_submit_btn: "تسجيل الدخول"
    },
    en: {
        page_title: "Al-Omda Feed & Grains Platform - Integrated Store",
        brand_sub: "Establishment",
        brand_title: "Al-Ekhlas",
        brand_tagline: "For Natural Feed & Grains",
        drawer_brand: "Al-Ekhlas Est.",
        nav_home_store: "Home & Store",
        nav_cats_full: "Feed & Grain Categories",
        nav_profile_track: "My Account & Shipment Tracking",
        nav_admin_panel: "Admin Control Panel",
        nav_notifs: "Notifications & Messages",
        cart_title: "Shopping Cart",
        switch_lang_text: "التبديل إلى العربية",
        privacy_policy: "Privacy & Security Policy",
        all_products: "All Products",
        hero_title: "Put Your Livestock Project at the Forefront of Production",
        hero_desc: "Finest certified feeds and grains for maximum nutrition and highest profits.",
        featured_badge: "Featured Offer",
        featured_products: "Featured Products & Current Posts",
        featured_sub: "Click any product to view photos/videos, details, and reserve quantity",
        load_more_btn: "Load More Products",
        browse_cats_title: "Browse by Feed & Grain Categories",
        browse_cats_sub: "Select a category to view its products directly",
        profile_header: "My Account & Shipment Tracking",
        email_label: "Email:",
        saved_phone: "Saved Phone:",
        account_role: "Account Role:",
        track_shipment_title: "Track Your Shipment & Delivery Vehicle by Invoice #",
        track_btn: "Track Shipment",
        my_invoices_title: "My Invoices & Past Orders",
        delivery_loc_title: "Set Your Delivery Location",
        locate_me_btn: "Auto-Detect My Current Location (GPS)",
        save_loc_btn: "Save Delivery Location",
        live_chat_title: "Live Chat with Platform Management",
        live_chat_sub: "Write your inquiries and receive live, instant responses from management here.",
        send_btn: "Send",
        bnav_home: "Home",
        bnav_menu: "Menu",
        bnav_cats: "Categories",
        bnav_profile: "Profile",
        prod_details_title: "Product Details",
        cart_items_count: "Items Count:",
        cart_grand_total: "Grand Total:",
        currency: "EGP",
        checkout_phone_label: "Contact & Shipping Phone (Required):",
        payment_method_label: "Preferred Payment Method:",
        pay_cash: "Cash on Delivery / Electronic",
        pay_credit: "Credit Account",
        checkout_btn: "Complete Order & Issue Invoice",
        rfq_modal_title: "Export Request for Quotation (B2B)",
        rfq_min_qty_label: "Minimum Order Quantity:",
        rfq_wa_btn: "Export WhatsApp",
        rfq_call_btn: "Direct Call",
        rfq_or_form: "Or submit your official inquiry details and we will contact you",
        rfq_company_label: "Company / Importer Name",
        rfq_dest_label: "Destination Country & Port",
        rfq_qty_label: "Required Quantity (Tons)",
        rfq_incoterm_label: "Preferred Incoterm",
        rfq_phone_label: "Contact Phone (with Country Code)",
        rfq_submit_btn: "Submit Quotation Request",
        inv_modal_title: "Electronic Invoice Preview",
        save_img_btn: "Save as Image",
        print_inv_btn: "Print Invoice",
        close_btn: "Close",
        no_notifs: "No notifications currently.",
        auth_modal_title: "Sign In to Your Account",
        google_login_btn: "Sign in with Google",
        or_email: "Or with Email",
        email_input_label: "Email Address",
        password_input_label: "Password",
        login_submit_btn: "Sign In"
    }
};

const UI_PLACEHOLDER_MAP = {
    ar: {
        search_placeholder: "ابحث عن الأعلاف، الحبوب، المكملات...",
        track_input_ph: "أدخل رقم الفاتورة أو الطلب",
        chat_input_ph: "اكتب رسالتك للإدارة هنا...",
        rfq_company_ph: "مثال: شركة الخليج للتنمية الزراعية",
        rfq_dest_ph: "مثال: السعودية - ميناء جدة الإسلامي"
    },
    en: {
        search_placeholder: "Search for feeds, grains, supplements...",
        track_input_ph: "Enter invoice or order number",
        chat_input_ph: "Type your message to management here...",
        rfq_company_ph: "e.g., Gulf Agricultural Development Co.",
        rfq_dest_ph: "e.g., Saudi Arabia - Jeddah Islamic Port"
    }
};

function t(arText, enText) {
    return currentLang === 'en' ? enText : arText;
}

function getProdDisplayName(prod) {
    if (!prod) return '';
    return (currentLang === 'en' && prod.nameEn) ? prod.nameEn : (prod.name || '');
}

function getCatDisplayName(cat) {
    if (!cat) return '';
    return (currentLang === 'en' && cat.nameEn) ? cat.nameEn : (cat.name || '');
}

function updateAuthButtonLabel() {
    const btn = document.getElementById('authBtn');
    if (!btn) return;
    if (currentUser) {
        btn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> ${t('تسجيل الخروج', 'Sign Out')}`;
    } else {
        btn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> ${t('تسجيل الدخول', 'Sign In')}`;
    }
}

window.applyAppLanguage = function(lang) {
    currentLang = (lang === 'en') ? 'en' : 'ar';
    localStorage.setItem('omda_lang', currentLang);

    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'en' ? 'ltr' : 'rtl';

    const dict = UI_TEXT_MAP[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) {
            const iconChild = el.querySelector('i');
            if (iconChild && el.children.length === 1) {
                el.innerHTML = `${iconChild.outerHTML} ${dict[key]}`;
            } else {
                el.textContent = dict[key];
            }
        }
    });

    const phDict = UI_PLACEHOLDER_MAP[currentLang];
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (phDict[key] !== undefined) {
            el.setAttribute('placeholder', phDict[key]);
        }
    });

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.innerHTML = currentLang === 'ar'
            ? '<i class="fa-solid fa-language"></i> EN'
            : '<i class="fa-solid fa-language"></i> عربي';
    }

    updateAuthButtonLabel();
    updateNetworkBadge();

    if (allCategoriesCache.length > 0) renderCategoriesUI();
    if (allProductsCache.length > 0) {
        const activeCat = document.querySelector('.cat-chip.active')?.dataset.cat || 'all';
        const currentSearch = document.getElementById('searchInput')?.value || '';
        renderProducts(activeCat, currentSearch);
        startProductCarousel();
    }
    updateCartUI();
};

window.toggleAppLanguage = function() {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    applyAppLanguage(nextLang);
};
window.toggleLanguage = window.toggleAppLanguage;

// ==========================================
// === التحكم في القائمة الجانبية (Drawer Menu) ===
// ==========================================
window.openSideMenu = function() {
    document.getElementById('sideMenuDrawer')?.classList.add('open');
    document.getElementById('drawerOverlay')?.classList.add('open');
};

window.closeSideMenu = function() {
    document.getElementById('sideMenuDrawer')?.classList.remove('open');
    document.getElementById('drawerOverlay')?.classList.remove('open');
};

document.getElementById('closeDrawerBtn')?.addEventListener('click', closeSideMenu);
document.getElementById('drawerOverlay')?.addEventListener('click', closeSideMenu);

document.getElementById('toggleSearchBtn')?.addEventListener('click', () => {
    const searchInputElem = document.getElementById('searchInput');
    if (searchInputElem) {
        searchInputElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInputElem.focus();
    }
});

// ==========================================
// === محرك IndexedDB للفتح اللحظي وتوفير القراءات ===
// ==========================================
const OmdaLocalDB = {
    dbName: 'OmdaSpeedDB',
    version: 1,
    _dbPromise: null,
    open() {
        if (this._dbPromise) return this._dbPromise;
        this._dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, this.version);
            req.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains('cache')) {
                    database.createObjectStore('cache');
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        return this._dbPromise;
    },
    async set(key, val) {
        try {
            const database = await this.open();
            return new Promise((resolve) => {
                const tx = database.transaction('cache', 'readwrite');
                tx.objectStore('cache').put(val, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    },
    async get(key, fallback = []) {
        try {
            const database = await this.open();
            return new Promise((resolve) => {
                const tx = database.transaction('cache', 'readonly');
                const req = tx.objectStore('cache').get(key);
                req.onsuccess = () => resolve(req.result !== undefined ? req.result : fallback);
                req.onerror = () => resolve(fallback);
            });
        } catch (e) {
            return fallback;
        }
    }
};

enableIndexedDbPersistence(db, { forceOwnership: false }).catch((err) => {
    console.warn("تنبيه وضع الأوفلاين لـ Firestore: ", err.code);
});

const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let currentUserRole = 'customer';
let userSavedPhone = '';

let cart = JSON.parse(localStorage.getItem('omda_cart') || '[]');
let allProductsCache = [];
let allCategoriesCache = [];
let ordersCache = {};
let productsBatchLimit = 40;
let unsubscribeProducts = null;

let userMap = null;
let adminMap = null;
let userMarker = null;
let adminMapMarkersGroup = null;
let selectedLat = 30.0444; 
let selectedLng = 31.2357;
let carouselInterval = null;

let editingOldMediaUrl = '';
let editingOldMediaType = 'image';
let newVehLat = 30.0444;
let newVehLng = 31.2357;

// متغيرات نظام الشات المحسن والموفر للقراءات
let activeAdminChatEmail = null;
let activeAdminChatPhone = '';
let unsubscribeUserChat = null;
let unsubscribeAdminRecentChats = null;
let unsubscribeActiveAdminThread = null;
let recentAdminChatsCache = [];
let activeAdminThreadMessages = [];

// DOM Elements
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.querySelector('.close-auth-modal');
const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const adminBtn = document.getElementById('adminBtn');
const profileBtn = document.getElementById('profileBtn');
const cartBtnHeader = document.getElementById('cartBtnHeader');
const cartModal = document.getElementById('cartModal');
const closeModal = document.querySelector('.close-modal');
const productsGrid = document.getElementById('productsGrid');
const addProductForm = document.getElementById('addProductForm');
const addCategoryForm = document.getElementById('addCategoryForm');
const cancelCatEditBtn = document.getElementById('cancelCatEditBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const searchInput = document.getElementById('searchInput');
const saveLocationBtn = document.getElementById('saveLocationBtn');
const locateMeBtn = document.getElementById('locateMeBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const invoiceModal = document.getElementById('invoiceModal');
const trackInvoiceBtn = document.getElementById('trackInvoiceBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationsModal = document.getElementById('notificationsModal');
const sendNotificationForm = document.getElementById('sendNotificationForm');
const addVehicleForm = document.getElementById('addVehicleForm');
const cancelVehicleEditBtn = document.getElementById('cancelVehicleEditBtn');
const refreshAdminMapBtn = document.getElementById('refreshAdminMapBtn');

const userSendChatForm = document.getElementById('userSendChatForm');
const adminSendChatForm = document.getElementById('adminSendChatForm');
const adminBackToClientsBtn = document.getElementById('adminBackToClientsBtn');
const adminChatSearchInput = document.getElementById('adminChatSearchInput');

function resolveProduct(prodOrId) {
    if (!prodOrId) return null;
    if (typeof prodOrId === 'object') return prodOrId;
    return allProductsCache.find(p => p.id === prodOrId) || null;
}

function uploadMediaToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && typeof onProgress === "function") {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve({
                        url: response.secure_url,
                        type: response.resource_type === "video" ? "video" : "image"
                    });
                } catch (e) {
                    reject(new Error("تعذر قراءة استجابة خادم Cloudinary."));
                }
            } else {
                let errMsg = "فشل رفع الملف إلى Cloudinary.";
                try {
                    const errResp = JSON.parse(xhr.responseText);
                    if (errResp?.error?.message) errMsg += " السبب: " + errResp.error.message;
                } catch (_) {}
                reject(new Error(errMsg));
            }
        };

        xhr.onerror = () => reject(new Error("تعذر الاتصال بخادم Cloudinary. تأكد من اتصال الإنترنت."));
        xhr.send(formData);
    });
}

async function getCurrentDeviceLocation() {
    const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
    
    if (isNative && window.Capacitor?.Plugins?.Geolocation) {
        try {
            await window.Capacitor.Plugins.Geolocation.requestPermissions();
            const position = await window.Capacitor.Plugins.Geolocation.getCurrentPosition({
                enableHighAccuracy: false,
                timeout: 3000
            });
            return { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (e) {
            console.log("الانتقال إلى الجلب السريع عبر المتصفح...");
        }
    }

    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('خاصية تحديد الموقع غير مدعومة في جهازك.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {
                navigator.geolocation.getCurrentPosition(
                    (posAccurate) => resolve({ lat: posAccurate.coords.latitude, lng: posAccurate.coords.longitude }),
                    (err) => {
                        let msg = 'تعذر التقاط الموقع الفوري.';
                        if (err.code === err.PERMISSION_DENIED) {
                            msg = 'تم رفض الإذن! يرجى التوجه لإعدادات الهاتف -> التطبيقات -> العمدة -> تفعيل إذن الموقع.';
                        } else if (err.code === err.POSITION_UNAVAILABLE) {
                            msg = 'تأكد من تشغيل زر الـ GPS في شريط الإشعارات العلوي بالهاتف.';
                        }
                        reject(new Error(msg));
                    },
                    { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
                );
            },
            { enableHighAccuracy: false, timeout: 2500, maximumAge: 300000 }
        );
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const activeCat = document.querySelector('.cat-chip.active') ? document.querySelector('.cat-chip.active').dataset.cat : 'all';
        renderProducts(activeCat, e.target.value);
    });
}

authBtn?.addEventListener('click', () => {
    closeSideMenu();
    if (currentUser) {
        signOut(auth).then(() => { location.reload(); });
    } else {
        if (authModal) authModal.style.display = 'flex';
    }
});

window.openCartModal = function() {
    closeSideMenu();
    if (cartModal) {
        cartModal.style.display = 'flex';
        updateCartUI();
    }
};

cartBtnHeader?.addEventListener('click', openCartModal);
closeAuthModal?.addEventListener('click', () => authModal.style.display = 'none');
closeModal?.addEventListener('click', () => cartModal.style.display = 'none');
document.querySelector('.close-invoice-modal')?.addEventListener('click', () => {
    if (invoiceModal) invoiceModal.style.display = 'none';
});
document.querySelector('.close-prod-modal')?.addEventListener('click', () => {
    const prodModal = document.getElementById('productDetailModal');
    if (prodModal) {
        const activeVideo = prodModal.querySelector('video');
        if (activeVideo) activeVideo.pause();
        prodModal.style.display = 'none';
    }
});

notificationsBtn?.addEventListener('click', () => {
    closeSideMenu();
    if (notificationsModal) notificationsModal.style.display = 'flex';
    loadNotifications();
});
document.querySelector('.close-notif-modal')?.addEventListener('click', () => notificationsModal.style.display = 'none');

profileBtn?.addEventListener('click', () => {
    closeSideMenu();
    switchSection('profileSection');
});

adminBtn?.addEventListener('click', () => {
    closeSideMenu();
    switchSection('adminSection');
});

function stopAdminChatListeners() {
    if (unsubscribeAdminRecentChats) {
        unsubscribeAdminRecentChats();
        unsubscribeAdminRecentChats = null;
    }
    if (unsubscribeActiveAdminThread) {
        unsubscribeActiveAdminThread();
        unsubscribeActiveAdminThread = null;
    }
}

window.switchSection = function(sectionId) {
    closeSideMenu();
    if (sectionId !== 'adminSection') {
        stopAdminChatListeners();
    }

    document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.style.display = 'block';

    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
    if (sectionId === 'productsSection') document.getElementById('navHomeBtn')?.classList.add('active');
    if (sectionId === 'categoriesSection') document.getElementById('navCatBtn')?.classList.add('active');
    if (sectionId === 'profileSection') {
        document.getElementById('navProfileBtn')?.classList.add('active');
        loadUserProfile();
        setTimeout(() => {
            if (typeof L !== 'undefined') {
                if (userMap) userMap.invalidateSize();
                else initUserMap();
            }
        }, 250);
    }
    if (sectionId === 'adminSection') {
        loadCategoriesForAdmin();
        loadAdminProductsList();
    }
};

googleLoginBtn?.addEventListener('click', async () => {
    try {
        let user;
        const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform();

        if (isNative && window.Capacitor?.Plugins?.FirebaseAuthentication) {
            const result = await window.Capacitor.Plugins.FirebaseAuthentication.signInWithGoogle({
                webClientId: GOOGLE_WEB_CLIENT_ID
            });
            const idToken = result.credential?.idToken || result.user?.idToken;
            if (!idToken) throw new Error('لم يتم جلب رمز التوثيق (idToken) من جوجل.');
            
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            user = userCredential.user;
        } else {
            const result = await signInWithPopup(auth, googleProvider);
            user = result.user;
        }

        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                email: user.email,
                name: user.displayName || 'عميل جوجل',
                role: "customer",
                rol: "customer",
                col: "customer",
                phone: ""
            });
        }
        alert(t('تم تسجيل الدخول بحساب جوجل بنجاح!', 'Signed in with Google successfully!'));
        if (authModal) authModal.style.display = 'none';
        location.reload();
    } catch (error) {
        alert(t('خطأ في تسجيل الدخول بجوجل: ', 'Google sign-in error: ') + error.message);
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        updateAuthButtonLabel();
        if (authModal) authModal.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'flex';
        checkUnreadNotifications();
        
        try {
            const userDocRef = doc(db, "users", user.email);
            const userDoc = await getDoc(userDocRef);
            if (user.email === "haretg@gmail.com") {
                currentUserRole = "admin";
            } else if (userDoc.exists()) {
                const userData = userDoc.data();
                currentUserRole = userData.role || userData.rol || userData.col || "customer";
                userSavedPhone = userData.phone || "";
            }
            
            if (adminBtn) {
                adminBtn.style.display = ["admin", "assistant_manager", "accountant", "employee"].includes(currentUserRole) ? 'flex' : 'none';
            }
        } catch (err) {
            if (adminBtn) adminBtn.style.display = 'none';
        }

        listenUserChat();
    } else {
        currentUser = null;
        currentUserRole = 'customer';
        userSavedPhone = '';
        updateAuthButtonLabel();
        if (adminBtn) adminBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
    }
});

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                email: user.email,
                name: "عميل",
                role: "customer",
                rol: "customer",
                col: "customer",
                phone: ""
            });
        }

        alert(t('تم تسجيل الدخول بنجاح', 'Signed in successfully'));
        if (authModal) authModal.style.display = 'none';
        location.reload();
    } catch (error) {
        alert(t('خطأ في بيانات الدخول: ', 'Login error: ') + error.message);
    }
});

// ==========================================
// === مزامنة المنتجات والأقسام بذكاء وتوفير القراءات ===
// ==========================================
function subscribeProductsBatch(batchSize) {
    if (unsubscribeProducts) unsubscribeProducts();

    const qProds = query(collection(db, "products"), limit(batchSize));
    unsubscribeProducts = onSnapshot(qProds, (snapshot) => {
        if (snapshot.metadata.fromCache && allProductsCache.length > 0 && snapshot.size === allProductsCache.length) return;

        const freshProds = [];
        snapshot.forEach(docSnap => freshProds.push({ id: docSnap.id, ...docSnap.data() }));
        
        allProductsCache = freshProds;
        OmdaLocalDB.set('products', freshProds);

        const loadMoreWrapper = document.getElementById('loadMoreProductsWrapper');
        if (loadMoreWrapper) {
            loadMoreWrapper.style.display = (freshProds.length >= batchSize) ? 'block' : 'none';
        }

        const activeCat = document.querySelector('.cat-chip.active')?.dataset.cat || 'all';
        const currentSearch = searchInput ? searchInput.value : '';
        renderProducts(activeCat, currentSearch);
        startProductCarousel();
    }, (err) => {
        console.warn("استخدام بيانات المنتجات من IndexedDB (وضع الأوفلاين):", err.message);
    });
}

document.getElementById('loadMoreProductsBtn')?.addEventListener('click', () => {
    productsBatchLimit += 40;
    subscribeProductsBatch(productsBatchLimit);
});

async function listenRealtimeData() {
    const [cachedCats, cachedProds] = await Promise.all([
        OmdaLocalDB.get('categories', []),
        OmdaLocalDB.get('products', [])
    ]);

    if (cachedCats.length > 0) {
        allCategoriesCache = cachedCats;
        renderCategoriesUI();
    } else {
        allCategoriesCache = [{ id: 'export_feed', name: 'التصدير والجملة B2B', nameEn: 'Export & Wholesale B2B', icon: 'fa-solid fa-ship' }];
        renderCategoriesUI();
    }

    if (cachedProds.length > 0) {
        allProductsCache = cachedProds;
        renderProducts('all', '');
        startProductCarousel();
    }

    onSnapshot(query(collection(db, "categories"), limit(50)), (snapshot) => {
        if (snapshot.metadata.fromCache && allCategoriesCache.length > 1) return;

        const freshCats = [];
        snapshot.forEach(docSnap => freshCats.push({ id: docSnap.id, ...docSnap.data() }));
        
        const hasExport = freshCats.some(c => c.id === 'export_feed');
        if (!hasExport) {
            freshCats.unshift({ id: 'export_feed', name: 'التصدير والجملة B2B', nameEn: 'Export & Wholesale B2B', icon: 'fa-solid fa-ship' });
        }
        
        allCategoriesCache = freshCats;
        OmdaLocalDB.set('categories', freshCats);
        renderCategoriesUI();
    }, (err) => {
        console.warn("استخدام بيانات الأقسام من IndexedDB (وضع الأوفلاين):", err.message);
    });

    subscribeProductsBatch(productsBatchLimit);
}

function renderCategoriesUI() {
    const catContainer = document.getElementById('categoriesContainer');
    const fullCategoriesGrid = document.getElementById('fullCategoriesGrid');
    const activeCatBefore = document.querySelector('.cat-chip.active')?.dataset.cat || 'all';

    if (catContainer) {
        catContainer.innerHTML = `<button class="cat-chip ${activeCatBefore === 'all' ? 'active' : ''}" data-cat="all"><i class="fa-solid fa-border-all"></i> <span data-i18n="all_products">${t('كل المنتجات', 'All Products')}</span></button>`;
        const prodCategorySelect = document.getElementById('prodCategory');
        if (prodCategorySelect) prodCategorySelect.innerHTML = '';
        if (fullCategoriesGrid) fullCategoriesGrid.innerHTML = '';

        if (prodCategorySelect) {
            prodCategorySelect.innerHTML += `<option value="export_feed">${t('التصدير والجملة B2B', 'Export & Wholesale B2B')}</option>`;
        }

        allCategoriesCache.forEach(cat => {
            const catLabel = escapeHtml(getCatDisplayName(cat));
            const safeCatId = escapeHtml(cat.id);
            const safeIcon = escapeHtml(cat.icon || 'fa-solid fa-wheat-awn');

            catContainer.innerHTML += `<button class="cat-chip ${activeCatBefore === cat.id ? 'active' : ''}" data-cat="${safeCatId}"><i class="${safeIcon}"></i> ${catLabel}</button>`;
            if (prodCategorySelect && cat.id !== 'export_feed') {
                prodCategorySelect.innerHTML += `<option value="${safeCatId}">${catLabel}</option>`;
            }
            
            if (fullCategoriesGrid) {
                fullCategoriesGrid.innerHTML += `
                    <div class="product-card" style="text-align:center; padding:20px; cursor:pointer;" onclick="switchSection('productsSection'); renderProducts('${safeCatId}', '');">
                        <i class="${safeIcon}" style="font-size:2.2rem; color:var(--primary); margin-bottom:10px;"></i>
                        <h3 style="font-size:1rem;">${catLabel}</h3>
                        <p style="font-size:0.8rem; color:#666;">${t('تصفح قسم ' + catLabel, 'Browse ' + catLabel)}</p>
                    </div>`;
            }
        });

        document.querySelectorAll('.cat-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                renderProducts(e.currentTarget.dataset.cat, searchInput ? searchInput.value : '');
            });
        });
    }
}

function startProductCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (allProductsCache.length === 0) return;
    let index = 0;
    const bannerContainer = document.getElementById('carouselContentArea');
    if (!bannerContainer) return;
    
    const updateCarouselItem = () => {
        const prod = allProductsCache[index];
        if (!prod) return;
        const prodTitle = escapeHtml(getProdDisplayName(prod));
        let mediaThumb = `<img src="${escapeHtml(prod.mediaUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=100&q=80')}" loading="lazy" style="width:60px; height:60px; border-radius:10px; object-fit:cover; flex-shrink:0;">`;
        if (prod.mediaType === 'video') {
            mediaThumb = `<video src="${escapeHtml(prod.mediaUrl)}#t=0.1" preload="metadata" muted playsinline style="width:60px; height:60px; border-radius:10px; object-fit:cover; flex-shrink:0;"></video>`;
        }
        
        const isExportProd = prod.category === 'export_feed' || prod.category === 'export' || prod.isExport;

        bannerContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; width: 100%; min-width:0;" onclick="openProductModal('${escapeHtml(prod.id)}')">
                ${mediaThumb}
                <div style="flex: 1; min-width: 0;">
                    <h4 style="color: var(--primary); font-size: 0.98rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prodTitle}</h4>
                    <p style="font-size: 0.88rem; color: var(--accent); font-weight: bold;">${isExportProd ? t('قسم التصدير والجملة B2B', 'Export & Wholesale B2B') : t('السعر المميز: ' + prod.price + ' ج.م', 'Special Price: ' + prod.price + ' EGP')}</p>
                </div>
            </div>
        `;
        index = (index + 1) % allProductsCache.length;
    };

    updateCarouselItem();
    carouselInterval = setInterval(updateCarouselItem, 3500);
}

window.openExportRfqModal = function(prodOrId) {
    const product = resolveProduct(prodOrId);
    const rfqModal = document.getElementById('exportRfqModal');
    if (!rfqModal) return;

    const prodDisplayName = product ? getProdDisplayName(product) : t('منتج تصدير', 'Export Product');
    document.getElementById('rfqProdTitle').textContent = prodDisplayName;
    document.getElementById('rfqMinQty').textContent = product?.minQty || t('20 طن (حاوية)', '20 Tons (Container)');
    document.getElementById('rfqProdId').value = product ? product.id : '';

    const waMsg = encodeURIComponent(`السلام عليكم، أرغب في الاستفسار عن عرض سعر B2B لمنتج: ${prodDisplayName}`);
    const waBtn = document.getElementById('rfqWhatsAppBtn');
    if (waBtn) waBtn.href = `https://wa.me/${EXPORT_WHATSAPP_NUMBER}?text=${waMsg}`;

    const callBtn = document.getElementById('rfqCallBtn');
    if (callBtn) callBtn.href = `tel:${EXPORT_PHONE_NUMBER}`;

    rfqModal.style.display = 'flex';
};

document.querySelector('.close-rfq-modal')?.addEventListener('click', () => {
    const rfqModal = document.getElementById('exportRfqModal');
    if (rfqModal) rfqModal.style.display = 'none';
});

const rfqForm = document.getElementById('rfqForm');
rfqForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = document.getElementById('rfqCompanyName').value;
    const destination = document.getElementById('rfqDestination').value;
    const quantity = document.getElementById('rfqQuantity').value;
    const incoterm = document.getElementById('rfqIncoterm').value;
    const phone = document.getElementById('rfqPhone').value;
    const prodTitle = document.getElementById('rfqProdTitle').textContent;

    try {
        await addDoc(collection(db, "rfq_orders"), {
            companyName,
            destination,
            quantity: Number(quantity),
            incoterm,
            phone,
            productTitle: prodTitle,
            userEmail: currentUser ? currentUser.email : 'زائر / مستورد دولي',
            date: new Date().toLocaleDateString('ar-EG'),
            createdAt: new Date().toISOString(),
            status: 'جديد - طلب تسعير B2B'
        });

        const fullMsg = `*طلب عرض سعر B2B جديد - منصة الإخلاص للتصدير*\n\n` +
            `🏢 *الشركة:* ${companyName}\n` +
            `📦 *المنتج:* ${prodTitle}\n` +
            `⚖️ *الكمية:* ${quantity} طن\n` +
            `🚢 *الشرط اللوجستي:* ${incoterm}\n` +
            `📍 *وجهة الوصول:* ${destination}\n` +
            `📞 *هاتف التواصل:* ${phone}`;

        alert(t('تم إرسال طلب عرض السعر بنجاح! جاري تحويلك لمحادثة الواتساب المباشرة...', 'Quotation request submitted! Redirecting to WhatsApp...'));
        
        const rfqModal = document.getElementById('exportRfqModal');
        if (rfqModal) rfqModal.style.display = 'none';
        rfqForm.reset();

        window.open(`https://wa.me/${EXPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMsg)}`, '_blank');
    } catch (err) {
        alert(t('حدث خطأ أثناء حفظ طلب التسعير: ', 'Error saving quotation request: ') + err.message);
    }
});

// ==========================================
// === نظام الشات المباشر السريع والموفر للقراءات ===
// ==========================================
function renderChatBubbles(container, messages, isCurrentUserAdmin) {
    if (!container) return;
    const html = messages.map(c => {
        const isMine = isCurrentUserAdmin ? (c.sender === 'admin') : (c.sender === 'client');
        const senderLabel = isCurrentUserAdmin
            ? (isMine ? 'الإدارة (أنت)' : escapeHtml(c.userEmail || 'العميل'))
            : (isMine ? t('أنت', 'You') : t('إدارة منصة العمدة', 'Al-Omda Management'));

        return `
            <div class="chat-msg-row ${isMine ? 'mine' : 'theirs'}">
                <div class="chat-bubble">
                    <div class="chat-sender">${senderLabel}</div>
                    <div>${escapeHtml(c.message)}</div>
                    <div class="chat-time">${escapeHtml(c.date || '')}</div>
                </div>
            </div>`;
    }).join('');

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function listenUserChat() {
    if (!currentUser) return;
    const userChatBox = document.getElementById('userChatMessages');
    if (!userChatBox) return;

    if (unsubscribeUserChat) unsubscribeUserChat();

    // تحديد الحد بـ 60 رسالة فقط لتقليل القراءات وتسريع التحميل
    const qChat = query(
        collection(db, "chats"),
        where("userEmail", "==", currentUser.email),
        limit(60)
    );

    unsubscribeUserChat = onSnapshot(qChat, (snapshot) => {
        const chatList = [];
        snapshot.forEach(docSnap => chatList.push({ id: docSnap.id, ...docSnap.data() }));

        chatList.sort((a, b) => new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0));

        if (chatList.length === 0) {
            userChatBox.innerHTML = `<p style="text-align: center; color: #888; font-size: 0.85rem; margin-top: 20px;">${t('أهلاً بك! اكتب رسالتك هنا لبدء محادثة مباشرة مع الإدارة.', 'Welcome! Type your message here to start a live chat with management.')}</p>`;
            return;
        }

        renderChatBubbles(userChatBox, chatList, false);
    });
}

userSendChatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert(t('الرجاء تسجيل الدخول أولاً لبدء المحادثة.', 'Please sign in first to start chatting.'));
        if (authModal) authModal.style.display = 'flex';
        return;
    }

    const input = document.getElementById('userChatMessageInput');
    const msgText = input.value.trim();
    if (!msgText) return;

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    input.value = '';

    try {
        await addDoc(collection(db, "chats"), {
            userEmail: currentUser.email,
            userPhone: userSavedPhone || '',
            sender: 'client',
            message: msgText,
            timestamp: nowIso,
            createdAt: nowIso,
            date: timeStr
        });
    } catch (err) {
        alert(t('خطأ أثناء إرسال الرسالة: ', 'Error sending message: ') + err.message);
    }
});

// الاستماع لآخر 150 رسالة فقط لتجميع قائمة العملاء النشطين (بدلاً من قراءة ملايين الرسائل التاريخية)
function listenAdminChats() {
    if (unsubscribeAdminRecentChats) unsubscribeAdminRecentChats();

    const qRecent = query(
        collection(db, "chats"),
        orderBy("createdAt", "desc"),
        limit(150)
    );

    unsubscribeAdminRecentChats = onSnapshot(qRecent, (snapshot) => {
        recentAdminChatsCache = [];
        snapshot.forEach(docSnap => recentAdminChatsCache.push({ id: docSnap.id, ...docSnap.data() }));
        renderAdminConversationsList();
    }, (err) => {
        console.warn("تنبيه تحميل المحادثات:", err.message);
    });
}

function renderAdminConversationsList() {
    const listElem = document.getElementById('adminConversationsList');
    if (!listElem) return;

    const searchFilter = (adminChatSearchInput?.value || '').trim().toLowerCase();

    const clientMap = {};
    recentAdminChatsCache.forEach(c => {
        if (!c.userEmail) return;
        if (!clientMap[c.userEmail]) {
            clientMap[c.userEmail] = {
                userEmail: c.userEmail,
                userPhone: c.userPhone || '',
                lastMsg: c.message || '',
                lastTime: c.createdAt || c.timestamp || 0,
                lastDateLabel: c.date || ''
            };
        }
        if (new Date(c.createdAt || c.timestamp || 0) > new Date(clientMap[c.userEmail].lastTime)) {
            clientMap[c.userEmail].lastMsg = c.message || '';
            clientMap[c.userEmail].lastTime = c.createdAt || c.timestamp || 0;
            clientMap[c.userEmail].lastDateLabel = c.date || '';
        }
        if (c.userPhone && !clientMap[c.userEmail].userPhone) {
            clientMap[c.userEmail].userPhone = c.userPhone;
        }
    });

    let clients = Object.values(clientMap).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    if (searchFilter) {
        clients = clients.filter(cl =>
            cl.userEmail.toLowerCase().includes(searchFilter) ||
            (cl.userPhone && cl.userPhone.toLowerCase().includes(searchFilter)) ||
            (cl.lastMsg && cl.lastMsg.toLowerCase().includes(searchFilter))
        );
    }

    if (clients.length === 0) {
        listElem.innerHTML = '<p style="color:#888; font-size: 0.85rem; text-align: center; margin-top: 20px;">لا توجد محادثات مطابقة حالياً.</p>';
        return;
    }

    listElem.innerHTML = clients.map(cl => {
        const isActive = activeAdminChatEmail === cl.userEmail;
        const safeEmail = escapeHtml(cl.userEmail);
        const safePhone = escapeHtml(cl.userPhone);
        return `
            <div class="conv-item ${isActive ? 'active' : ''}" data-email="${safeEmail}" data-phone="${safePhone}">
                <div class="conv-item-top">
                    <span class="conv-item-email"><i class="fa-solid fa-user"></i> ${safeEmail}</span>
                    <span class="conv-item-time">${escapeHtml(cl.lastDateLabel)}</span>
                </div>
                <div class="conv-item-preview">${escapeHtml(cl.lastMsg)}</div>
                ${safePhone ? `<div class="conv-item-phone"><i class="fa-solid fa-phone"></i> ${safePhone}</div>` : ''}
            </div>`;
    }).join('');

    listElem.querySelectorAll('.conv-item').forEach(item => {
        item.addEventListener('click', () => {
            selectClientForAdminChat(item.dataset.email, item.dataset.phone);
        });
    });
}

adminChatSearchInput?.addEventListener('input', () => {
    renderAdminConversationsList();
});

adminBackToClientsBtn?.addEventListener('click', () => {
    const layout = document.getElementById('adminChatLayout');
    if (layout) {
        layout.classList.remove('show-chat');
        layout.classList.add('show-list');
    }
    if (unsubscribeActiveAdminThread) {
        unsubscribeActiveAdminThread();
        unsubscribeActiveAdminThread = null;
    }
});

window.selectClientForAdminChat = function(email, phone) {
    activeAdminChatEmail = email;
    activeAdminChatPhone = phone || '';

    document.getElementById('adminActiveClientEmail').textContent = email;
    document.getElementById('adminActiveClientEmailInput').value = email;
    document.getElementById('adminActiveClientPhone').textContent = phone ? `هاتف: ${phone}` : 'بدون هاتف';

    // التبديل إلى عرض المحادثة على الهواتف
    const layout = document.getElementById('adminChatLayout');
    if (layout) {
        layout.classList.remove('show-list');
        layout.classList.add('show-chat');
    }

    renderAdminConversationsList();

    const chatMessagesBox = document.getElementById('adminChatMessages');
    if (chatMessagesBox) {
        chatMessagesBox.innerHTML = '<p style="text-align: center; color: #888; margin-top: 30px;">جاري تحميل الرسائل...</p>';
    }

    if (unsubscribeActiveAdminThread) unsubscribeActiveAdminThread();

    // فتح استماع مخصص لرسائل هذا العميل فقط (بحد أقصى 60 رسالة) لتوفير القراءات
    const qClientThread = query(
        collection(db, "chats"),
        where("userEmail", "==", email),
        limit(60)
    );

    unsubscribeActiveAdminThread = onSnapshot(qClientThread, (snapshot) => {
        activeAdminThreadMessages = [];
        snapshot.forEach(docSnap => activeAdminThreadMessages.push({ id: docSnap.id, ...docSnap.data() }));
        activeAdminThreadMessages.sort((a, b) => new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0));

        if (!chatMessagesBox) return;
        if (activeAdminThreadMessages.length === 0) {
            chatMessagesBox.innerHTML = '<p style="text-align: center; color: #888; margin-top: 40px;">لا توجد رسائل سابقة مع هذا العميل.</p>';
            return;
        }
        renderChatBubbles(chatMessagesBox, activeAdminThreadMessages, true);
    });
};

adminSendChatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetEmail = document.getElementById('adminActiveClientEmailInput').value;
    const input = document.getElementById('adminChatMessageInput');
    const msgText = input.value.trim();

    if (!targetEmail) {
        alert('الرجاء اختيار عميل من القائمة أولاً لبدء المحادثة معه.');
        return;
    }
    if (!msgText) return;

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    input.value = '';

    try {
        await addDoc(collection(db, "chats"), {
            userEmail: targetEmail,
            userPhone: activeAdminChatPhone || '',
            sender: 'admin',
            message: msgText,
            timestamp: nowIso,
            createdAt: nowIso,
            date: timeStr
        });
    } catch (err) {
        alert('خطأ أثناء إرسال الرد: ' + err.message);
    }
});

// ==========================================
// === عرض المنتجات ===
// ==========================================
window.renderProducts = function(category, searchTerm) {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    const term = (searchTerm || '').toLowerCase();
    const filtered = allProductsCache.filter(prod => {
        const matchesCat = (category === 'all' || prod.category === category);
        const matchesSearch = (prod.name || '').toLowerCase().includes(term) || (prod.nameEn || '').toLowerCase().includes(term);
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#777; padding:20px;">${t('لا توجد منتجات مطابقة للبحث.', 'No matching products found.')}</p>`;
        return;
    }

    filtered.forEach(prod => {
        const prodTitle = escapeHtml(getProdDisplayName(prod));
        const safeId = escapeHtml(prod.id);
        let mediaHtml = `<img src="${escapeHtml(prod.mediaUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=500&q=80')}" alt="${prodTitle}" loading="lazy" decoding="async">`;
        if (prod.mediaType === 'video') {
            mediaHtml = `
                <div style="position:relative; width:100%; height:100%; background:#000;">
                    <video src="${escapeHtml(prod.mediaUrl)}#t=0.1" preload="metadata" muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>
                    <span style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.85rem; pointer-events:none;"><i class="fa-solid fa-play"></i></span>
                </div>`;
        }

        const isExportCategory = prod.category === 'export_feed' || prod.category === 'export' || prod.isExport;

        if (isExportCategory) {
            productsGrid.innerHTML += `
                <div class="product-card" onclick="openProductModal('${safeId}')">
                    <div class="product-media-wrapper">
                        <span style="position:absolute; top:8px; right:8px; background:#173627; color:#fff; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold; z-index:2;"><i class="fa-solid fa-ship"></i> ${t('تصدير B2B', 'Export B2B')}</span>
                        ${mediaHtml}
                    </div>
                    <div class="product-info">
                        <h3>${prodTitle}</h3>
                        <div class="product-price-row">
                            <span class="product-price" style="font-size:0.85rem; color:#173627;">${t('طلب تسعير بالجملة', 'Request Wholesale Quote')}</span>
                            <button class="btn-add-cart-icon" style="background:#173627;" onclick="event.stopPropagation(); openExportRfqModal('${safeId}')" title="${t('طلب عرض سعر B2B', 'Request B2B Quote')}">
                                <i class="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            productsGrid.innerHTML += `
                <div class="product-card" onclick="openProductModal('${safeId}')">
                    <div class="product-media-wrapper">
                        ${mediaHtml}
                    </div>
                    <div class="product-info">
                        <h3>${prodTitle}</h3>
                        <div class="product-price-row">
                            <span class="product-price">${escapeHtml(prod.price)} <small style="font-size:0.75rem;">${t('ج.م', 'EGP')}</small></span>
                            <button class="btn-add-cart-icon" onclick="event.stopPropagation(); addToCartDirect('${safeId}')" title="${t('إضافة للسلة', 'Add to Cart')}">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    });
};

window.addToCartDirect = function(prodOrId) {
    const product = resolveProduct(prodOrId);
    if (!product) return;
    cart.push(product);
    localStorage.setItem('omda_cart', JSON.stringify(cart));
    updateCartUI();
};

window.openProductModal = function(prodOrId) {
    const product = resolveProduct(prodOrId);
    if (!product) return;

    const prodTitle = getProdDisplayName(product);
    const safeTitle = escapeHtml(prodTitle);
    document.getElementById('modalProdTitle').textContent = prodTitle;
    const body = document.getElementById('modalProdBody');
    
    let mediaHtml = `<img src="${escapeHtml(product.mediaUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=90')}" style="width:100%; max-height:300px; border-radius:12px; object-fit:contain; background:#f8faf9; margin-bottom:12px;">`;
    if (product.mediaType === 'video') {
        mediaHtml = `<video src="${escapeHtml(product.mediaUrl)}" controls autoplay playsinline preload="auto" style="width:100%; max-height:320px; border-radius:12px; object-fit:contain; background:#000; margin-bottom:12px;"></video>`;
    }

    const isExportCategory = product.category === 'export_feed' || product.category === 'export' || product.isExport;

    if (isExportCategory) {
        body.innerHTML = `
            ${mediaHtml}
            <h3 style="color:var(--primary); font-size:1.1rem; margin-bottom:6px;">${safeTitle}</h3>
            <p style="font-size:0.95rem; font-weight:bold; color:#173627; margin-bottom:14px;"><i class="fa-solid fa-ship"></i> ${t('مخصص للتصدير والكميات الكبيرة (B2B)', 'Dedicated for Export & Bulk Quantities (B2B)')}</p>
            <button id="modalRfqBtn" class="btn-submit" style="background:#173627; padding:12px; font-size:0.95rem;">
                <i class="fa-solid fa-file-signature"></i> ${t('طلب عرض سعر جملة (RFQ)', 'Request Bulk Quotation (RFQ)')}
            </button>
        `;

        document.getElementById('modalRfqBtn').onclick = () => {
            const v = document.getElementById('productDetailModal')?.querySelector('video');
            if (v) v.pause();
            document.getElementById('productDetailModal').style.display = 'none';
            openExportRfqModal(product);
        };
    } else {
        body.innerHTML = `
            ${mediaHtml}
            <h3 style="color:var(--primary); font-size:1.1rem; margin-bottom:6px;">${safeTitle}</h3>
            <p style="font-size:1.2rem; font-weight:bold; color:var(--accent); margin-bottom:14px;">${t('السعر: ' + escapeHtml(product.price) + ' ج.م', 'Price: ' + escapeHtml(product.price) + ' EGP')}</p>
            <div class="input-group" style="margin-bottom:15px;">
                <label>${t('حدد الكمية المطلوبة للحجز:', 'Specify required quantity:')}</label>
                <input type="number" id="modalQtyInput" value="1" min="1" style="padding:10px; border-radius:8px; border:1px solid #ccc; width:100%;">
            </div>
            <button id="modalAddToCartBtn" class="btn-submit" style="background:var(--primary); padding:12px; font-size:0.95rem;">
                <i class="fa-solid fa-cart-plus"></i> ${t('إضافة للسلة وحجز الكمية', 'Add to Cart & Reserve')}
            </button>
        `;

        document.getElementById('modalAddToCartBtn').onclick = () => {
            const v = document.getElementById('productDetailModal')?.querySelector('video');
            if (v) v.pause();
            const qty = parseInt(document.getElementById('modalQtyInput').value) || 1;
            for (let i = 0; i < qty; i++) { cart.push(product); }
            localStorage.setItem('omda_cart', JSON.stringify(cart));
            updateCartUI();
            document.getElementById('productDetailModal').style.display = 'none';
        };
    }

    document.getElementById('productDetailModal').style.display = 'flex';
};

function updateCartUI() {
    const list = document.getElementById('cartItemsList');
    const totalSpan = document.getElementById('cartTotalPrice');
    const totalCountElem = document.getElementById('cartTotalItemsCount');
    const cartCountNav = document.getElementById('cartCount');
    const cartCountHeader = document.getElementById('cartCountHeader');
    const phoneInput = document.getElementById('checkoutPhoneInput');

    if (cartCountNav) cartCountNav.textContent = cart.length;
    if (cartCountHeader) cartCountHeader.textContent = cart.length;
    if (totalCountElem) totalCountElem.textContent = cart.length;

    if (phoneInput && userSavedPhone && !phoneInput.value) {
        phoneInput.value = userSavedPhone;
    }

    if (!list || !totalSpan) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:#888;">
                <i class="fa-solid fa-cart-arrow-down" style="font-size:3rem; color:#ccc; margin-bottom:10px;"></i>
                <p>${t('سلة المشتريات فارغة حالياً', 'Your shopping cart is currently empty')}</p>
            </div>`;
        totalSpan.textContent = '0';
        return;
    }

    const groupedCart = {};
    cart.forEach(item => {
        const key = item.id || item.name;
        if (!groupedCart[key]) {
            groupedCart[key] = { ...item, qty: 0 };
        }
        groupedCart[key].qty += 1;
    });

    list.innerHTML = '';
    let totalSum = 0;

    Object.values(groupedCart).forEach(item => {
        const itemTotal = Number(item.price) * item.qty;
        totalSum += itemTotal;
        const itemTitle = escapeHtml(getProdDisplayName(item));
        const safeKey = escapeHtml(item.id || item.name);

        const imgUrl = (item.mediaType !== 'video' && item.mediaUrl) ? item.mediaUrl : 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=150&q=80';

        list.innerHTML += `
            <div class="cart-item-card">
                <img src="${escapeHtml(imgUrl)}" class="cart-item-img" alt="${itemTitle}">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${itemTitle}</h4>
                    <span class="cart-item-price">${escapeHtml(item.price)} ${t('ج.م', 'EGP')}</span>
                </div>
                <div class="cart-qty-controls">
                    <button class="btn-qty" onclick="changeItemQty('${safeKey}', -1)">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="btn-qty" onclick="changeItemQty('${safeKey}', 1)">+</button>
                </div>
                <button class="btn-remove-item" onclick="removeGroupFromCart('${safeKey}')" title="${t('حذف', 'Remove')}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    });

    totalSpan.textContent = totalSum;
}
window.updateCartUI = updateCartUI;

window.changeItemQty = function(identifier, delta) {
    if (delta === 1) {
        const item = cart.find(i => (i.id || i.name) === identifier);
        if (item) cart.push({ ...item });
    } else if (delta === -1) {
        const index = cart.findIndex(i => (i.id || i.name) === identifier);
        if (index !== -1) cart.splice(index, 1);
    }
    localStorage.setItem('omda_cart', JSON.stringify(cart));
    updateCartUI();
};

window.removeGroupFromCart = function(identifier) {
    cart = cart.filter(i => (i.id || i.name) !== identifier);
    localStorage.setItem('omda_cart', JSON.stringify(cart));
    updateCartUI();
};

checkoutBtn?.addEventListener('click', async () => {
    if (!currentUser) {
        alert(t('الرجاء تسجيل الدخول أولاً لإتمام الطلب', 'Please sign in first to complete your order'));
        if (authModal) authModal.style.display = 'flex';
        return;
    }
    if (cart.length === 0) {
        alert(t('السلة فارغة!', 'Your cart is empty!'));
        return;
    }

    const phoneInput = document.getElementById('checkoutPhoneInput');
    const phoneVal = phoneInput ? phoneInput.value.trim() : '';

    if (!phoneVal) {
        alert(t('الرجاء إدخال رقم الهاتف للتواصل والشحن قبل إتمام الطلب.', 'Please enter your contact & shipping phone number before checkout.'));
        if (phoneInput) phoneInput.focus();
        return;
    }

    const paymentType = document.getElementById('paymentTypeSelect').value;
    try {
        userSavedPhone = phoneVal;
        const userRef = doc(db, "users", currentUser.email);
        await setDoc(userRef, { phone: phoneVal }, { merge: true });

        const sanitizedItems = cart.map(item => ({
            id: item.id || '',
            name: item.name || '',
            price: item.price || 0
        }));

        const orderRef = await addDoc(collection(db, "orders"), {
            userEmail: currentUser.email,
            phone: phoneVal,
            items: sanitizedItems,
            total: cart.reduce((sum, item) => sum + Number(item.price), 0),
            status: 'قيد المراجعة والشحن',
            paymentType: paymentType,
            lat: selectedLat,
            lng: selectedLng,
            assignedVehicle: 'غير محدد',
            assignedDriver: 'غير محدد',
            date: new Date().toLocaleDateString('ar-EG'),
            createdAt: new Date().toISOString()
        });

        alert(t(`تم إرسال الطلب وإصدار الفاتورة برقم: #${orderRef.id.slice(0,6)} بنجاح!`, `Order submitted and invoice #${orderRef.id.slice(0,6)} issued successfully!`));
        cart = [];
        localStorage.removeItem('omda_cart');
        if (cartModal) cartModal.style.display = 'none';
        updateCartUI();
    } catch (err) {
        alert(t('خطأ أثناء إتمام الطلب: ', 'Checkout error: ') + err.message);
    }
});

addProductForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editProductId').value;
    const fileInput = document.getElementById('prodFile');
    const saveBtn = document.getElementById('saveProductBtn');
    const prodNameEnInput = document.getElementById('prodNameEn');
    
    let mediaUrl = editId ? editingOldMediaUrl : 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=85';
    let mediaType = editId ? editingOldMediaType : 'image';

    saveBtn.disabled = true;

    try {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const isVideo = file.type.startsWith('video');

            const uploaded = await uploadMediaToCloudinary(file, (percent) => {
                saveBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up fa-bounce"></i> جاري رفع ${isVideo ? 'الفيديو' : 'الصورة'} (${percent}%)...`;
            });

            mediaUrl = uploaded.url;
            mediaType = uploaded.type;
        }

        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ بيانات المنتج...`;

        const prodData = {
            name: document.getElementById('prodName').value,
            nameEn: prodNameEnInput ? prodNameEnInput.value.trim() : '',
            price: document.getElementById('prodPrice').value,
            category: document.getElementById('prodCategory').value,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            updatedAt: new Date().toISOString()
        };

        if (editId) {
            await updateDoc(doc(db, "products", editId), prodData);
            alert('تم تحديث المنتج بنجاح!');
            document.getElementById('editProductId').value = '';
            editingOldMediaUrl = '';
            document.getElementById('productFormTitle').textContent = 'إضافة منتج أو منشور جديد للمتجر';
            if(cancelEditBtn) cancelEditBtn.style.display = 'none';
        } else {
            await addDoc(collection(db, "products"), prodData);
            alert('تم نشر المنتج والوسائط بجودة عالية بنجاح!');
        }
        
        addProductForm.reset();
        editingOldMediaUrl = '';
        loadAdminProductsList();
    } catch (err) {
        alert('خطأ أثناء حفظ المنتج: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = document.getElementById('editProductId').value ? 'حفظ التعديلات' : 'نشر المنتج الآن';
    }
});

if(cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
        addProductForm.reset();
        document.getElementById('editProductId').value = '';
        editingOldMediaUrl = '';
        document.getElementById('productFormTitle').textContent = 'إضافة منتج أو منشور جديد للمتجر';
        document.getElementById('saveProductBtn').textContent = 'نشر المنتج الآن';
        cancelEditBtn.style.display = 'none';
    });
}

window.loadAdminProductsList = async function() {
    const list = document.getElementById('adminProductsList');
    if (!list) return;
    
    const renderList = (products) => {
        list.innerHTML = '';
        products.forEach(p => {
            const id = escapeHtml(p.id);
            const mediaBadge = p.mediaType === 'video' ? '<span style="background:#173627; color:#fff; font-size:0.7rem; padding:2px 6px; border-radius:4px; margin-right:5px;">فيديو</span>' : '';
            list.innerHTML += `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div><strong>${escapeHtml(p.name)}</strong> ${p.nameEn ? `(${escapeHtml(p.nameEn)})` : ''} ${mediaBadge} - <span style="color:var(--accent); font-weight:bold;">${escapeHtml(p.price)} ج.م</span> (${escapeHtml(p.category)})</div>
                    <div>
                        <button onclick="editProductById('${id}')" style="background:#234d39; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick="deleteProduct('${id}')" style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    };

    if (allProductsCache.length > 0) {
        renderList(allProductsCache);
    } else {
        list.innerHTML = 'جاري التحميل...';
        try {
            const snapshot = await getDocs(query(collection(db, "products"), limit(100)));
            const fetched = [];
            snapshot.forEach(docSnap => fetched.push({ id: docSnap.id, ...docSnap.data() }));
            renderList(fetched);
        } catch (e) {
            list.innerHTML = 'خطأ في التحميل.';
        }
    }
};

window.editProductById = function(id) {
    const p = resolveProduct(id);
    if (!p) return;
    editProduct(p.id, p.name, p.price, p.category, p.mediaUrl || '', p.mediaType || 'image', p.nameEn || '');
};

window.editProduct = function(id, name, price, category, mediaUrl, mediaType, nameEn = '') {
    document.getElementById('editProductId').value = id;
    editingOldMediaUrl = mediaUrl || '';
    editingOldMediaType = mediaType || 'image';

    document.getElementById('prodName').value = name;
    const prodNameEnInput = document.getElementById('prodNameEn');
    if (prodNameEnInput) prodNameEnInput.value = nameEn;
    document.getElementById('prodPrice').value = price;
    document.getElementById('prodCategory').value = category;
    document.getElementById('productFormTitle').textContent = 'تعديل المنتج';
    document.getElementById('saveProductBtn').textContent = 'حفظ التعديلات';
    if(cancelEditBtn) cancelEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        try {
            await deleteDoc(doc(db, "products", id));
            alert('تم الحذف بنجاح');
            loadAdminProductsList();
        } catch (e) {
            alert('خطأ أثناء الحذف: ' + e.message);
        }
    }
};

addCategoryForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editCatId = document.getElementById('editCatId')?.value.trim() || '';
    const catId = editCatId || document.getElementById('catIdInput').value.trim();
    const catName = document.getElementById('catNameInput').value.trim();
    const catNameEn = document.getElementById('catNameEnInput')?.value.trim() || '';
    const catIcon = document.getElementById('catIconInput').value.trim();
    try {
        await setDoc(doc(db, "categories", catId), { name: catName, nameEn: catNameEn, icon: catIcon }, { merge: true });
        alert(editCatId ? 'تم تحديث القسم بنجاح!' : 'تم حفظ القسم بنجاح!');
        addCategoryForm.reset();
        if (document.getElementById('editCatId')) document.getElementById('editCatId').value = '';
        if (document.getElementById('catIdInput')) document.getElementById('catIdInput').disabled = false;
        if (document.getElementById('categoryFormTitle')) document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
        if (document.getElementById('saveCatBtn')) document.getElementById('saveCatBtn').textContent = 'حفظ القسم الجديد';
        if (cancelCatEditBtn) cancelCatEditBtn.style.display = 'none';
        loadCategoriesForAdmin();
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
});

if (cancelCatEditBtn) {
    cancelCatEditBtn.addEventListener('click', () => {
        addCategoryForm.reset();
        if (document.getElementById('editCatId')) document.getElementById('editCatId').value = '';
        if (document.getElementById('catIdInput')) document.getElementById('catIdInput').disabled = false;
        if (document.getElementById('categoryFormTitle')) document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
        if (document.getElementById('saveCatBtn')) document.getElementById('saveCatBtn').textContent = 'حفظ القسم الجديد';
        cancelCatEditBtn.style.display = 'none';
    });
}

window.editCategory = function(id) {
    const cat = allCategoriesCache.find(c => c.id === id);
    if (!cat) return;
    if (document.getElementById('editCatId')) document.getElementById('editCatId').value = cat.id;
    const catIdInput = document.getElementById('catIdInput');
    if (catIdInput) {
        catIdInput.value = cat.id;
        catIdInput.disabled = true;
    }
    if (document.getElementById('catNameInput')) document.getElementById('catNameInput').value = cat.name || '';
    if (document.getElementById('catNameEnInput')) document.getElementById('catNameEnInput').value = cat.nameEn || '';
    if (document.getElementById('catIconInput')) document.getElementById('catIconInput').value = cat.icon || 'fa-solid fa-ship';
    if (document.getElementById('categoryFormTitle')) document.getElementById('categoryFormTitle').textContent = 'تعديل القسم';
    if (document.getElementById('saveCatBtn')) document.getElementById('saveCatBtn').textContent = 'حفظ تعديلات القسم';
    if (cancelCatEditBtn) cancelCatEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.loadCategoriesForAdmin = async function() {
    const list = document.getElementById('adminCategoriesList');
    if (!list) return;

    const renderList = (categories) => {
        list.innerHTML = '';
        categories.forEach(c => {
            const safeId = escapeHtml(c.id);
            list.innerHTML += `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div><i class="${escapeHtml(c.icon)}"></i> <strong>${escapeHtml(c.name)}</strong> ${c.nameEn ? `(${escapeHtml(c.nameEn)})` : ''} - <code>${safeId}</code></div>
                    <div>
                        <button onclick='editCategory("${safeId}")' style="background:#234d39; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick='deleteCategory("${safeId}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    };

    if (allCategoriesCache.length > 0) {
        renderList(allCategoriesCache);
    } else {
        const snapshot = await getDocs(collection(db, "categories"));
        const fetched = [];
        snapshot.forEach(docSnap => fetched.push({ id: docSnap.id, ...docSnap.data() }));
        renderList(fetched);
    }
};

window.deleteCategory = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        try {
            await deleteDoc(doc(db, "categories", id));
            alert('تم حذف القسم بنجاح');
            loadCategoriesForAdmin();
        } catch (e) {
            alert('خطأ في الحذف: ' + e.message);
        }
    }
};

document.addEventListener('click', async (e) => {
    if (e.target && (e.target.id === 'locateVehicleBtn' || e.target.closest('#locateVehicleBtn'))) {
        const btn = e.target.closest('#locateVehicleBtn') || e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحديد...';

        try {
            const loc = await getCurrentDeviceLocation();
            newVehLat = loc.lat;
            newVehLng = loc.lng;
            const display = document.getElementById('vehCoordsDisplay');
            if (display) {
                display.textContent = `تم بنجاح تحديد الإحداثيات: (${newVehLat.toFixed(4)}, ${newVehLng.toFixed(4)})`;
                display.style.color = "green";
            }
            alert('تم تحديد موقع السيارة الحالي بنجاح!');
        } catch (err) {
            alert(err.message);
        } finally {
            btn.innerHTML = originalText;
        }
    }
});

addVehicleForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editVehicleId = document.getElementById('editVehicleId').value;
    const plate = document.getElementById('vehPlate').value;
    const model = document.getElementById('vehModel').value;
    const driver = document.getElementById('vehDriverSelect').value;

    try {
        const vehicleData = { plate, model, driver, lat: newVehLat, lng: newVehLng };

        if (editVehicleId) {
            await updateDoc(doc(db, "vehicles", editVehicleId), vehicleData);
            alert('تم تحديث بيانات سيارة الأسطول بنجاح!');
            document.getElementById('editVehicleId').value = '';
            document.getElementById('vehicleFormTitle').textContent = 'إضافة سيارة جديدة للأسطول ("سيارتي") وتعيين السائق الموظف';
            document.getElementById('saveVehicleBtn').textContent = 'تسجيل السيارة في الأسطول';
            if(cancelVehicleEditBtn) cancelVehicleEditBtn.style.display = 'none';
        } else {
            await addDoc(collection(db, "vehicles"), vehicleData);
            alert('تم تسجيل السيارة بالأسطول بنجاح وتحديد موقعها على الخريطة!');
        }

        addVehicleForm.reset();
        newVehLat = 30.0444;
        newVehLng = 31.2357;
        const display = document.getElementById('vehCoordsDisplay');
        if (display) {
            display.textContent = 'الإحداثيات الحالية: لم يتم التحديد (افتراضي القاهرة)';
            display.style.color = "#666";
        }
        loadVehiclesList();
    } catch (err) {
        alert('خطأ أثناء حفظ سيارة الأسطول: ' + err.message);
    }
});

if(cancelVehicleEditBtn) {
    cancelVehicleEditBtn.addEventListener('click', () => {
        addVehicleForm.reset();
        document.getElementById('editVehicleId').value = '';
        document.getElementById('vehicleFormTitle').textContent = 'إضافة سيارة جديدة للأسطول ("سيارتي") وتعيين السائق الموظف';
        document.getElementById('saveVehicleBtn').textContent = 'تسجيل السيارة في الأسطول';
        cancelVehicleEditBtn.style.display = 'none';
    });
}

async function loadVehiclesList() {
    const list = document.getElementById('adminVehiclesList');
    if (!list) return;
    try {
        const snapshot = await getDocs(collection(db, "vehicles"));
        list.innerHTML = '';
        snapshot.forEach(docSnap => {
            const v = docSnap.data();
            const id = escapeHtml(docSnap.id);
            list.innerHTML += `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>سيارة: <strong>${escapeHtml(v.plate)}</strong> (${escapeHtml(v.model)}) | السائق المسؤول: <span style="color:var(--primary); font-weight:bold;">${escapeHtml(v.driver)}</span></div>
                    <div>
                        <button onclick='editVehicle("${id}", ${JSON.stringify(v.plate || '')}, ${JSON.stringify(v.model || '')}, ${JSON.stringify(v.driver || '')}, ${v.lat || 30.0444}, ${v.lng || 31.2357})' style="background:#234d39; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick='deleteVehicle("${id}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في تحميل السيارات.';
    }
}

window.editVehicle = function(id, plate, model, driver, lat, lng) {
    document.getElementById('editVehicleId').value = id;
    document.getElementById('vehPlate').value = plate;
    document.getElementById('vehModel').value = model;
    document.getElementById('vehDriverSelect').value = driver;
    newVehLat = lat;
    newVehLng = lng;
    
    const display = document.getElementById('vehCoordsDisplay');
    if (display) {
        display.textContent = `الإحداثيات الحالية المحفوظة: (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        display.style.color = "green";
    }

    document.getElementById('vehicleFormTitle').textContent = 'تعديل بيانات سيارة الأسطول';
    document.getElementById('saveVehicleBtn').textContent = 'حفظ تعديلات السيارة';
    if(cancelVehicleEditBtn) cancelVehicleEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteVehicle = async function(id) {
    if (confirm('هل أنت متأكد من حذف سيارة الأسطول هذه؟')) {
        try {
            await deleteDoc(doc(db, "vehicles", id));
            alert('تم حذف السيارة بنجاح');
            loadVehiclesList();
        } catch (e) {
            alert('خطأ أثناء الحذف: ' + e.message);
        }
    }
};

async function loadDriversDropdown() {
    const select = document.getElementById('vehDriverSelect');
    if (!select) return;
    const snapshot = await getDocs(query(collection(db, "users"), limit(100)));
    select.innerHTML = '<option value="">اختر السائق الموظف</option>';
    snapshot.forEach(docSnap => {
        const u = docSnap.data();
        const userRole = u.role || u.rol || u.col;
        if (['driver', 'employee', 'admin', 'assistant_manager'].includes(userRole)) {
            select.innerHTML += `<option value="${escapeHtml(u.email)}">${escapeHtml(u.name || u.email)} (${escapeHtml(userRole)})</option>`;
        }
    });
}

window.switchAdminTab = function(tabName) {
    if (tabName !== 'messages') {
        stopAdminChatListeners();
    }

    document.querySelectorAll('.admin-panel').forEach(panel => panel.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    if (tabName === 'products') {
        document.getElementById('adminProductsTab').style.display = 'block';
        document.getElementById('tabProdBtn').classList.add('active');
        loadAdminProductsList();
    } else if (tabName === 'categories') {
        document.getElementById('adminCategoriesTab').style.display = 'block';
        document.getElementById('tabCatBtn').classList.add('active');
        loadCategoriesForAdmin();
    } else if (tabName === 'export_rfq') {
        const expTab = document.getElementById('adminExportTab');
        if (expTab) expTab.style.display = 'block';
        document.getElementById('tabExportBtn')?.classList.add('active');
        loadAdminExportRfqs();
    } else if (tabName === 'orders') {
        document.getElementById('adminOrdersTab').style.display = 'block';
        document.getElementById('tabOrdBtn').classList.add('active');
        loadAllOrders();
    } else if (tabName === 'messages') {
        const msgTab = document.getElementById('adminMessagesTab');
        if (msgTab) msgTab.style.display = 'block';
        document.getElementById('tabMessagesBtn')?.classList.add('active');
        const layout = document.getElementById('adminChatLayout');
        if (layout) {
            layout.classList.remove('show-chat');
            layout.classList.add('show-list');
        }
        listenAdminChats();
    } else if (tabName === 'fleet') {
        document.getElementById('adminFleetTab').style.display = 'block';
        document.getElementById('tabFleetBtn').classList.add('active');
        loadDriversDropdown();
        loadVehiclesList();
    } else if (tabName === 'map') {
        document.getElementById('adminMapTab').style.display = 'block';
        document.getElementById('tabMapBtn').classList.add('active');
        setTimeout(() => { 
            if (typeof L !== 'undefined') {
                initAdminMap(); 
                if (adminMap) adminMap.invalidateSize();
            }
        }, 250);
    } else if (tabName === 'messaging') {
        document.getElementById('adminMessagingTab').style.display = 'block';
        document.getElementById('tabMsgBtn').classList.add('active');
    } else if (tabName === 'users') {
        document.getElementById('adminUsersTab').style.display = 'block';
        document.getElementById('tabUserBtn').classList.add('active');
        loadAllUsers();
    }
};

async function loadAdminExportRfqs() {
    const list = document.getElementById('adminExportRfqList');
    if (!list) return;
    list.innerHTML = 'جاري الجلب...';
    try {
        const snapshot = await getDocs(query(collection(db, "rfq_orders"), limit(60)));
        list.innerHTML = '';
        if (snapshot.empty) {
            list.innerHTML = '<p style="color:#888;">لا توجد طلبات تصدير حالياً.</p>';
            return;
        }
        snapshot.forEach(docSnap => {
            const r = docSnap.data();
            const id = escapeHtml(docSnap.id);
            const waMsg = encodeURIComponent(`أهلاً بك شركة ${r.companyName}، بخصوص طلب التصدير لمنتج ${r.productTitle} بكمية ${r.quantity} طن...`);
            list.innerHTML += `
                <div class="data-item" style="border-right-color:#173627;">
                    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div>
                            <h4 style="color:#173627; margin-bottom:4px;"><i class="fa-solid fa-building"></i> ${escapeHtml(r.companyName)}</h4>
                            <p><strong>المنتج:</strong> ${escapeHtml(r.productTitle)} | <strong>الكمية:</strong> ${escapeHtml(r.quantity)} طن (${escapeHtml(r.incoterm)})</p>
                            <p><strong>الوجهة:</strong> ${escapeHtml(r.destination)} | <strong>الهاتف:</strong> ${escapeHtml(r.phone)}</p>
                            <p style="font-size:0.8rem; color:#777;">البريد: ${escapeHtml(r.userEmail)} | التاريخ: ${escapeHtml(r.date || '')}</p>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:5px; justify-content:center;">
                            <a href="https://wa.me/${(r.phone || '').replace(/[^0-9]/g, '')}?text=${waMsg}" target="_blank" style="background:#25D366; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; text-align:center; font-weight:bold; font-size:0.85rem;"><i class="fa-brands fa-whatsapp"></i> تواصل واتساب</a>
                            <a href="tel:${escapeHtml(r.phone)}" style="background:#0284c7; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; text-align:center; font-weight:bold; font-size:0.85rem;"><i class="fa-solid fa-phone"></i> اتصال مباشر</a>
                            <button onclick="deleteRfqOrder('${id}')" style="background:#dc2626; color:#fff; border:none; padding:5px; border-radius:5px; cursor:pointer; font-size:0.8rem;"><i class="fa-solid fa-trash"></i> حذف الطلب</button>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في تحميل طلبات التصدير: ' + escapeHtml(e.message);
    }
}

window.deleteRfqOrder = async function(id) {
    if (confirm('هل أنت متأكد من حذف طلب التصدير هذا؟')) {
        await deleteDoc(doc(db, "rfq_orders", id));
        alert('تم حذف طلب التصدير بنجاح');
        loadAdminExportRfqs();
    }
};

async function loadAllOrders() {
    const list = document.getElementById('adminOrdersList');
    if (!list) return;
    const [snapshot, vehiclesSnap] = await Promise.all([
        getDocs(query(collection(db, "orders"), limit(80))),
        getDocs(collection(db, "vehicles"))
    ]);

    let vehicleOptions = '<option value="">اختر السيارة للأسطول</option>';
    vehiclesSnap.forEach(v => {
        vehicleOptions += `<option value="${escapeHtml(v.data().plate)}">${escapeHtml(v.data().plate)} (سائق: ${escapeHtml(v.data().driver)})</option>`;
    });

    list.innerHTML = '';
    if (snapshot.empty) {
        list.innerHTML = '<p style="color:#888; text-align:center; padding:15px;">لا توجد طلبات شراء حالياً.</p>';
        return;
    }

    snapshot.forEach(docSnap => {
        const o = docSnap.data();
        const id = docSnap.id;
        const safeId = escapeHtml(id);
        ordersCache[id] = o;
        list.innerHTML += `
            <div class="data-item">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                    <div>
                         طلب #${safeId.slice(0,6)} | العميل: <strong>${escapeHtml(o.userEmail)}</strong> | الهاتف: <strong style="color:var(--primary);">${escapeHtml(o.phone || 'غير مسجل')}</strong><br>
                         الإجمالي: <strong>${escapeHtml(o.total)} ج.م</strong> (${escapeHtml(o.paymentType)}) | الحالة: <span style="color:green; font-weight:bold;">${escapeHtml(o.status)}</span> | السيارة المعينة: <strong>${escapeHtml(o.assignedVehicle || 'غير محدد')}</strong>
                    </div>
                    <div>
                        <button onclick="previewInvoice('${safeId}')" style="background:#173627; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-file-invoice"></i> معاينة وتنزيل الفاتورة</button>
                        <button onclick="deleteOrderAdmin('${safeId}')" style="background:#dc2626; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:4px;"><i class="fa-solid fa-trash"></i> حذف الفاتورة</button>
                    </div>
                </div>
                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <select id="assignVeh_${safeId}" style="padding:5px; border-radius:5px; border:1px solid #ccc;">${vehicleOptions}</select>
                    <button onclick="assignVehicleToOrder('${safeId}')" style="background:#173627; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تعيين السيارة للشحنة</button>
                    <button onclick="updateOrderStatus('${safeId}', 'تم التسليم بنجاح')" style="background:green; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تم التسليم</button>
                </div>
            </div>`;
    });
}

window.deleteOrderAdmin = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟')) {
        await deleteDoc(doc(db, "orders", id));
        delete ordersCache[id];
        alert('تم حذف الفاتورة بنجاح');
        loadAllOrders();
    }
};

window.assignVehicleToOrder = async function(orderId) {
    const veh = document.getElementById(`assignVeh_${orderId}`).value;
    if (!veh) {
        alert('الرجاء اختيار السيارة أولاً');
        return;
    }
    try {
        await updateDoc(doc(db, "orders", orderId), { assignedVehicle: veh, status: `جاري التوصيل عبر سيارة الأسطول (${veh})` });
        alert('تم تعيين السيارة والشحنة بنجاح!');
        loadAllOrders();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        alert('تم تحديث حالة الطلب');
        loadAllOrders();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

async function loadAllUsers() {
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    const snapshot = await getDocs(query(collection(db, "users"), limit(100)));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const u = docSnap.data();
        const email = docSnap.id;
        const safeEmail = escapeHtml(email);
        const userRole = u.role || u.rol || u.col || 'customer';
        list.innerHTML += `
            <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>الاسم: ${escapeHtml(u.name || 'مستخدم')} | البريد: ${safeEmail} | الهاتف: <strong>${escapeHtml(u.phone || 'غير مسجل')}</strong> | الرتبة الحالية: <strong style="color:var(--accent);">${escapeHtml(userRole)}</strong></div>
                <div>
                    <select id="roleSelect_${email.replace(/[@.]/g, '_')}" style="padding:6px; border-radius:6px; border:1px solid #ccc;">
                        <option value="admin" ${userRole === 'admin' ? 'selected' : ''}>مدير</option>
                        <option value="assistant_manager" ${userRole === 'assistant_manager' ? 'selected' : ''}>مساعد مدير</option>
                        <option value="accountant" ${userRole === 'accountant' ? 'selected' : ''}>محاسب</option>
                        <option value="employee" ${userRole === 'employee' ? 'selected' : ''}>موظف</option>
                        <option value="driver" ${userRole === 'driver' ? 'selected' : ''}>سائق</option>
                        <option value="customer" ${userRole === 'customer' ? 'selected' : ''}>عميل</option>
                    </select>
                    <button onclick='changeUserRole("${safeEmail}")' style="background:#234d39; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-right:5px;">تحديث الرتبة</button>
                </div>
            </div>`;
    });
}

window.changeUserRole = async function(email) {
    const selectId = `roleSelect_${email.replace(/[@.]/g, '_')}`;
    const newRole = document.getElementById(selectId).value;
    try {
        await updateDoc(doc(db, "users", email), { 
            role: newRole,
            rol: newRole,
            col: newRole 
        });
        alert('تم تحديث رتبة وصلاحية المستخدم بنجاح!');
        loadAllUsers();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

sendNotificationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notifTitle').value;
    const body = document.getElementById('notifBody').value;
    try {
        await addDoc(collection(db, "notifications"), { title, body, date: new Date().toLocaleString('ar-EG'), read: false });
        alert('تم إرسال الإشعار بنجاح!');
        sendNotificationForm.reset();
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
});

async function checkUnreadNotifications() {
    try {
        const snapshot = await getDocs(query(collection(db, "notifications"), where("read", "==", false), limit(25)));
        const count = snapshot.size;
        const notifCountElem = document.getElementById('notifCount');
        const drawerNotifElem = document.getElementById('drawerNotifCount');
        if (notifCountElem) notifCountElem.textContent = count;
        if (drawerNotifElem) drawerNotifElem.textContent = count;
    } catch (e) { console.error(e); }
}

window.loadNotifications = async function() {
    const list = document.getElementById('notificationsListContent');
    if (!list) return;
    const snapshot = await getDocs(query(collection(db, "notifications"), limit(30)));
    if (snapshot.empty) {
        list.innerHTML = `<p style="text-align:center; color:#888;" data-i18n="no_notifs">${t('لا توجد إشعارات حالياً.', 'No notifications currently.')}</p>`;
        return;
    }
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const n = docSnap.data();
        list.innerHTML += `<div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:8px; border-right:4px solid var(--accent);"><h4>${escapeHtml(n.title)}</h4><p>${escapeHtml(n.body)}</p></div>`;
    });
};

window.loadUserProfile = async function() {
    if (!currentUser) return;
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const userPhoneDisplay = document.getElementById('userPhoneDisplay');

    if (userEmailDisplay) userEmailDisplay.textContent = currentUser.email;
    if (userRoleDisplay) userRoleDisplay.textContent = currentUserRole;

    try {
        const userSnap = await getDoc(doc(db, "users", currentUser.email));
        if (userSnap.exists() && userSnap.data().phone) {
            userSavedPhone = userSnap.data().phone;
            if (userPhoneDisplay) userPhoneDisplay.textContent = userSavedPhone;
        }
    } catch (e) { console.warn(e); }

    let invoicesHtml = '';

    const qOrders = query(collection(db, "orders"), where("userEmail", "==", currentUser.email), limit(40));
    const ordersSnap = await getDocs(qOrders);
    
    ordersSnap.forEach((docSnap) => {
        const orderId = docSnap.id;
        const safeId = escapeHtml(orderId);
        const order = docSnap.data();
        ordersCache[orderId] = order;
        invoicesHtml += `
            <div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid var(--primary);">
                ${t('رقم الفاتورة:', 'Invoice #:')} <strong>#${safeId.slice(0,6)}</strong> | ${t('الإجمالي:', 'Total:')} <strong>${escapeHtml(order.total)} ${t('ج.م', 'EGP')}</strong><br>
                ${t('الحالة:', 'Status:')} <span style="color:green">${escapeHtml(order.status)}</span> | ${t('سيارة التوصيل:', 'Delivery Vehicle:')} <strong>${escapeHtml(order.assignedVehicle || t('قريباً', 'Soon'))}</strong><br>
                <button onclick="previewInvoice('${safeId}')" style="background:var(--primary); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-top:5px;"><i class="fa-solid fa-eye"></i> ${t('معاينة الفاتورة', 'Preview Invoice')}</button>
            </div>`;
    });

    const qRfq = query(collection(db, "rfq_orders"), where("userEmail", "==", currentUser.email), limit(30));
    const rfqSnap = await getDocs(qRfq);

    rfqSnap.forEach((docSnap) => {
        const rfq = docSnap.data();
        invoicesHtml += `
            <div style="background:#f0f7f4; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid #173627;">
                <span style="background:#173627; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem;"><i class="fa-solid fa-ship"></i> ${t('طلب تصدير B2B', 'Export B2B Request')}</span>
                <p style="margin-top:5px; margin-bottom:3px;">${t('المنتج:', 'Product:')} <strong>${escapeHtml(rfq.productTitle)}</strong> | ${t('الكمية:', 'Qty:')} <strong>${escapeHtml(rfq.quantity)} ${t('طن', 'Tons')} (${escapeHtml(rfq.incoterm)})</strong></p>
                <p style="margin-bottom:3px; font-size:0.85rem; color:#555;">${t('الوجهة:', 'Destination:')} ${escapeHtml(rfq.destination)} | ${t('التاريخ:', 'Date:')} ${escapeHtml(rfq.date || '')}</p>
                ${t('الحالة:', 'Status:')} <span style="color:#d4af37; font-weight:bold;">${escapeHtml(rfq.status || t('قيد المراجعة والدراسة', 'Under Review'))}</span>
            </div>`;
    });

    const userInvoicesList = document.getElementById('userInvoicesList');
    if (userInvoicesList) userInvoicesList.innerHTML = invoicesHtml || `<p>${t('لا توجد فواتير أو طلبات تصدير سابقة', 'No previous invoices or export orders')}</p>`;
};

function renderTrackResultCard(found) {
    const safeId = escapeHtml(found.id);
    return `
        <div style="background:#eef5f1; padding:12px; border-radius:8px; border:1px solid #234d39;">
            <p><strong>${t('رقم الفاتورة:', 'Invoice #:')}</strong> #${safeId}</p>
            <p><strong>${t('حالة الشحنة:', 'Shipment Status:')}</strong> <span style="color:green; font-weight:bold;">${escapeHtml(found.status)}</span></p>
            <p><strong>${t('هاتف المشتري:', 'Buyer Phone:')}</strong> ${escapeHtml(found.phone || t('غير مسجل', 'Not registered'))}</p>
            <p><strong>${t('سيارة التوصيل:', 'Delivery Vehicle:')}</strong> ${escapeHtml(found.assignedVehicle || t('قيد التحديد', 'Pending'))}</p>
            <p><strong>${t('الإجمالي:', 'Total:')}</strong> ${escapeHtml(found.total)} ${t('ج.م', 'EGP')}</p>
            <button onclick="previewInvoice('${safeId}')" style="background:var(--primary); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-top:6px;"><i class="fa-solid fa-eye"></i> ${t('فتح الفاتورة', 'Open Invoice')}</button>
        </div>`;
}

trackInvoiceBtn?.addEventListener('click', async () => {
    const rawInput = document.getElementById('trackInvoiceInput').value.trim();
    const cleanId = rawInput.replace(/^#/, '');
    const resultBox = document.getElementById('trackResultBox');
    if (!cleanId) return;
    resultBox.innerHTML = t('جاري البحث...', 'Searching...');

    try {
        // 1. البحث السريع في الذاكرة المحلية أولاً (0 قراءات)
        const cachedMatchKey = Object.keys(ordersCache).find(k => k.toLowerCase().startsWith(cleanId.toLowerCase()));
        if (cachedMatchKey) {
            resultBox.innerHTML = renderTrackResultCard({ id: cachedMatchKey, ...ordersCache[cachedMatchKey] });
            return;
        }

        // 2. البحث بالمعرف الكامل
        const orderDocRef = doc(db, "orders", cleanId);
        const docSnap = await getDoc(orderDocRef);

        if (docSnap.exists()) {
            const found = { id: docSnap.id, ...docSnap.data() };
            ordersCache[found.id] = found;
            resultBox.innerHTML = renderTrackResultCard(found);
            return;
        }

        // 3. البحث بالرقم المختصر (6 أحرف) ضمن طلبات العميل أو الإدارة
        let qSearch;
        if (["admin", "assistant_manager", "accountant", "employee"].includes(currentUserRole)) {
            qSearch = query(collection(db, "orders"), limit(100));
        } else if (currentUser?.email) {
            qSearch = query(collection(db, "orders"), where("userEmail", "==", currentUser.email), limit(50));
        }

        if (qSearch) {
            const querySnap = await getDocs(qSearch);
            let found = null;
            querySnap.forEach(d => {
                if (d.id.toLowerCase().startsWith(cleanId.toLowerCase())) {
                    found = { id: d.id, ...d.data() };
                }
            });

            if (found) {
                ordersCache[found.id] = found;
                resultBox.innerHTML = renderTrackResultCard(found);
                return;
            }
        }

        resultBox.innerHTML = `<p style="color:red;">${t('لم يتم العثور على شحنة بهذا الرقم.', 'No shipment found with this number.')}</p>`;
    } catch (err) {
        resultBox.innerHTML = `<p style="color:red;">${t('حدث خطأ في البحث.', 'Error occurred while searching.')}</p>`;
    }
});

window.previewInvoice = async function(orderId, orderObj = null) {
    let order = orderObj || ordersCache[orderId];

    if (!order && orderId) {
        try {
            const snap = await getDoc(doc(db, "orders", orderId));
            if (snap.exists()) {
                order = snap.data();
                ordersCache[orderId] = order;
            }
        } catch (err) {
            alert(t('تعذر تحميل الفاتورة: ', 'Unable to load invoice: ') + err.message);
            return;
        }
    }

    if (!order) {
        alert(t('تعذر العثور على بيانات هذه الفاتورة.', 'Invoice data not found.'));
        return;
    }

    const modal = document.getElementById('invoiceModal');
    const content = document.getElementById('printableInvoiceContent');
    if (!modal || !content) return;

    let itemsHtml = '';
    if (Array.isArray(order.items)) {
        const groupedItems = {};
        order.items.forEach(item => {
            const key = item.id || item.name;
            if (!groupedItems[key]) {
                groupedItems[key] = {
                    name: item.name || '',
                    price: Number(item.price || 0),
                    qty: 0
                };
            }
            groupedItems[key].qty += 1;
        });

        Object.values(groupedItems).forEach(item => {
            itemsHtml += `<tr>
                <td style="padding:8px; border:1px solid #ddd;">${escapeHtml(item.name)}</td>
                <td style="padding:8px; border:1px solid #ddd;">${item.qty}</td>
                <td style="padding:8px; border:1px solid #ddd;">${item.price * item.qty} ${t('ج.م', 'EGP')}</td>
            </tr>`;
        });
    }

    content.innerHTML = `
        <div id="invoiceCanvasArea" style="background:#fff; padding:15px; text-align:${currentLang === 'en' ? 'left' : 'right'};">
            <h2 style="color:var(--primary); text-align:center; font-size:1.3rem; margin-bottom:5px;">${t('مؤسسة الإخلاص للأعلاف والحبوب', 'Al-Ekhlas Feed & Grains Est.')}</h2>
            <p style="text-align:center; color:#666; font-size:0.85rem; margin-bottom:10px;">${t('فاتورة مبيعات رسمية', 'Official Sales Invoice')}</p>
            <hr style="margin:8px 0; border:0; border-top:1px solid #eee;">
            <p style="font-size:0.85rem; margin-bottom:4px;"><strong>${t('رقم الفاتورة:', 'Invoice #:')}</strong> #${escapeHtml(orderId)}</p>
            <p style="font-size:0.85rem; margin-bottom:4px;"><strong>${t('العميل:', 'Client:')}</strong> ${escapeHtml(order.userEmail || '')}</p>
            <p style="font-size:0.85rem; margin-bottom:8px;"><strong>${t('رقم الهاتف المحفوظ:', 'Saved Phone:')}</strong> ${escapeHtml(order.phone || t('غير مسجل', 'Not registered'))}</p>
            <table style="width:100%; border-collapse:collapse; margin:12px 0;">
                <tr style="background:var(--primary); color:#fff;"><th style="padding:6px; border:1px solid #ddd;">${t('المنتج', 'Product')}</th><th style="padding:6px; border:1px solid #ddd;">${t('الكمية', 'Qty')}</th><th style="padding:6px; border:1px solid #ddd;">${t('السعر', 'Price')}</th></tr>
                ${itemsHtml}
            </table>
            <h3 style="font-size:1.1rem; color:var(--primary); margin-top:10px;">${t('الإجمالي النهائي:', 'Grand Total:')} ${escapeHtml(order.total || 0)} ${t('ج.م', 'EGP')}</h3>
        </div>`;

    modal.style.display = 'flex';

    const closeBtn = document.getElementById('closeInvoiceModalBtn');
    const printBtn = document.getElementById('printInvoiceBtn');
    const saveImgBtn = document.getElementById('saveInvoiceImgBtn');

    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
    if (printBtn) printBtn.onclick = () => { triggerAndroidPrintOrShare(); };
    if (saveImgBtn) saveImgBtn.onclick = saveInvoiceAsImage;
};

async function saveInvoiceAsImage() {
    const canvasArea = document.getElementById('invoiceCanvasArea');
    if (!canvasArea) return;

    if (typeof html2canvas === 'undefined') {
        alert(t('يرجى الاتصال بالإنترنت لتحميل مكتبة التقاط الصور.', 'Please connect to the internet to load the screenshot library.'));
        return;
    }

    const saveImgBtn = document.getElementById('saveInvoiceImgBtn');
    if (saveImgBtn) saveImgBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('جاري التحضير...', 'Preparing...')}`;

    try {
        const canvas = await html2canvas(canvasArea, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });

        const fileName = `فاتورة_الإخلاص_${Date.now()}.png`;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (!blob) throw new Error('فشل معالجة الصورة');

        const file = new File([blob], fileName, { type: 'image/png' });

        downloadBlobFallback(blob, fileName);

        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins?.Share) {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Data = reader.result;
                if (Capacitor.Plugins.Filesystem) {
                    const savedFile = await Capacitor.Plugins.Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: 'CACHE'
                    });
                    await Capacitor.Plugins.Share.share({
                        title: 'الفاتورة الإلكترونية',
                        text: 'الفاتورة الإلكترونية - مؤسسة الإخلاص للأعلاف والحبوب',
                        url: savedFile.uri,
                        dialogTitle: 'مشاركة الفاتورة'
                    });
                } else if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'الفاتورة الإلكترونية',
                        text: 'الفاتورة الإلكترونية - مؤسسة الإخلاص للأعلاف والحبوب'
                    });
                }
            };
        } else if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'الفاتورة الإلكترونية',
                text: 'الفاتورة الإلكترونية - مؤسسة الإخلاص للأعلاف والحبوب'
            });
        }

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('تنبيه مشاركة/حفظ الصورة:', err);
        }
    } finally {
        if (saveImgBtn) saveImgBtn.innerHTML = `<i class="fa-solid fa-image"></i> ${t('حفظ كصورة', 'Save as Image')}`;
    }
}

function triggerAndroidPrintOrShare() {
    saveInvoiceAsImage();
}

function downloadBlobFallback(blob, fileName) {
    const url = URL.createObjectURL ? URL.createObjectURL(blob) : window.webkitURL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

window.initUserMap = function() {
    const userMapElem = document.getElementById('userMap');
    if (!userMapElem || typeof L === 'undefined') return;

    const savedLat = parseFloat(localStorage.getItem('omda_user_lat')) || selectedLat;
    const savedLng = parseFloat(localStorage.getItem('omda_user_lng')) || selectedLng;
    selectedLat = savedLat;
    selectedLng = savedLng;

    if (userMap) { 
        userMap.invalidateSize(); 
        userMap.setView([selectedLat, selectedLng], 14);
        if (userMarker) userMarker.setLatLng([selectedLat, selectedLng]);
        return; 
    }

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19,
        keepBuffer: 3,
        updateWhenIdle: true
    });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri Satellite',
        keepBuffer: 3
    });

    userMap = L.map('userMap', {
        center: [selectedLat, selectedLng],
        zoom: 14,
        layers: [streetLayer],
        preferCanvas: true,
        rotate: true,
        touchRotate: true,
        rotateControl: true,
        bearing: 0
    });

    const baseMaps = {
        "خريطة الشوارع": streetLayer,
        "قمر صناعي (Satellite)": satelliteLayer
    };
    L.control.layers(baseMaps).addTo(userMap);

    const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background:#173627; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.4); border:2px solid #fff;"><i class="fa-solid fa-location-dot" style="font-size:18px;"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
    });

    userMarker = L.marker([selectedLat, selectedLng], { draggable: true, icon: userIcon }).addTo(userMap);
    userMarker.bindPopup(t('موقع التوصيل المحدد', 'Selected Delivery Location')).openPopup();

    userMarker.on('dragend', () => {
        const pos = userMarker.getLatLng();
        selectedLat = pos.lat;
        selectedLng = pos.lng;
    });

    userMap.on('click', (e) => {
        selectedLat = e.latlng.lat;
        selectedLng = e.latlng.lng;
        userMarker.setLatLng([selectedLat, selectedLng]);
        userMap.panTo([selectedLat, selectedLng]);
    });

    setTimeout(() => {
        if (userMap) userMap.invalidateSize();
    }, 250);
};

locateMeBtn?.addEventListener('click', async () => {
    locateMeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('جاري التحديد...', 'Locating...')}`;
    try {
        const loc = await getCurrentDeviceLocation();
        selectedLat = loc.lat;
        selectedLng = loc.lng;
        if (userMap) {
            userMap.setView([selectedLat, selectedLng], 15);
            if (userMarker) userMarker.setLatLng([selectedLat, selectedLng]);
            userMap.invalidateSize();
        }
        alert(t('تم تحديد موقعك بنجاح!', 'Location detected successfully!'));
    } catch (err) {
        alert(err.message);
    } finally {
        locateMeBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> ${t('تحديد موقعي الحالي تلقائياً (GPS)', 'Auto-Detect My Current Location (GPS)')}`;
    }
});

saveLocationBtn?.addEventListener('click', async () => {
    if (!currentUser) {
        alert(t('الرجاء تسجيل الدخول أولاً لحفظ موقع التوصيل.', 'Please sign in first to save delivery location.'));
        if (authModal) authModal.style.display = 'flex';
        return;
    }

    try {
        localStorage.setItem('omda_user_lat', selectedLat);
        localStorage.setItem('omda_user_lng', selectedLng);

        const userRef = doc(db, "users", currentUser.email);
        await setDoc(userRef, {
            lat: selectedLat,
            lng: selectedLng,
            locationUpdated: new Date().toISOString()
        }, { merge: true });

        alert(t(`تم حفظ موقع التوصيل بنجاح! الإحداثيات: (${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)})`, `Delivery location saved! Coordinates: (${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)})`));
    } catch (err) {
        alert(t('خطأ أثناء حفظ الموقع: ', 'Error saving location: ') + err.message);
    }
});

async function initAdminMap() {
    const adminMapElem = document.getElementById('adminMap');
    if (!adminMapElem || typeof L === 'undefined') return;

    if (adminMap) {
        adminMap.invalidateSize();
        await refreshAdminMapMarkers();
        return;
    }

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19,
        keepBuffer: 3,
        updateWhenIdle: true
    });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri Satellite',
        keepBuffer: 3
    });

    adminMap = L.map('adminMap', {
        center: [30.0444, 31.2357],
        zoom: 11,
        layers: [streetLayer],
        preferCanvas: true,
        rotate: true,
        touchRotate: true,
        rotateControl: true,
        bearing: 0
    });

    const baseMaps = {
        "خريطة الشوارع": streetLayer,
        "قمر صناعي (Satellite)": satelliteLayer
    };
    L.control.layers(baseMaps).addTo(adminMap);

    adminMapMarkersGroup = L.layerGroup().addTo(adminMap);

    await refreshAdminMapMarkers();
    setTimeout(() => { if (adminMap) adminMap.invalidateSize(); }, 250);
}

async function refreshAdminMapMarkers() {
    if (!adminMap || !adminMapMarkersGroup) return;
    adminMapMarkersGroup.clearLayers();

    try {
        const snapshot = await getDocs(collection(db, "vehicles"));
        const bounds = [];

        const vehicleIcon = L.divIcon({
            className: 'custom-veh-marker',
            html: `<div style="background:#e63946; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.4); border:2px solid #fff;"><i class="fa-solid fa-truck-front" style="font-size:16px;"></i></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34]
        });

        snapshot.forEach(docSnap => {
            const v = docSnap.data();
            if (v.lat && v.lng) {
                const marker = L.marker([v.lat, v.lng], { icon: vehicleIcon })
                    .bindPopup(`<b>سيارة أسطول:</b> ${escapeHtml(v.plate)}<br><b>النوع:</b> ${escapeHtml(v.model)}<br><b>السائق:</b> ${escapeHtml(v.driver)}`);
                adminMapMarkersGroup.addLayer(marker);
                bounds.push([v.lat, v.lng]);
            }
        });

        if (bounds.length > 0) {
            adminMap.fitBounds(bounds, { padding: [40, 40] });
        }
    } catch (e) {
        console.warn("خطأ في تحديث مواقع الخريطة:", e);
    }
}

if (refreshAdminMapBtn) {
    refreshAdminMapBtn.addEventListener('click', async () => {
        if (!adminMap) {
            await initAdminMap();
        } else {
            await refreshAdminMapMarkers();
            adminMap.invalidateSize();
            alert('تم تحديث الخريطة ومواقع الأسطول بنجاح!');
        }
    });
}

window.addEventListener('resize', () => {
    if (userMap) userMap.invalidateSize();
    if (adminMap) adminMap.invalidateSize();
});

// بدء المزامنة الفورية وتطبيق اللغة المختارة
applyAppLanguage(currentLang);
listenRealtimeData();
updateCartUI();
