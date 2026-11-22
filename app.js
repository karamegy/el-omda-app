import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where, orderBy, limit, enableIndexedDbPersistence, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === التسجيل التلقائي والـ Service Worker ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.log('SW error:', error));
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
// === دوال الحماية وتنقية النصوص والروابط (Security Guards) ===
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

function sanitizeUrl(url, fallback = '') {
    if (!url || typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    if (/^(https?:\/\/|\.\/|\/)/i.test(trimmed)) {
        return escapeHtml(trimmed);
    }
    return fallback;
}

function isAdminRole(role) {
    return role === "admin";
}

function isStaffRole(role) {
    return ["admin", "assistant_manager", "accountant", "employee"].includes(role);
}

function isDriverRole(role) {
    return ["driver", "admin", "assistant_manager"].includes(role);
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
        nav_market_prices: "بورصة الخامات اليومية",
        live_badge: "مباشر",
        nav_feed_calc: "حاسبة الأعلاف والتغذية",
        nav_quality_specs: "شهادات الجودة والعينات",
        nav_profile_track: "حسابي وتتبع الشحنات",
        nav_driver_portal: "بوابة السائق الميداني",
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
        market_prices_title: "بورصة الأسعار اليومية للخامات والحبوب",
        market_prices_sub: "تحديث يومي مباشر لأسعار الذرة الصفراء، كسب الصويا، الردة، والأعلاف المركزة للطن والشكارة",
        market_updated_today: "تحديث اليوم",
        market_prices_note: "الأسعار المعروضة استرشادية للطن أرض المصنع / الميناء وتُحدَّث يومياً وفق حركة السوق.",
        feed_calc_title: "حاسبة الأعلاف والتغذية الذكية للمزارع",
        feed_calc_sub: "احسب احتياج مزرعتك اليومي والشهري من العلف والتكلفة التقديرية وأضف الكمية للسلة فوراً",
        calc_project_type: "نوع النشاط / القطيع",
        calc_opt_broiler: "دواجن تسمين (بادي / نامي / ناهي)",
        calc_opt_layer: "دواجن بياض إنتاجي",
        calc_opt_cattle: "تسمين عجول وماشية",
        calc_opt_dairy: "أبقار وجاموس حلاب",
        calc_opt_sheep: "أغنام وماعز",
        calc_opt_fish: "أسماك بلطي وبوري (علف طافي)",
        calc_count_label: "عدد الرؤوس / الطيور",
        calc_days_label: "مدة الدورة (بالأيام)",
        calc_bag_weight: "وزن الشكارة القياسي (كجم)",
        calc_bag_50: "50 كجم (شكارة قياسية)",
        calc_bag_25: "25 كجم",
        calc_btn_run: "احسب الاحتياج والتكلفة الآن",
        calc_result_title: "نتائج التقدير الغذائي لمشروعك",
        calc_add_cart_btn: "إضافة الكمية المحسوبة للسلة",
        quality_specs_title: "شهادات الجودة والتحاليل المعملية",
        quality_specs_sub: "مواصفات معتمدة ونسب البروتين والطاقة، مع إمكانية طلب عينة فحص للمزارع والمستوردين (B2B)",
        sample_req_title: "طلب عينة فحص معملي / تجريبية (B2B & مزارع)",
        sample_prod_label: "المنتج / العلف المطلوب فحص عينته",
        sample_company_label: "اسم المزرعة / الشركة / الجهة المستوردة",
        sample_weight_label: "حجم العينة المطلوبة",
        sample_opt_1kg: "1 كجم (عينة تحليل معملي)",
        sample_opt_5kg: "5 كجم (عينة تشغيل تجريبي)",
        sample_opt_25kg: "25 كجم (شيكارة فحص)",
        sample_phone_label: "رقم الهاتف / الواتساب",
        sample_address_label: "عنوان استلام العينة (المحافظة / الدولة والميناء)",
        sample_submit_btn: "إرسال طلب العينة الآن",
        driver_portal_title: "بوابة السائق الميداني وخط السير",
        driver_account_label: "حساب السائق:",
        driver_vehicle_label: "السيارة المسندة:",
        driver_update_gps_btn: "تحديث موقع السيارة الحي (GPS)",
        driver_orders_title: "الشحنات المطلوب توصيلها حالياً",
        driver_orders_sub: "اضغط على زر الخريطة لبدء الملاحة لموقع العميل، أو أكد التسليم عند الوصول",
        profile_header: "حسابي الشخصي وتتبع الشحنات",
        email_label: "البريد الإلكتروني:",
        saved_phone: "رقم الهاتف المحفوظ:",
        account_role: "رتبة الحساب:",
        user_credit_title: "كشف الرصيد الائتماني والآجل",
        credit_total_debit: "إجمالي الآجل",
        credit_total_paid: "إجمالي المسدد",
        credit_remaining: "الرصيد المتبقي",
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
        nav_market_prices: "Daily Commodity Market",
        live_badge: "LIVE",
        nav_feed_calc: "Feed & Nutrition Calculator",
        nav_quality_specs: "Quality Certificates & Samples",
        nav_profile_track: "My Account & Shipment Tracking",
        nav_driver_portal: "Field Driver Portal",
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
        market_prices_title: "Daily Commodity & Grain Market Prices",
        market_prices_sub: "Daily updates on Yellow Corn, Soybean Meal, Bran, and Concentrate Feeds per Ton & Bag",
        market_updated_today: "Updated Today",
        market_prices_note: "Listed prices are indicative per ton ex-factory/port and updated daily according to market movement.",
        feed_calc_title: "Smart Farm Feed & Nutrition Calculator",
        feed_calc_sub: "Calculate daily and cycle feed requirements, estimated cost, and add bags directly to your cart",
        calc_project_type: "Livestock / Flock Type",
        calc_opt_broiler: "Broiler Poultry (Starter / Grower / Finisher)",
        calc_opt_layer: "Layer Poultry",
        calc_opt_cattle: "Beef Cattle Fattening",
        calc_opt_dairy: "Dairy Cows & Buffalo",
        calc_opt_sheep: "Sheep & Goats",
        calc_opt_fish: "Tilapia & Mullet Fish (Floating Feed)",
        calc_count_label: "Number of Heads / Birds",
        calc_days_label: "Cycle Duration (Days)",
        calc_bag_weight: "Standard Bag Weight (kg)",
        calc_bag_50: "50 kg (Standard Bag)",
        calc_bag_25: "25 kg",
        calc_btn_run: "Calculate Requirement & Cost Now",
        calc_result_title: "Nutritional Estimation Results",
        calc_add_cart_btn: "Add Calculated Bags to Cart",
        quality_specs_title: "Quality Certificates & Lab Analyses",
        quality_specs_sub: "Certified specs, protein & energy ratios, with lab sample requests for farms & B2B importers",
        sample_req_title: "Request Lab / Trial Inspection Sample (B2B & Farms)",
        sample_prod_label: "Product / Feed for Sample Inspection",
        sample_company_label: "Farm / Company / Importer Name",
        sample_weight_label: "Requested Sample Size",
        sample_opt_1kg: "1 kg (Lab Analysis Sample)",
        sample_opt_5kg: "5 kg (Trial Run Sample)",
        sample_opt_25kg: "25 kg (Inspection Bag)",
        sample_phone_label: "Phone / WhatsApp Number",
        sample_address_label: "Sample Delivery Address (Governorate / Country & Port)",
        sample_submit_btn: "Submit Sample Request Now",
        driver_portal_title: "Field Driver Portal & Route",
        driver_account_label: "Driver Account:",
        driver_vehicle_label: "Assigned Vehicle:",
        driver_update_gps_btn: "Update Live Vehicle Location (GPS)",
        driver_orders_title: "Active Shipments Assigned for Delivery",
        driver_orders_sub: "Click Navigate to open GPS directions to customer, or confirm delivery upon arrival",
        profile_header: "My Account & Shipment Tracking",
        email_label: "Email:",
        saved_phone: "Saved Phone:",
        account_role: "Account Role:",
        user_credit_title: "Credit Account & Balance Statement",
        credit_total_debit: "Total Credit",
        credit_total_paid: "Total Paid",
        credit_remaining: "Remaining Balance",
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
        rfq_dest_ph: "مثال: السعودية - ميناء جدة الإسلامي",
        sample_prod_ph: "مثال: علف بادي تسمين 23% أو ذرة صفراء درجة أولى",
        sample_company_ph: "مثال: مزارع النيل للإنتاج الحيواني",
        sample_address_ph: "مثال: الجيزة - طريق مصر إسكندرية الصحراوي"
    },
    en: {
        search_placeholder: "Search for feeds, grains, supplements...",
        track_input_ph: "Enter invoice or order number",
        chat_input_ph: "Type your message to management here...",
        rfq_company_ph: "e.g., Gulf Agricultural Development Co.",
        rfq_dest_ph: "e.g., Saudi Arabia - Jeddah Islamic Port",
        sample_prod_ph: "e.g., Broiler Starter 23% or Grade-A Yellow Corn",
        sample_company_ph: "e.g., Nile Livestock Farms",
        sample_address_ph: "e.g., Giza - Cairo-Alexandria Desert Rd"
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
    if (marketPricesCache.length > 0) renderMarketPricesGrid();
    if (qualityCertsCache.length > 0) renderQualitySpecsGrid();
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

let cart = [];
try {
    const rawCart = JSON.parse(localStorage.getItem('omda_cart') || '[]');
    if (Array.isArray(rawCart)) {
        cart = rawCart.filter(item => item && typeof item === 'object' && Number(item.price) > 0);
    }
} catch (_) {
    cart = [];
}

let allProductsCache = [];
let allCategoriesCache = [];
let ordersCache = {};
let vehiclesCache = [];
let marketPricesCache = [];
let qualityCertsCache = [];
let lastCalcResult = null;
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
let unsubscribeAdminUnreadCount = null;
let recentAdminChatsCache = [];
let activeAdminThreadMessages = [];

// DOM Elements
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.querySelector('.close-auth-modal');
const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const adminBtn = document.getElementById('adminBtn');
const driverBtn = document.getElementById('driverBtn');
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

const ALLOWED_MEDIA_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
];

function uploadMediaToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
        if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
            reject(new Error("نوع الملف غير مدعوم! يُسمح فقط بالصور (JPG, PNG, WEBP) والفيديو (MP4, WEBM)."));
            return;
        }
        const isVideo = file.type.startsWith('video/');
        const maxBytes = isVideo ? (50 * 1024 * 1024) : (10 * 1024 * 1024);
        if (file.size > maxBytes) {
            reject(new Error(isVideo ? "حجم الفيديو يتجاوز الحد الأقصى (50 ميجابايت)." : "حجم الصورة يتجاوز الحد الأقصى (10 ميجابايت)."));
            return;
        }

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
    if (!currentUser) {
        if (authModal) authModal.style.display = 'flex';
        return;
    }
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
    if (sectionId === 'profileSection' && !currentUser) {
        if (authModal) authModal.style.display = 'flex';
        return;
    }
    if (sectionId === 'adminSection' && (!currentUser || !isStaffRole(currentUserRole))) {
        alert(t('عذراً، هذه اللوحة مخصصة للإدارة والموظفين فقط.', 'Access restricted to staff and administrators only.'));
        return;
    }
    if (sectionId === 'driverSection' && (!currentUser || !isDriverRole(currentUserRole))) {
        alert(t('عذراً، هذه البوابة مخصصة للسائقين المعتمدين فقط.', 'Access restricted to authorized drivers only.'));
        return;
    }
    if (sectionId !== 'adminSection') {
        stopAdminChatListeners();
    }

    document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.style.display = 'block';

    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
    if (sectionId === 'productsSection') document.getElementById('navHomeBtn')?.classList.add('active');
    if (sectionId === 'categoriesSection') document.getElementById('navCatBtn')?.classList.add('active');
    if (sectionId === 'marketPricesSection') {
        loadMarketPricesSection();
    }
    if (sectionId === 'qualitySpecsSection') {
        loadQualitySpecsSection();
    }
    if (sectionId === 'driverSection') {
        loadDriverPortal();
    }
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
        const tabUserBtn = document.getElementById('tabUserBtn');
        if (tabUserBtn) {
            tabUserBtn.style.display = isAdminRole(currentUserRole) ? '' : 'none';
        }
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
            
            const isAdminUser = isAdminRole(currentUserRole);
            const isStaffUser = isStaffRole(currentUserRole);
            const isDriverUser = isDriverRole(currentUserRole);

            if (adminBtn) {
                adminBtn.style.display = isStaffUser ? 'flex' : 'none';
            }
            const tabUserBtn = document.getElementById('tabUserBtn');
            if (tabUserBtn) {
                tabUserBtn.style.display = isAdminUser ? '' : 'none';
            }
            if (driverBtn) {
                driverBtn.style.display = isDriverUser ? 'flex' : 'none';
            }
            if (isStaffUser) {
                listenAdminUnreadChatsCount();
            } else if (unsubscribeAdminUnreadCount) {
                unsubscribeAdminUnreadCount();
                unsubscribeAdminUnreadCount = null;
                updateAdminUnreadBadge(0);
            }
        } catch (err) {
            if (adminBtn) adminBtn.style.display = 'none';
            if (driverBtn) driverBtn.style.display = 'none';
            const tabUserBtn = document.getElementById('tabUserBtn');
            if (tabUserBtn) tabUserBtn.style.display = 'none';
        }

        listenUserChat();
    } else {
        currentUser = null;
        currentUserRole = 'customer';
        userSavedPhone = '';
        updateAuthButtonLabel();
        if (adminBtn) adminBtn.style.display = 'none';
        if (driverBtn) driverBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        const tabUserBtn = document.getElementById('tabUserBtn');
        if (tabUserBtn) tabUserBtn.style.display = 'none';
        if (unsubscribeAdminUnreadCount) {
            unsubscribeAdminUnreadCount();
            unsubscribeAdminUnreadCount = null;
        }
        updateAdminUnreadBadge(0);
    }
});

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
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
                    <div class="product-card" data-cat="${safeCatId}" style="text-align:center; padding:20px; cursor:pointer;" onclick="switchSection('productsSection'); renderProducts(this.dataset.cat, '');">
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
    
    const fallbackImg = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=100&q=80';

    const updateCarouselItem = () => {
        const prod = allProductsCache[index];
        if (!prod) return;
        const prodTitle = escapeHtml(getProdDisplayName(prod));
        const safeMedia = sanitizeUrl(prod.mediaUrl, fallbackImg);
        let mediaThumb = `<img src="${safeMedia}" loading="lazy" style="width:60px; height:60px; border-radius:10px; object-fit:cover; flex-shrink:0;">`;
        if (prod.mediaType === 'video' && safeMedia !== fallbackImg) {
            mediaThumb = `<video src="${safeMedia}#t=0.1" preload="metadata" muted playsinline style="width:60px; height:60px; border-radius:10px; object-fit:cover; flex-shrink:0;"></video>`;
        }
        
        const isExportProd = prod.category === 'export_feed' || prod.category === 'export' || prod.isExport;

        bannerContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; width: 100%; min-width:0;" onclick="openProductModal('${escapeHtml(prod.id)}')">
                ${mediaThumb}
                <div style="flex: 1; min-width: 0;">
                    <h4 style="color: var(--primary); font-size: 0.98rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prodTitle}</h4>
                    <p style="font-size: 0.88rem; color: var(--accent); font-weight: bold;">${isExportProd ? t('قسم التصدير والجملة B2B', 'Export & Wholesale B2B') : t('السعر المميز: ' + escapeHtml(prod.price) + ' ج.م', 'Special Price: ' + escapeHtml(prod.price) + ' EGP')}</p>
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
    const submitBtn = rfqForm.querySelector('button[type="submit"]');
    if (submitBtn?.disabled) return;

    const companyName = document.getElementById('rfqCompanyName').value.trim();
    const destination = document.getElementById('rfqDestination').value.trim();
    const quantity = Number(document.getElementById('rfqQuantity').value);
    const incoterm = document.getElementById('rfqIncoterm').value;
    const phone = document.getElementById('rfqPhone').value.trim();
    const prodTitle = document.getElementById('rfqProdTitle').textContent.trim();

    if (companyName.length < 2 || phone.length < 6 || !(quantity > 0)) {
        alert(t('يرجى إدخال بيانات الشركة والكمية ورقم الهاتف بشكل صحيح.', 'Please enter valid company, quantity, and phone details.'));
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
        await addDoc(collection(db, "rfq_orders"), {
            companyName: companyName.slice(0, 200),
            destination: destination.slice(0, 200),
            quantity,
            incoterm,
            phone: phone.slice(0, 30),
            productTitle: prodTitle.slice(0, 200),
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
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

// ==========================================
// === 1. بورصة الأسعار اليومية للخامات والحبوب ===
// ==========================================
const DEFAULT_MARKET_ITEMS = [
    { id: 'def_corn', nameAr: 'ذرة صفراء أرجنتيني / برازيلي', nameEn: 'Argentine / Brazilian Yellow Corn', price: 14200, unit: 'طن صب أرض الميناء', trend: 'stable', change: 'ثبات' },
    { id: 'def_soya', nameAr: 'كسب فول صويا 46% محلي ومستورد', nameEn: 'Soybean Meal 46% Local & Imported', price: 22800, unit: 'طن معبأ أرض المصنع', trend: 'down', change: '-150 ج.م' },
    { id: 'def_bran', nameAr: 'ردة خشنة نخالة قمح ممتازة', nameEn: 'Coarse Wheat Bran Grade A', price: 11500, unit: 'طن معبأ', trend: 'up', change: '+100 ج.م' },
    { id: 'def_broiler', nameAr: 'علف بادي تسمين سوبر 23%', nameEn: 'Super Broiler Starter Feed 23%', price: 21400, unit: 'طن معبأ (شكارة 50 كجم)', trend: 'stable', change: 'ثبات' }
];

function renderMarketPricesGrid() {
    const grid = document.getElementById('marketPricesGrid');
    if (!grid) return;

    const items = marketPricesCache.length > 0 ? marketPricesCache : DEFAULT_MARKET_ITEMS;
    grid.innerHTML = items.map(item => {
        const title = escapeHtml(currentLang === 'en' && item.nameEn ? item.nameEn : item.nameAr);
        const trend = item.trend || 'stable';
        const trendIcon = trend === 'up' ? 'fa-arrow-trend-up' : (trend === 'down' ? 'fa-arrow-trend-down' : 'fa-minus');
        const trendColor = trend === 'up' ? '#dc2626' : (trend === 'down' ? '#16a34a' : '#64748b');
        const trendLabel = trend === 'up' ? t('صعود', 'Up') : (trend === 'down' ? t('هبوط', 'Down') : t('مستقر', 'Stable'));

        return `
            <div class="market-price-card" style="background:#fff; border:1px solid var(--border-color); border-radius:14px; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <h4 style="color:var(--primary); font-size:1rem; margin:0; line-height:1.4;">${title}</h4>
                    <span style="background:${trendColor}15; color:${trendColor}; padding:3px 9px; border-radius:20px; font-size:0.78rem; font-weight:800; white-space:nowrap;">
                        <i class="fa-solid ${trendIcon}"></i> ${escapeHtml(item.change || trendLabel)}
                    </span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:baseline; border-top:1px dashed #e2e8f0; padding-top:10px;">
                    <div>
                        <span style="font-size:1.35rem; font-weight:900; color:var(--primary-dark);">${Number(item.price || 0).toLocaleString()}</span>
                        <small style="color:var(--accent); font-weight:bold;"> ${t('ج.م', 'EGP')}</small>
                    </div>
                    <span style="font-size:0.8rem; color:#64748b;">${escapeHtml(item.unit || '')}</span>
                </div>
            </div>`;
    }).join('');
}

async function loadMarketPricesSection() {
    const cached = await OmdaLocalDB.get('market_prices', []);
    if (cached.length > 0) {
        marketPricesCache = cached;
    }
    renderMarketPricesGrid();

    try {
        const snap = await getDocs(query(collection(db, "market_prices"), limit(40)));
        const fresh = [];
        snap.forEach(d => fresh.push({ id: d.id, ...d.data() }));
        if (fresh.length > 0) {
            marketPricesCache = fresh;
            OmdaLocalDB.set('market_prices', fresh);
            renderMarketPricesGrid();
            const updatedBadge = document.getElementById('marketPricesUpdatedAt');
            if (updatedBadge && fresh[0].updatedAtLabel) {
                updatedBadge.textContent = fresh[0].updatedAtLabel;
            }
        }
    } catch (e) {
        console.warn("استخدام أسعار البورصة المحفوظة محلياً:", e.message);
    }
}

async function loadAdminMarketPrices() {
    const list = document.getElementById('adminMarketPricesList');
    if (!list) return;
    list.innerHTML = 'جاري التحميل...';

    try {
        const snap = await getDocs(query(collection(db, "market_prices"), limit(50)));
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        marketPricesCache = items;
        OmdaLocalDB.set('market_prices', items);

        if (items.length === 0) {
            list.innerHTML = '<p style="color:#888;">لا توجد أسعار مسجلة بعد (تظهر الأسعار الاسترشادية الافتراضية للزوار حالياً).</p>';
            return;
        }

        list.innerHTML = items.map(item => {
            const safeId = escapeHtml(item.id);
            return `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <strong>${escapeHtml(item.nameAr)}</strong> ${item.nameEn ? `(${escapeHtml(item.nameEn)})` : ''} — 
                        <span style="color:var(--accent); font-weight:bold;">${Number(item.price).toLocaleString()} ج.م</span> / ${escapeHtml(item.unit)}
                        <span style="font-size:0.8rem; color:#666;">[${escapeHtml(item.change || item.trend)}]</span>
                    </div>
                    <div>
                        <button onclick='editMarketPriceItem("${safeId}")' style="background:#234d39; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick='deleteMarketPriceItem("${safeId}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        }).join('');
    } catch (e) {
        list.innerHTML = 'خطأ في تحميل أسعار البورصة.';
    }
}

window.editMarketPriceItem = function(id) {
    const item = marketPricesCache.find(i => i.id === id);
    if (!item) return;
    document.getElementById('editMarketItemId').value = item.id;
    document.getElementById('mpNameAr').value = item.nameAr || '';
    document.getElementById('mpNameEn').value = item.nameEn || '';
    document.getElementById('mpPrice').value = item.price || '';
    document.getElementById('mpUnit').value = item.unit || 'طن صب / معبأ';
    document.getElementById('mpTrend').value = item.trend || 'stable';
    document.getElementById('mpChange').value = item.change || 'ثبات';
    document.getElementById('saveMarketPriceBtn').textContent = 'تحديث السعر في البورصة';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteMarketPriceItem = async function(id) {
    if (!confirm('هل تريد حذف هذا الصنف من البورصة؟')) return;
    try {
        await deleteDoc(doc(db, "market_prices", id));
        alert('تم الحذف بنجاح');
        loadAdminMarketPrices();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

document.getElementById('updateMarketPriceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveMarketPriceBtn');
    if (saveBtn?.disabled) return;

    const priceVal = Number(document.getElementById('mpPrice').value);
    if (!(priceVal > 0)) {
        alert('يرجى إدخال سعر صحيح أكبر من صفر.');
        return;
    }

    const editId = document.getElementById('editMarketItemId').value.trim();
    const payload = {
        nameAr: document.getElementById('mpNameAr').value.trim(),
        nameEn: document.getElementById('mpNameEn').value.trim(),
        price: priceVal,
        unit: document.getElementById('mpUnit').value.trim(),
        trend: document.getElementById('mpTrend').value,
        change: document.getElementById('mpChange').value.trim() || 'ثبات',
        updatedAtLabel: new Date().toLocaleDateString('ar-EG'),
        updatedAt: new Date().toISOString()
    };

    if (saveBtn) saveBtn.disabled = true;
    try {
        if (editId) {
            await updateDoc(doc(db, "market_prices", editId), payload);
            alert('تم تحديث السعر في البورصة بنجاح!');
        } else {
            await addDoc(collection(db, "market_prices"), payload);
            alert('تم نشر السعر الجديد في البورصة بنجاح!');
        }
        e.target.reset();
        document.getElementById('editMarketItemId').value = '';
        if (saveBtn) saveBtn.textContent = 'حفظ ونشر في البورصة';
        loadAdminMarketPrices();
    } catch (err) {
        alert('خطأ أثناء الحفظ: ' + err.message);
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
});

// ==========================================
// === 2. حاسبة الأعلاف والتغذية الذكية وربطها بالسلة ===
// ==========================================
const FEED_RATES_CONFIG = {
    broiler: { dailyKg: 0.11, labelAr: 'علف دواجن تسمين سوبر', labelEn: 'Super Broiler Feed', defaultBagPrice: 1070 },
    layer:   { dailyKg: 0.115, labelAr: 'علف دواجن بياض إنتاجي', labelEn: 'Layer Production Feed', defaultBagPrice: 960 },
    cattle:  { dailyKg: 6.5, labelAr: 'علف تسمين عجول وماشية', labelEn: 'Cattle Fattening Feed', defaultBagPrice: 820 },
    dairy:   { dailyKg: 8.0, labelAr: 'علف حلائب عالي الإدرار', labelEn: 'High-Yield Dairy Feed', defaultBagPrice: 880 },
    sheep:   { dailyKg: 1.2, labelAr: 'علف تسمين أغنام وماعز', labelEn: 'Sheep & Goat Feed', defaultBagPrice: 790 },
    fish:    { dailyKg: 0.035, labelAr: 'علف أسماك طافي 30% بروتين', labelEn: 'Floating Fish Feed 30%', defaultBagPrice: 1150 }
};

document.getElementById('feedCalculatorForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('calcLivestockType').value;
    const heads = Math.max(1, Number(document.getElementById('calcHeadCount').value) || 1);
    const days = Math.max(1, Number(document.getElementById('calcDaysCount').value) || 1);
    const bagWeight = Number(document.getElementById('calcBagWeight').value) || 50;

    const cfg = FEED_RATES_CONFIG[type] || FEED_RATES_CONFIG.broiler;
    const dailyTotalKg = heads * cfg.dailyKg;
    const cycleTotalKg = dailyTotalKg * days;
    const totalTons = cycleTotalKg / 1000;
    const totalBags = Math.ceil(cycleTotalKg / bagWeight);

    const matchedProd = allProductsCache.find(p =>
        (p.name && (p.name.includes('تسمين') && type === 'broiler' || p.name.includes('بياض') && type === 'layer' || p.name.includes('ماشية') && type === 'cattle' || p.name.includes('حلاب') && type === 'dairy' || p.name.includes('أسماك') && type === 'fish'))
    );

    const base50Price = matchedProd ? Number(matchedProd.price) : cfg.defaultBagPrice;
    const unitBagPrice = bagWeight === 25 ? Math.round(base50Price / 2) : base50Price;
    const estimatedTotalCost = totalBags * unitBagPrice;

    lastCalcResult = {
        product: matchedProd || {
            id: `calc_${type}_${bagWeight}`,
            name: `${cfg.labelAr} (${bagWeight} كجم)`,
            nameEn: `${cfg.labelEn} (${bagWeight} kg)`,
            price: unitBagPrice,
            category: 'feed'
        },
        bagsCount: totalBags,
        unitBagPrice
    };

    const resultBox = document.getElementById('feedCalcResultBox');
    const statsGrid = document.getElementById('feedCalcStatsGrid');
    const addBtn = document.getElementById('addCalcToCartBtn');

    if (statsGrid) {
        statsGrid.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap:10px;">
                <div style="background:#f8faf9; padding:12px; border-radius:10px; border:1px solid var(--border-color); text-align:center;">
                    <span style="display:block; font-size:0.8rem; color:#666;">${t('الاستهلاك اليومي', 'Daily Consumption')}</span>
                    <strong style="font-size:1.15rem; color:var(--primary);">${dailyTotalKg.toFixed(1)} ${t('كجم/يوم', 'kg/day')}</strong>
                </div>
                <div style="background:#f8faf9; padding:12px; border-radius:10px; border:1px solid var(--border-color); text-align:center;">
                    <span style="display:block; font-size:0.8rem; color:#666;">${t('إجمالي الكمية للدورة', 'Total Cycle Feed')}</span>
                    <strong style="font-size:1.15rem; color:var(--primary);">${totalTons.toFixed(2)} ${t('طن', 'Tons')}</strong>
                </div>
                <div style="background:#f8faf9; padding:12px; border-radius:10px; border:1px solid var(--border-color); text-align:center;">
                    <span style="display:block; font-size:0.8rem; color:#666;">${t('عدد الشكاير المطلوبة', 'Required Bags')}</span>
                    <strong style="font-size:1.15rem; color:var(--accent);">${totalBags} ${t('شكارة', 'Bags')}</strong>
                </div>
                <div style="background:#f8faf9; padding:12px; border-radius:10px; border:1px solid var(--border-color); text-align:center;">
                    <span style="display:block; font-size:0.8rem; color:#666;">${t('التكلفة التقديرية', 'Estimated Cost')}</span>
                    <strong style="font-size:1.15rem; color:#16a34a;">${estimatedTotalCost.toLocaleString()} ${t('ج.م', 'EGP')}</strong>
                </div>
            </div>`;
    }

    if (resultBox) resultBox.style.display = 'block';
    if (addBtn) {
        addBtn.style.display = 'block';
        addBtn.innerHTML = `<i class="fa-solid fa-cart-plus"></i> ${t(`إضافة (${totalBags}) شكارة للسلة فوراً`, `Add (${totalBags}) Bags to Cart Now`)}`;
    }
});

document.getElementById('addCalcToCartBtn')?.addEventListener('click', () => {
    if (!lastCalcResult) return;
    const countToAdd = Math.min(lastCalcResult.bagsCount, 500);
    for (let i = 0; i < countToAdd; i++) {
        cart.push({ ...lastCalcResult.product });
    }
    localStorage.setItem('omda_cart', JSON.stringify(cart));
    updateCartUI();
    alert(t(`تمت إضافة ${countToAdd} شكارة إلى سلة المشتريات بنجاح!`, `Added ${countToAdd} bags to your cart successfully!`));
    openCartModal();
});

// ==========================================
// === 3. شهادات الجودة والتحاليل المعملية وطلب العينات ===
// ==========================================
const DEFAULT_QUALITY_CERTS = [
    { id: 'def_qc1', title: 'علف بادي تسمين سوبر 23% - مطابق للمواصفات القياسية', titleEn: 'Super Broiler Starter 23% - ISO & Lab Certified', certNo: 'LAB-EG-2026-104', protein: '23.4%', moisture: '11.0%', energy: '3050 kcal', aflatoxin: '< 5 ppb (آمن تماماً)' },
    { id: 'def_qc2', title: 'ذرة صفراء درجة أولى (تصدير ومزارع)', titleEn: 'Grade-A Yellow Corn (Export & Farms)', certNo: 'LAB-EG-2026-219', protein: '8.9%', moisture: '12.5%', energy: '3350 kcal', aflatoxin: '< 4 ppb (خالي من السموم)' }
];

function renderQualitySpecsGrid() {
    const grid = document.getElementById('qualitySpecsGrid');
    if (!grid) return;

    const certs = qualityCertsCache.length > 0 ? qualityCertsCache : DEFAULT_QUALITY_CERTS;
    grid.innerHTML = certs.map(c => {
        const title = escapeHtml(currentLang === 'en' && c.titleEn ? c.titleEn : c.title);
        const rawTitleAttr = escapeHtml(c.title || '');
        return `
            <div class="product-card" style="padding:16px; display:flex; flex-direction:column; gap:10px; border-top:4px solid var(--accent);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="background:#173627; color:#fff; padding:3px 9px; border-radius:6px; font-size:0.75rem; font-weight:bold;">
                        <i class="fa-solid fa-certificate" style="color:var(--accent);"></i> ${escapeHtml(c.certNo)}
                    </span>
                    <span style="color:#16a34a; font-size:0.78rem; font-weight:bold;"><i class="fa-solid fa-circle-check"></i> ${t('معتمد معملياً', 'Lab Certified')}</span>
                </div>
                <h4 style="color:var(--primary); font-size:1rem; margin:0;">${title}</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#f8faf9; padding:10px; border-radius:8px; font-size:0.83rem;">
                    <div><strong>${t('البروتين:', 'Protein:')}</strong> ${escapeHtml(c.protein)}</div>
                    <div><strong>${t('الرطوبة:', 'Moisture:')}</strong> ${escapeHtml(c.moisture)}</div>
                    <div><strong>${t('الطاقة:', 'Energy:')}</strong> ${escapeHtml(c.energy)}</div>
                    <div><strong>${t('السموم:', 'Aflatoxin:')}</strong> ${escapeHtml(c.aflatoxin)}</div>
                    ${c.fiber ? `<div><strong>${t('الألياف الخام:', 'Crude Fiber:')}</strong> ${escapeHtml(c.fiber)}</div>` : ''}
                    ${c.ash ? `<div><strong>${t('الرماد الكلي:', 'Total Ash:')}</strong> ${escapeHtml(c.ash)}</div>` : ''}
                    ${c.fat ? `<div><strong>${t('الدهون الخام:', 'Ether Extract:')}</strong> ${escapeHtml(c.fat)}</div>` : ''}
                </div>
                <button type="button" data-title="${rawTitleAttr}" onclick="prefillSampleProduct(this.dataset.title)" class="btn-submit" style="padding:8px; font-size:0.85rem; margin-top:auto;">
                    <i class="fa-solid fa-vial"></i> ${t('طلب عينة فحص لهذا المنتج', 'Request Inspection Sample')}
                </button>
            </div>`;
    }).join('');
}

window.prefillSampleProduct = function(prodName) {
    const input = document.getElementById('sampleProductInput');
    if (input) {
        input.value = prodName;
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
    }
};

async function loadQualitySpecsSection() {
    const cached = await OmdaLocalDB.get('quality_certs', []);
    if (cached.length > 0) qualityCertsCache = cached;
    renderQualitySpecsGrid();

    try {
        const snap = await getDocs(query(collection(db, "quality_certs"), limit(40)));
        const fresh = [];
        snap.forEach(d => fresh.push({ id: d.id, ...d.data() }));
        if (fresh.length > 0) {
            qualityCertsCache = fresh;
            OmdaLocalDB.set('quality_certs', fresh);
            renderQualitySpecsGrid();
        }
    } catch (e) {
        console.warn("استخدام شهادات الجودة المحلية:", e.message);
    }
}

document.getElementById('sampleRequestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn?.disabled) return;

    const prodName = document.getElementById('sampleProductInput').value.trim();
    const companyName = document.getElementById('sampleCompanyInput').value.trim();
    const weight = document.getElementById('sampleWeightInput').value;
    const phone = document.getElementById('samplePhoneInput').value.trim();
    const address = document.getElementById('sampleAddressInput').value.trim();

    if (companyName.length < 2 || phone.length < 6) {
        alert(t('يرجى إدخال اسم الجهة ورقم الهاتف بشكل صحيح.', 'Please enter valid company/farm name and phone number.'));
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
        await addDoc(collection(db, "rfq_orders"), {
            type: 'sample_request',
            companyName: companyName.slice(0, 200),
            destination: address.slice(0, 200),
            quantity: String(weight).slice(0, 100),
            incoterm: 'SAMPLE',
            phone: phone.slice(0, 30),
            productTitle: `[طلب عينة فحص] ${prodName}`.slice(0, 200),
            userEmail: currentUser ? currentUser.email : 'زائر / مزرعة',
            date: new Date().toLocaleDateString('ar-EG'),
            createdAt: new Date().toISOString(),
            status: 'طلب عينة فحص معملي'
        });

        const waText = `*طلب عينة فحص معملي جديد - منصة الإخلاص*\n\n` +
            `🧪 *المنتج:* ${prodName}\n` +
            `⚖️ *حجم العينة:* ${weight}\n` +
            `🏢 *الجهة / المزرعة:* ${companyName}\n` +
            `📍 *العنوان:* ${address}\n` +
            `📞 *الهاتف:* ${phone}`;

        alert(t('تم تسجيل طلب العينة بنجاح! سيتم التواصل معك لتحديد موعد شحن العينة.', 'Sample request submitted! We will contact you shortly.'));
        form.reset();
        window.open(`https://wa.me/${EXPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`, '_blank');
    } catch (err) {
        alert(t('حدث خطأ أثناء إرسال طلب العينة: ', 'Error submitting sample request: ') + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

async function loadAdminQualityCerts() {
    const list = document.getElementById('adminQualityCertsList');
    if (!list) return;
    list.innerHTML = 'جاري التحميل...';

    try {
        const snap = await getDocs(query(collection(db, "quality_certs"), limit(50)));
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        qualityCertsCache = items;
        OmdaLocalDB.set('quality_certs', items);

        if (items.length === 0) {
            list.innerHTML = '<p style="color:#888;">لا توجد شهادات مضافة يدوياً بعد (تظهر الشهادات الافتراضية للزوار حالياً).</p>';
            return;
        }

        list.innerHTML = items.map(c => {
            const safeId = escapeHtml(c.id);
            const extraSpecs = `${c.fiber ? ` | ألياف: ${escapeHtml(c.fiber)}` : ''}${c.ash ? ` | رماد: ${escapeHtml(c.ash)}` : ''}${c.fat ? ` | دهون: ${escapeHtml(c.fat)}` : ''}`;
            return `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <strong>${escapeHtml(c.title)}</strong> [<code>${escapeHtml(c.certNo)}</code>]<br>
                        <small>بروتين: ${escapeHtml(c.protein)} | رطوبة: ${escapeHtml(c.moisture)} | طاقة: ${escapeHtml(c.energy)} | سموم: ${escapeHtml(c.aflatoxin)}${extraSpecs}</small>
                    </div>
                    <button onclick='deleteQualityCert("${safeId}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i> حذف</button>
                </div>`;
        }).join('');
    } catch (e) {
        list.innerHTML = 'خطأ في تحميل الشهادات.';
    }
}

window.deleteQualityCert = async function(id) {
    if (!confirm('هل تريد حذف شهادة الجودة هذه؟')) return;
    try {
        await deleteDoc(doc(db, "quality_certs", id));
        alert('تم حذف الشهادة بنجاح');
        loadAdminQualityCerts();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

document.getElementById('addQualityCertForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn?.disabled) return;

    if (submitBtn) submitBtn.disabled = true;
    try {
        await addDoc(collection(db, "quality_certs"), {
            title: document.getElementById('qcTitle').value.trim(),
            titleEn: document.getElementById('qcTitleEn').value.trim(),
            certNo: document.getElementById('qcCertNo').value.trim(),
            protein: document.getElementById('qcProtein').value.trim(),
            moisture: document.getElementById('qcMoisture').value.trim(),
            energy: document.getElementById('qcEnergy').value.trim(),
            aflatoxin: document.getElementById('qcAflatoxin').value.trim(),
            fiber: document.getElementById('qcFiber')?.value.trim() || '',
            ash: document.getElementById('qcAsh')?.value.trim() || '',
            fat: document.getElementById('qcFat')?.value.trim() || '',
            createdAt: new Date().toISOString()
        });
        alert('تم نشر شهادة الجودة والتحليل بنجاح!');
        form.reset();
        loadAdminQualityCerts();
    } catch (err) {
        alert('خطأ أثناء حفظ الشهادة: ' + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

// ==========================================
// === 4. بوابة السائق الميداني (GPS والملاحة وإغلاق التسليم) ===
// ==========================================
let driverAssignedVehicles = [];

async function loadDriverPortal() {
    if (!currentUser || !isDriverRole(currentUserRole)) return;
    const emailEl = document.getElementById('driverEmailDisplay');
    const vehEl = document.getElementById('driverVehicleDisplay');
    const ordersList = document.getElementById('driverOrdersList');

    if (emailEl) emailEl.textContent = currentUser.email;
    if (vehEl) vehEl.textContent = t('جاري التحقق...', 'Checking...');
    if (ordersList) ordersList.innerHTML = `<p style="text-align:center; color:#888;">${t('جاري تحميل الشحنات...', 'Loading shipments...')}</p>`;

    try {
        const isStaffUser = isStaffRole(currentUserRole);
        const vehQuery = isStaffUser
            ? collection(db, "vehicles")
            : query(collection(db, "vehicles"), where("driver", "==", currentUser.email));

        const vehSnap = await getDocs(vehQuery);
        driverAssignedVehicles = [];
        vehSnap.forEach(d => {
            driverAssignedVehicles.push({ id: d.id, ...d.data() });
        });

        const myPlates = driverAssignedVehicles.map(v => v.plate);
        if (vehEl) {
            vehEl.textContent = driverAssignedVehicles.length > 0
                ? driverAssignedVehicles.map(v => `${v.plate} (${v.model})`).join(' | ')
                : t('لا توجد سيارة مسندة لحسابك حالياً', 'No vehicle assigned to your account');
        }

        const ordersQuery = isStaffUser
            ? query(collection(db, "orders"), limit(80))
            : query(collection(db, "orders"), where("assignedDriver", "==", currentUser.email), limit(80));

        const ordersSnap = await getDocs(ordersQuery);
        const activeOrders = [];
        ordersSnap.forEach(d => {
            const o = { id: d.id, ...d.data() };
            const isDelivered = (o.status || '').includes('تم التسليم');
            const matchesDriver = o.assignedDriver === currentUser.email || myPlates.includes(o.assignedVehicle);
            if (!isDelivered && (matchesDriver || (isStaffUser && o.assignedVehicle && o.assignedVehicle !== 'غير محدد'))) {
                activeOrders.push(o);
            }
        });

        if (!ordersList) return;
        if (activeOrders.length === 0) {
            ordersList.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">${t('لا توجد شحنات قيد التوصيل حالياً.', 'No active shipments assigned currently.')}</p>`;
            return;
        }

        ordersList.innerHTML = activeOrders.map(o => {
            const safeId = escapeHtml(o.id);
            const hasCoords = typeof o.lat === 'number' && typeof o.lng === 'number';
            const navUrl = hasCoords ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.lat)},${encodeURIComponent(o.lng)}` : '#';
            const itemsSummary = Array.isArray(o.items) ? `${o.items.length} ${t('عنصر', 'items')}` : '';

            return `
                <div class="data-item" style="border-right:4px solid var(--accent);">
                    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                        <div>
                            <h4 style="color:var(--primary); margin-bottom:4px;">${t('شحنة رقم', 'Shipment')} #${safeId.slice(0,6)} — <span style="color:var(--accent);">${escapeHtml(o.assignedVehicle)}</span></h4>
                            <p><strong>${t('العميل:', 'Client:')}</strong> ${escapeHtml(o.userEmail)} | <strong>${t('الهاتف:', 'Phone:')}</strong> <a href="tel:${escapeHtml(o.phone)}" style="color:#0284c7; font-weight:bold;">${escapeHtml(o.phone || '-')}</a></p>
                            <p><strong>${t('الإجمالي المطلوب تحصيله:', 'Total Amount:')}</strong> ${escapeHtml(o.total)} ${t('ج.م', 'EGP')} (${escapeHtml(o.paymentType)}) | ${itemsSummary}</p>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:6px; justify-content:center; min-width:165px;">
                            ${hasCoords ? `<a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="background:#0284c7; color:#fff; padding:8px 12px; border-radius:6px; text-decoration:none; text-align:center; font-weight:bold; font-size:0.85rem;"><i class="fa-solid fa-diamond-turn-right"></i> ${t('بدء الملاحة GPS', 'Navigate GPS')}</a>` : ''}
                            <button onclick="driverConfirmDelivery('${safeId}')" style="background:#16a34a; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">
                                <i class="fa-solid fa-circle-check"></i> ${t('تأكيد التسليم', 'Confirm Delivery')}
                            </button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    } catch (err) {
        if (ordersList) ordersList.innerHTML = `<p style="color:red;">${escapeHtml(err.message)}</p>`;
    }
}

window.driverConfirmDelivery = async function(orderId) {
    if (!confirm(t('هل تؤكد تسليم هذه الشحنة للعميل وإغلاقها؟', 'Confirm delivery of this shipment to customer?'))) return;
    try {
        await updateDoc(doc(db, "orders", orderId), {
            status: 'تم التسليم بنجاح',
            deliveredAt: new Date().toISOString(),
            deliveredBy: currentUser?.email || 'driver'
        });
        alert(t('تم إغلاق الشحنة وتأكيد التسليم بنجاح!', 'Shipment marked as delivered!'));
        loadDriverPortal();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

document.getElementById('driverUpdateGpsBtn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    if (driverAssignedVehicles.length === 0) {
        alert(t('لا توجد سيارة مسندة لحسابك لتحديث موقعها.', 'No vehicle assigned to update location.'));
        return;
    }
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('جاري التحديث...', 'Updating...')}`;
    try {
        const loc = await getCurrentDeviceLocation();
        const myOwnVehicles = driverAssignedVehicles.filter(v => v.driver === currentUser?.email);
        const targets = myOwnVehicles.length > 0 ? myOwnVehicles : [driverAssignedVehicles[0]];
        await Promise.all(targets.map(v =>
            updateDoc(doc(db, "vehicles", v.id), {
                lat: loc.lat,
                lng: loc.lng,
                gpsUpdatedAt: new Date().toISOString()
            })
        ));
        alert(t(`تم تحديث موقع السيارة الحي بنجاح! (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`, `Vehicle live GPS updated! (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`));
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
    }
});

document.getElementById('driverRefreshOrdersBtn')?.addEventListener('click', loadDriverPortal);

// ==========================================
// === 5. المحاسبة وكشف حساب الآجل والمديونيات (تحكم وتعديل كامل) ===
// ==========================================
let creditPaymentsCache = [];
let creditOrdersCache = [];
let currentLedgerLedgerMap = {};
let activeLedgerModalEmail = null;

function ensureAccountingDomElements() {
    if (!document.getElementById('clientLedgerModal')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'clientLedgerModal';
        modalDiv.className = 'modal-overlay';
        modalDiv.style.display = 'none';
        modalDiv.innerHTML = `
            <div class="modal-container" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-file-invoice-dollar"></i> إدارة وتعديل مدفوعات العميل</h3>
                    <span class="close-ledger-modal" style="font-size:1.5rem; cursor:pointer;">&times;</span>
                </div>
                <div class="modal-body" id="clientLedgerModalBody" style="max-height: 75vh; overflow-y: auto; background: #f8faf9;"></div>
            </div>`;
        document.body.appendChild(modalDiv);
        modalDiv.querySelector('.close-ledger-modal')?.addEventListener('click', () => {
            modalDiv.style.display = 'none';
            activeLedgerModalEmail = null;
        });
    }

    const listBox = document.getElementById('adminAccountingList');
    if (listBox && !document.getElementById('adminPaymentsHistoryList')) {
        const wrapper = document.createElement('div');
        wrapper.style.marginTop = '24px';
        wrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                <h3 style="margin: 0;"><i class="fa-solid fa-clock-rotate-left"></i> سجل جميع المدفوعات (تعديل / حذف)</h3>
                <input type="text" id="paymentsSearchInput" placeholder="ابحث ببريد العميل أو رقم الإيصال..." style="padding: 7px 12px; border-radius: 20px; border: 1px solid var(--border-color); min-width: 220px;">
            </div>
            <div id="adminPaymentsHistoryList" class="data-list"></div>`;
        listBox.insertAdjacentElement('afterend', wrapper);
        wrapper.querySelector('#paymentsSearchInput')?.addEventListener('input', renderAdminPaymentsHistory);
    }
}

document.querySelector('.close-ledger-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('clientLedgerModal');
    if (modal) modal.style.display = 'none';
    activeLedgerModalEmail = null;
});

async function loadAdminAccounting() {
    ensureAccountingDomElements();
    const summaryBox = document.getElementById('accountingSummaryCards');
    const listBox = document.getElementById('adminAccountingList');
    if (!summaryBox || !listBox) return;

    listBox.innerHTML = 'جاري تجميع البيانات المحاسبية...';

    try {
        const [ordersSnap, paymentsSnap] = await Promise.all([
            getDocs(query(collection(db, "orders"), limit(200))),
            getDocs(query(collection(db, "credit_payments"), limit(200)))
        ]);

        let totalSales = 0;
        let totalCashSales = 0;
        let totalCreditSales = 0;
        let totalCreditPaid = 0;
        const clientLedger = {};
        creditPaymentsCache = [];
        creditOrdersCache = [];

        ordersSnap.forEach(d => {
            const o = { id: d.id, ...d.data() };
            const amount = Number(o.total || 0);
            totalSales += amount;
            const isCredit = (o.paymentType || '').includes('آجل');

            if (isCredit) {
                creditOrdersCache.push(o);
                totalCreditSales += amount;
                const email = o.userEmail || 'غير معروف';
                if (!clientLedger[email]) {
                    clientLedger[email] = { email, phone: o.phone || '', debit: 0, paid: 0, payments: [], orders: [] };
                }
                clientLedger[email].debit += amount;
                clientLedger[email].orders.push(o);
                if (o.phone && !clientLedger[email].phone) clientLedger[email].phone = o.phone;
            } else {
                totalCashSales += amount;
            }
        });

        paymentsSnap.forEach(d => {
            const p = { id: d.id, ...d.data() };
            creditPaymentsCache.push(p);
            const amt = Number(p.amount || 0);
            totalCreditPaid += amt;
            const email = p.clientEmail || 'غير معروف';
            if (!clientLedger[email]) {
                clientLedger[email] = { email, phone: '', debit: 0, paid: 0, payments: [], orders: [] };
            }
            clientLedger[email].paid += amt;
            clientLedger[email].payments.push(p);
        });

        creditPaymentsCache.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        Object.values(clientLedger).forEach(cl => {
            cl.payments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        });

        currentLedgerLedgerMap = clientLedger;
        const netRemainingCredit = Math.max(0, totalCreditSales - totalCreditPaid);

        summaryBox.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px;">
                <div style="background:#fff; padding:14px; border-radius:10px; border:1px solid var(--border-color); border-right:4px solid var(--primary);">
                    <span style="font-size:0.8rem; color:#666;">إجمالي المبيعات</span>
                    <strong style="display:block; font-size:1.2rem; color:var(--primary);">${totalSales.toLocaleString()} ج.م</strong>
                </div>
                <div style="background:#fff; padding:14px; border-radius:10px; border:1px solid var(--border-color); border-right:4px solid #16a34a;">
                    <span style="font-size:0.8rem; color:#666;">المبيعات النقدية + المحصّل</span>
                    <strong style="display:block; font-size:1.2rem; color:#16a34a;">${(totalCashSales + totalCreditPaid).toLocaleString()} ج.م</strong>
                </div>
                <div style="background:#fff; padding:14px; border-radius:10px; border:1px solid var(--border-color); border-right:4px solid var(--accent);">
                    <span style="font-size:0.8rem; color:#666;">إجمالي فواتير الآجل</span>
                    <strong style="display:block; font-size:1.2rem; color:var(--accent);">${totalCreditSales.toLocaleString()} ج.م</strong>
                </div>
                <div style="background:#fff; padding:14px; border-radius:10px; border:1px solid var(--border-color); border-right:4px solid #dc2626;">
                    <span style="font-size:0.8rem; color:#666;">صافي المديونية المتبقية</span>
                    <strong style="display:block; font-size:1.2rem; color:#dc2626;">${netRemainingCredit.toLocaleString()} ج.م</strong>
                </div>
            </div>`;

        const clients = Object.values(clientLedger).sort((a, b) => (b.debit - b.paid) - (a.debit - a.paid));
        if (clients.length === 0) {
            listBox.innerHTML = '<p style="color:#888;">لا توجد حسابات آجلة مسجلة حالياً.</p>';
        } else {
            listBox.innerHTML = clients.map(c => {
                const rem = Math.max(0, c.debit - c.paid);
                const overpaid = c.paid > c.debit ? (c.paid - c.debit) : 0;
                const safeEmail = escapeHtml(c.email);
                const encodedEmail = encodeURIComponent(c.email);

                return `
                    <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div>
                            <strong><i class="fa-solid fa-user-tie"></i> ${safeEmail}</strong> ${c.phone ? `(${escapeHtml(c.phone)})` : ''}<br>
                            <small>
                                إجمالي الآجل: <strong>${c.debit.toLocaleString()} ج.م</strong> | 
                                المسدد: <strong style="color:#16a34a;">${c.paid.toLocaleString()} ج.م</strong> | 
                                المتبقي: <strong style="color:${rem > 0 ? '#dc2626' : '#16a34a'};">${rem.toLocaleString()} ج.م</strong>
                                ${overpaid > 0 ? `<span style="color:#d97706; font-weight:bold;"> (زيادة مسددة: ${overpaid.toLocaleString()} ج.م)</span>` : ''}
                            </small>
                        </div>
                        <div class="client-debt-actions" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <button type="button" class="btn-debt-pay" onclick="prefillClientPayment(decodeURIComponent('${encodedEmail}'), ${rem})" style="background:#173627; color:#fff; border:none; padding:7px 13px; border-radius:8px; cursor:pointer; font-size:0.84rem; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fa-solid fa-hand-holding-dollar"></i> تسجيل سداد
                            </button>
                            <button type="button" class="btn-debt-edit" onclick="openClientLedgerModal(decodeURIComponent('${encodedEmail}'))" style="background:#d4af37; color:#173627; border:1px solid #b59020; padding:7px 13px; border-radius:8px; cursor:pointer; font-size:0.84rem; font-weight:800; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fa-solid fa-pen-to-square"></i> تعديل (${c.payments.length})
                            </button>
                        </div>
                    </div>`;
            }).join('');
        }

        renderAdminPaymentsHistory();

        if (activeLedgerModalEmail) {
            renderClientLedgerModalContent(activeLedgerModalEmail);
        }
    } catch (e) {
        listBox.innerHTML = 'خطأ في تحميل بيانات المحاسبة: ' + escapeHtml(e.message);
    }
}

function renderAdminPaymentsHistory() {
    const historyBox = document.getElementById('adminPaymentsHistoryList');
    if (!historyBox) return;

    const term = (document.getElementById('paymentsSearchInput')?.value || '').trim().toLowerCase();
    const filtered = term
        ? creditPaymentsCache.filter(p =>
            (p.clientEmail || '').toLowerCase().includes(term) ||
            (p.note || '').toLowerCase().includes(term) ||
            String(p.amount || '').includes(term)
        )
        : creditPaymentsCache;

    if (filtered.length === 0) {
        historyBox.innerHTML = '<p style="color:#888; font-size:0.88rem;">لا توجد دفعات سداد مطابقة.</p>';
        return;
    }

    historyBox.innerHTML = filtered.slice(0, 50).map(p => {
        const safeId = escapeHtml(p.id);
        return `
            <div class="payment-history-card" id="payCard_${safeId}" style="background:#fff; border:1px solid var(--border-color); border-right:4px solid #16a34a; border-radius:10px; padding:12px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <strong style="color:var(--primary);"><i class="fa-solid fa-receipt"></i> ${escapeHtml(p.clientEmail)}</strong>
                        <span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:12px; font-weight:800; font-size:0.84rem; margin-inline-start:6px;">
                            ${Number(p.amount || 0).toLocaleString()} ج.م
                        </span><br>
                        <small style="color:#555;">
                            الملاحظة: <strong>${escapeHtml(p.note || '-')}</strong> | التاريخ: ${escapeHtml(p.date || '')}
                        </small>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="toggleInlinePaymentEdit('${safeId}', 'list')" style="background:#234d39; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.82rem;">
                            <i class="fa-solid fa-pen"></i> تعديل
                        </button>
                        <button type="button" onclick="deletePaymentRecord('${safeId}')" style="background:#dc2626; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.82rem;">
                            <i class="fa-solid fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
                <div id="inlineEditContainer_list_${safeId}"></div>
            </div>`;
    }).join('');
}

document.getElementById('paymentsSearchInput')?.addEventListener('input', renderAdminPaymentsHistory);

window.openClientLedgerModal = function(email) {
    ensureAccountingDomElements();
    const modal = document.getElementById('clientLedgerModal');
    if (!modal) return;
    activeLedgerModalEmail = email;
    renderClientLedgerModalContent(email);
    modal.style.display = 'flex';
};

function renderClientLedgerModalContent(email) {
    const body = document.getElementById('clientLedgerModalBody');
    if (!body) return;

    const ledger = currentLedgerLedgerMap[email] || { email, phone: '', debit: 0, paid: 0, payments: [], orders: [] };
    const rem = Math.max(0, ledger.debit - ledger.paid);
    const safeEmail = escapeHtml(email);
    const encodedEmail = encodeURIComponent(email);

    const paymentsHtml = ledger.payments.length === 0
        ? '<p style="color:#888; font-size:0.85rem; padding:8px 0;">لا توجد دفعات سداد مسجلة لهذا العميل بعد.</p>'
        : ledger.payments.map(p => {
            const safeId = escapeHtml(p.id);
            return `
                <div class="payment-history-card" style="background:#fff; border:1px solid var(--border-color); border-right:4px solid #16a34a; border-radius:10px; padding:12px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div>
                            <strong style="color:#16a34a; font-size:1rem;">${Number(p.amount || 0).toLocaleString()} ج.م</strong>
                            <span style="font-size:0.78rem; color:#666; margin-inline-start:6px;">(${escapeHtml(p.date || '')})</span><br>
                            <small style="color:#444;">${escapeHtml(p.note || 'سداد دفعة نقدية')}</small>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button type="button" onclick="toggleInlinePaymentEdit('${safeId}', 'modal')" style="background:#d4af37; color:#173627; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.82rem;">
                                <i class="fa-solid fa-pen"></i> تعديل الدفعة
                            </button>
                            <button type="button" onclick="deletePaymentRecord('${safeId}')" style="background:#dc2626; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.82rem;">
                                <i class="fa-solid fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                    <div id="inlineEditContainer_modal_${safeId}"></div>
                </div>`;
        }).join('');

    const ordersHtml = ledger.orders.length === 0
        ? '<p style="color:#888; font-size:0.85rem;">لا توجد فواتير آجلة.</p>'
        : ledger.orders.map(o => {
            const safeOid = escapeHtml(o.id);
            return `
                <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <strong>فاتورة #${safeOid.slice(0, 6)}</strong> — <strong style="color:var(--primary);">${Number(o.total || 0).toLocaleString()} ج.م</strong><br>
                        <small style="color:#666;">التاريخ: ${escapeHtml(o.date || '')} | الحالة: ${escapeHtml(o.status || '')}</small>
                    </div>
                    <button type="button" onclick="toggleInlineOrderEdit('${safeOid}')" style="background:#173627; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                        <i class="fa-solid fa-pen"></i> تعديل الفاتورة
                    </button>
                    <div id="inlineOrderEdit_${safeOid}" style="width:100%;"></div>
                </div>`;
        }).join('');

    body.innerHTML = `
        <div style="background:#fff; padding:12px; border-radius:10px; border:1px solid var(--border-color); margin-bottom:12px;">
            <strong style="color:var(--primary); font-size:0.95rem;"><i class="fa-solid fa-user-check"></i> العميل: ${safeEmail}</strong>
            ${ledger.phone ? `<span style="font-size:0.82rem; color:#666; margin-inline-start:8px;">(${escapeHtml(ledger.phone)})</span>` : ''}
        </div>

        <div class="ledger-summary-bar" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px;">
            <div class="ledger-stat-box" style="background:#fff; padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;">
                <span style="display:block; font-size:0.76rem; color:#666;">إجمالي الآجل</span>
                <strong style="font-size:0.98rem; font-weight:900; color:var(--primary);">${ledger.debit.toLocaleString()} ج.م</strong>
            </div>
            <div class="ledger-stat-box" style="background:#fff; padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;">
                <span style="display:block; font-size:0.76rem; color:#666;">إجمالي المسدد</span>
                <strong style="font-size:0.98rem; font-weight:900; color:#16a34a;">${ledger.paid.toLocaleString()} ج.م</strong>
            </div>
            <div class="ledger-stat-box" style="background:#fff; padding:10px; border-radius:10px; border:1px solid var(--border-color); text-align:center;">
                <span style="display:block; font-size:0.76rem; color:#666;">المتبقي</span>
                <strong style="font-size:0.98rem; font-weight:900; color:${rem > 0 ? '#dc2626' : '#16a34a'};">${rem.toLocaleString()} ج.م</strong>
            </div>
        </div>

        <h4 style="color:var(--primary); margin:12px 0 8px 0;"><i class="fa-solid fa-money-bill-wave"></i> الدفعات المسددة (تعديل أو حذف أي دفعة خاطئة)</h4>
        ${paymentsHtml}

        <div style="background:#eef7f2; padding:12px; border-radius:10px; border:1px dashed var(--primary); margin:14px 0;">
            <strong style="color:var(--primary); font-size:0.88rem; display:block; margin-bottom:8px;"><i class="fa-solid fa-plus-circle"></i> إضافة دفعة جديدة سريعة لهذا العميل</strong>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <input type="number" id="quickModalPayAmount" min="0.01" step="0.01" placeholder="المبلغ (ج.م)" style="flex:1; min-width:110px; padding:8px; border-radius:8px; border:1px solid #ccc;">
                <input type="text" id="quickModalPayNote" placeholder="ملاحظة / رقم الإيصال" style="flex:1; min-width:130px; padding:8px; border-radius:8px; border:1px solid #ccc;">
                <button type="button" onclick="submitQuickModalPayment(decodeURIComponent('${encodedEmail}'))" class="btn-submit" style="width:auto; padding:8px 16px;">حفظ الدفعة</button>
            </div>
        </div>

        <h4 style="color:var(--primary); margin:14px 0 8px 0;"><i class="fa-solid fa-file-invoice"></i> الفواتير الآجلة المسجلة على العميل</h4>
        ${ordersHtml}
    `;
}

window.toggleInlinePaymentEdit = function(paymentId, context) {
    const container = document.getElementById(`inlineEditContainer_${context}_${paymentId}`);
    if (!container) return;

    if (container.innerHTML.trim() !== '') {
        container.innerHTML = '';
        return;
    }

    const p = creditPaymentsCache.find(item => item.id === paymentId);
    if (!p) return;

    const safeId = escapeHtml(paymentId);
    container.innerHTML = `
        <div class="inline-payment-editor" style="background:#fffbeb; border:1.5px solid #d4af37; border-radius:10px; padding:12px; margin-top:8px;">
            <label style="font-size:0.8rem; font-weight:bold;">البريد الإلكتروني للعميل:</label>
            <input type="email" id="editPayEmail_${context}_${safeId}" value="${escapeHtml(p.clientEmail || '')}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; margin:4px 0 8px 0;" required>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <div style="flex:1; min-width:120px;">
                    <label style="font-size:0.8rem; font-weight:bold;">المبلغ الصحيح (ج.م):</label>
                    <input type="number" id="editPayAmt_${context}_${safeId}" min="0.01" step="0.01" value="${Number(p.amount || 0)}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; margin:4px 0 8px 0;" required>
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="font-size:0.8rem; font-weight:bold;">التاريخ:</label>
                    <input type="text" id="editPayDate_${context}_${safeId}" value="${escapeHtml(p.date || '')}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; margin:4px 0 8px 0;">
                </div>
            </div>

            <label style="font-size:0.8rem; font-weight:bold;">ملاحظة / رقم الإيصال:</label>
            <input type="text" id="editPayNote_${context}_${safeId}" value="${escapeHtml(p.note || '')}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; margin:4px 0 8px 0;">

            <div style="display:flex; gap:8px; margin-top:4px;">
                <button type="button" onclick="saveEditedPayment('${safeId}', '${context}')" class="btn-submit" style="flex:1; padding:8px;">
                    <i class="fa-solid fa-floppy-disk"></i> حفظ التعديل
                </button>
                <button type="button" onclick="document.getElementById('inlineEditContainer_${context}_${safeId}').innerHTML=''" class="btn-submit" style="width:auto; background:#666; padding:8px 14px;">
                    إلغاء
                </button>
            </div>
        </div>`;
};

window.saveEditedPayment = async function(paymentId, context) {
    const newEmail = document.getElementById(`editPayEmail_${context}_${paymentId}`)?.value.trim();
    const newAmt = Number(document.getElementById(`editPayAmt_${context}_${paymentId}`)?.value);
    const newDate = document.getElementById(`editPayDate_${context}_${paymentId}`)?.value.trim();
    const newNote = document.getElementById(`editPayNote_${context}_${paymentId}`)?.value.trim();

    if (!newEmail || !(newAmt > 0)) {
        alert('يرجى إدخال بريد العميل ومبلغ صحيح أكبر من صفر.');
        return;
    }

    try {
        await updateDoc(doc(db, "credit_payments", paymentId), {
            clientEmail: newEmail,
            amount: newAmt,
            date: newDate || new Date().toLocaleDateString('ar-EG'),
            note: newNote || 'سداد دفعة نقدية (معدّلة)',
            editedBy: currentUser?.email || 'admin',
            editedAt: new Date().toISOString()
        });
        alert('تم تعديل الدفعة وتحديث رصيد العميل بنجاح!');
        await loadAdminAccounting();
    } catch (err) {
        alert('خطأ أثناء تعديل الدفعة: ' + err.message);
    }
};

window.deletePaymentRecord = async function(paymentId) {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة نهائياً؟ سيتم إعادة المبلغ إلى مديونية العميل تلقائياً.')) return;
    try {
        await deleteDoc(doc(db, "credit_payments", paymentId));
        alert('تم حذف الدفعة وإعادة احتساب الرصيد بنجاح!');
        await loadAdminAccounting();
    } catch (err) {
        alert('خطأ أثناء حذف الدفعة: ' + err.message);
    }
};

window.submitQuickModalPayment = async function(email) {
    const amt = Number(document.getElementById('quickModalPayAmount')?.value);
    const note = document.getElementById('quickModalPayNote')?.value.trim();
    if (!(amt > 0)) {
        alert('يرجى إدخال مبلغ صحيح أكبر من صفر.');
        return;
    }
    try {
        await addDoc(collection(db, "credit_payments"), {
            clientEmail: email,
            amount: amt,
            note: note || 'سداد دفعة نقدية',
            recordedBy: currentUser?.email || 'admin',
            date: new Date().toLocaleDateString('ar-EG'),
            createdAt: new Date().toISOString()
        });
        alert(`تم تسجيل دفعة بقيمة ${amt} ج.م بنجاح!`);
        await loadAdminAccounting();
    } catch (err) {
        alert('خطأ أثناء تسجيل الدفعة: ' + err.message);
    }
};

window.toggleInlineOrderEdit = function(orderId) {
    const container = document.getElementById(`inlineOrderEdit_${orderId}`);
    if (!container) return;
    if (container.innerHTML.trim() !== '') {
        container.innerHTML = '';
        return;
    }
    const order = creditOrdersCache.find(o => o.id === orderId);
    if (!order) return;

    const safeId = escapeHtml(orderId);
    container.innerHTML = `
        <div class="inline-payment-editor" style="background:#fffbeb; border:1.5px solid #d4af37; border-radius:10px; padding:12px; margin-top:8px;">
            <label style="font-size:0.8rem; font-weight:bold;">إجمالي الفاتورة (ج.م):</label>
            <input type="number" id="editOrdTotal_${safeId}" min="0" step="0.01" value="${Number(order.total || 0)}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; margin:4px 0 8px 0;">
            <label style="font-size:0.8rem; font-weight:bold;">طريقة الدفع:</label>
            <select id="editOrdPayType_${safeId}" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; margin:4px 0 8px 0;">
                <option value="آجل (حساب ائتماني)" ${(order.paymentType || '').includes('آجل') ? 'selected' : ''}>آجل (حساب ائتماني)</option>
                <option value="مدفوع (نقدي/إلكتروني)" ${!(order.paymentType || '').includes('آجل') ? 'selected' : ''}>مدفوع (نقدي/إلكتروني)</option>
            </select>
            <div style="display:flex; gap:8px;">
                <button type="button" onclick="saveEditedCreditOrder('${safeId}')" class="btn-submit" style="flex:1; padding:7px;">حفظ تعديل الفاتورة</button>
                <button type="button" onclick="document.getElementById('inlineOrderEdit_${safeId}').innerHTML=''" class="btn-submit" style="width:auto; background:#666; padding:7px 12px;">إلغاء</button>
            </div>
        </div>`;
};

window.saveEditedCreditOrder = async function(orderId) {
    const newTotal = Number(document.getElementById(`editOrdTotal_${orderId}`)?.value);
    const newPayType = document.getElementById(`editOrdPayType_${orderId}`)?.value;
    if (!(newTotal >= 0)) {
        alert('يرجى إدخال قيمة صحيحة للفاتورة.');
        return;
    }
    try {
        await updateDoc(doc(db, "orders", orderId), {
            total: newTotal,
            paymentType: newPayType
        });
        alert('تم تحديث بيانات الفاتورة وإعادة حساب المديونية بنجاح!');
        await loadAdminAccounting();
    } catch (err) {
        alert('خطأ أثناء تحديث الفاتورة: ' + err.message);
    }
};

window.prefillClientPayment = function(email, remaining) {
    const emailInput = document.getElementById('payClientEmail');
    const amountInput = document.getElementById('payAmount');
    if (emailInput) emailInput.value = email;
    if (amountInput && remaining > 0) amountInput.value = remaining;
    emailInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    amountInput?.focus();
};

document.getElementById('recordPaymentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submitBtn = document.getElementById('savePaymentBtn') || form.querySelector('button[type="submit"]');
    if (submitBtn?.disabled) return;

    const editPaymentId = document.getElementById('editPaymentId')?.value.trim() || '';
    const clientEmail = document.getElementById('payClientEmail').value.trim();
    const amount = Number(document.getElementById('payAmount').value);
    const note = document.getElementById('payNote').value.trim();

    if (!clientEmail || !(amount > 0)) {
        alert('يرجى إدخال بريد العميل ومبلغ صحيح أكبر من صفر.');
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
        if (editPaymentId) {
            await updateDoc(doc(db, "credit_payments", editPaymentId), {
                clientEmail,
                amount,
                note: note || 'سداد دفعة نقدية (معدّلة)',
                editedBy: currentUser?.email || 'admin',
                editedAt: new Date().toISOString()
            });
            alert('تم حفظ تعديلات الدفعة بنجاح!');
        } else {
            await addDoc(collection(db, "credit_payments"), {
                clientEmail,
                amount,
                note: note || 'سداد دفعة نقدية',
                recordedBy: currentUser?.email || 'admin',
                date: new Date().toLocaleDateString('ar-EG'),
                createdAt: new Date().toISOString()
            });
            alert(`تم تسجيل دفعة سداد بقيمة ${amount} ج.م للعميل ${clientEmail} بنجاح!`);
        }
        form.reset();
        if (document.getElementById('editPaymentId')) document.getElementById('editPaymentId').value = '';
        await loadAdminAccounting();
    } catch (err) {
        alert('خطأ أثناء حفظ الدفعة: ' + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

// ==========================================
// === نظام الشات المباشر المطور (chat_threads) ===
// ==========================================
function updateAdminUnreadBadge(count) {
    const tabBtn = document.getElementById('tabMessagesBtn');
    if (!tabBtn) return;

    let badge = document.getElementById('adminUnreadChatsBadge');
    if (!badge) {
        badge = document.createElement('span');
        badge.id = 'adminUnreadChatsBadge';
        badge.style.cssText = 'display:none; background:#e63946; color:#fff; font-size:0.75rem; font-weight:bold; padding:1px 7px; border-radius:999px; margin-inline-start:6px; vertical-align:middle;';
        tabBtn.appendChild(badge);
    }

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'inline-block';
    } else {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
}

function listenAdminUnreadChatsCount() {
    if (unsubscribeAdminUnreadCount) unsubscribeAdminUnreadCount();

    const qUnread = query(
        collection(db, "chat_threads"),
        where("unreadAdmin", "==", true),
        limit(50)
    );

    unsubscribeAdminUnreadCount = onSnapshot(qUnread, (snapshot) => {
        let unreadCount = 0;
        snapshot.forEach(docSnap => {
            if (docSnap.id !== activeAdminChatEmail) {
                unreadCount++;
            }
        });
        updateAdminUnreadBadge(unreadCount);
    }, (err) => {
        console.warn("تنبيه عداد الرسائل غير المقروءة:", err.message);
    });
}

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
    if (msgText.length > 2000) {
        alert(t('الرسالة طويلة جداً (الحد الأقصى 2000 حرف).', 'Message is too long (max 2000 characters).'));
        return;
    }

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    input.value = '';

    const threadPayload = {
        userEmail: currentUser.email,
        lastMsg: msgText,
        lastSender: 'client',
        lastDateLabel: timeStr,
        updatedAt: nowIso,
        unreadAdmin: true
    };
    if (userSavedPhone) {
        threadPayload.userPhone = userSavedPhone;
    }

    try {
        await Promise.all([
            addDoc(collection(db, "chats"), {
                userEmail: currentUser.email,
                userPhone: userSavedPhone || '',
                sender: 'client',
                message: msgText,
                timestamp: nowIso,
                createdAt: nowIso,
                date: timeStr
            }),
            setDoc(doc(db, "chat_threads", currentUser.email), threadPayload, { merge: true })
        ]);
    } catch (err) {
        alert(t('خطأ أثناء إرسال الرسالة: ', 'Error sending message: ') + err.message);
    }
});

// الاستماع لقائمة المحادثات المختصرة
function listenAdminChats() {
    if (unsubscribeAdminRecentChats) unsubscribeAdminRecentChats();

    const qThreads = query(
        collection(db, "chat_threads"),
        orderBy("updatedAt", "desc"),
        limit(60)
    );

    unsubscribeAdminRecentChats = onSnapshot(qThreads, async (snapshot) => {
        if (snapshot.empty && !localStorage.getItem('omda_chat_threads_migrated_v1')) {
            await migrateLegacyChatsToThreads();
            return;
        }

        recentAdminChatsCache = [];
        snapshot.forEach(docSnap => {
            recentAdminChatsCache.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderAdminConversationsList();
    }, (err) => {
        console.warn("تنبيه تحميل المحادثات:", err.message);
    });
}

async function migrateLegacyChatsToThreads() {
    try {
        localStorage.setItem('omda_chat_threads_migrated_v1', '1');
        const oldSnap = await getDocs(query(collection(db, "chats"), orderBy("createdAt", "desc"), limit(150)));
        if (oldSnap.empty) {
            renderAdminConversationsList();
            return;
        }

        const threadsMap = {};
        oldSnap.forEach(d => {
            const c = d.data();
            if (!c.userEmail) return;
            if (!threadsMap[c.userEmail]) {
                threadsMap[c.userEmail] = {
                    userEmail: c.userEmail,
                    userPhone: c.userPhone || '',
                    lastMsg: c.message || '',
                    lastSender: c.sender || 'client',
                    lastDateLabel: c.date || '',
                    updatedAt: c.createdAt || c.timestamp || new Date().toISOString(),
                    unreadAdmin: c.sender === 'client'
                };
            } else if (c.userPhone && !threadsMap[c.userEmail].userPhone) {
                threadsMap[c.userEmail].userPhone = c.userPhone;
            }
        });

        await Promise.all(
            Object.values(threadsMap).map(th =>
                setDoc(doc(db, "chat_threads", th.userEmail), th, { merge: true })
            )
        );
    } catch (e) {
        console.warn("تعذر ترحيل المحادثات القديمة:", e.message);
    }
}

function renderAdminConversationsList() {
    const listElem = document.getElementById('adminConversationsList');
    if (!listElem) return;

    const searchFilter = (adminChatSearchInput?.value || '').trim().toLowerCase();

    let clients = [...recentAdminChatsCache].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );

    if (searchFilter) {
        clients = clients.filter(cl =>
            (cl.userEmail || '').toLowerCase().includes(searchFilter) ||
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
        const isUnread = Boolean(cl.unreadAdmin) && !isActive;
        const safeEmail = escapeHtml(cl.userEmail);
        const safePhone = escapeHtml(cl.userPhone || '');
        const unreadDot = isUnread
            ? `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-inline-start:6px;" title="رسالة جديدة"></span>`
            : '';

        return `
            <div class="conv-item ${isActive ? 'active' : ''}" style="${isUnread ? 'border-color: var(--accent); background: #fffdf5;' : ''}" data-email="${safeEmail}" data-phone="${safePhone}">
                <div class="conv-item-top">
                    <span class="conv-item-email"><i class="fa-solid fa-user"></i> ${safeEmail}${unreadDot}</span>
                    <span class="conv-item-time">${escapeHtml(cl.lastDateLabel || '')}</span>
                </div>
                <div class="conv-item-preview" style="${isUnread ? 'font-weight:700; color:#173627;' : ''}">${escapeHtml(cl.lastMsg || '')}</div>
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
    activeAdminChatEmail = null;
    const layout = document.getElementById('adminChatLayout');
    if (layout) {
        layout.classList.remove('show-chat');
        layout.classList.add('show-list');
    }
    if (unsubscribeActiveAdminThread) {
        unsubscribeActiveAdminThread();
        unsubscribeActiveAdminThread = null;
    }
    renderAdminConversationsList();
});

window.selectClientForAdminChat = function(email, phone) {
    activeAdminChatEmail = email;
    activeAdminChatPhone = phone || '';

    document.getElementById('adminActiveClientEmail').textContent = email;
    document.getElementById('adminActiveClientEmailInput').value = email;
    document.getElementById('adminActiveClientPhone').textContent = phone ? `هاتف: ${phone}` : 'بدون هاتف';

    const layout = document.getElementById('adminChatLayout');
    if (layout) {
        layout.classList.remove('show-list');
        layout.classList.add('show-chat');
    }

    const threadObj = recentAdminChatsCache.find(c => c.userEmail === email);
    if (threadObj && threadObj.unreadAdmin) {
        threadObj.unreadAdmin = false;
        updateDoc(doc(db, "chat_threads", email), { unreadAdmin: false }).catch(() => {});
    }

    renderAdminConversationsList();

    const chatMessagesBox = document.getElementById('adminChatMessages');
    if (chatMessagesBox) {
        chatMessagesBox.innerHTML = '<p style="text-align: center; color: #888; margin-top: 30px;">جاري تحميل الرسائل...</p>';
    }

    if (unsubscribeActiveAdminThread) unsubscribeActiveAdminThread();

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
    if (msgText.length > 5000) {
        alert('الرد طويل جداً (الحد الأقصى 5000 حرف).');
        return;
    }

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    input.value = '';

    const threadUpdate = {
        userEmail: targetEmail,
        lastMsg: msgText,
        lastSender: 'admin',
        lastDateLabel: timeStr,
        updatedAt: nowIso,
        unreadAdmin: false
    };
    if (activeAdminChatPhone) {
        threadUpdate.userPhone = activeAdminChatPhone;
    }

    try {
        await Promise.all([
            addDoc(collection(db, "chats"), {
                userEmail: targetEmail,
                userPhone: activeAdminChatPhone || '',
                sender: 'admin',
                message: msgText,
                timestamp: nowIso,
                createdAt: nowIso,
                date: timeStr
            }),
            setDoc(doc(db, "chat_threads", targetEmail), threadUpdate, { merge: true })
        ]);
    } catch (err) {
        alert('خطأ أثناء إرسال الرد: ' + err.message);
    }
});

// ==========================================
// === عرض المنتجات ===
// ==========================================
window.renderProducts = function(category, searchTerm) {
    if (!productsGrid) return;

    document.querySelectorAll('.cat-chip').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === category);
    });

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

    const fallbackImg = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=500&q=80';

    filtered.forEach(prod => {
        const prodTitle = escapeHtml(getProdDisplayName(prod));
        const safeId = escapeHtml(prod.id);
        const safeMedia = sanitizeUrl(prod.mediaUrl, fallbackImg);
        let mediaHtml = `<img src="${safeMedia}" alt="${prodTitle}" loading="lazy" decoding="async">`;
        if (prod.mediaType === 'video' && safeMedia !== fallbackImg) {
            mediaHtml = `
                <div style="position:relative; width:100%; height:100%; background:#000;">
                    <video src="${safeMedia}#t=0.1" preload="metadata" muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>
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
    if (!product || !(Number(product.price) > 0)) return;
    cart.push({ ...product });
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
    
    const fallbackImg = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=90';
    const safeMedia = sanitizeUrl(product.mediaUrl, fallbackImg);
    let mediaHtml = `<img src="${safeMedia}" style="width:100%; max-height:300px; border-radius:12px; object-fit:contain; background:#f8faf9; margin-bottom:12px;">`;
    if (product.mediaType === 'video' && safeMedia !== fallbackImg) {
        mediaHtml = `<video src="${safeMedia}" controls autoplay playsinline preload="auto" style="width:100%; max-height:320px; border-radius:12px; object-fit:contain; background:#000; margin-bottom:12px;"></video>`;
    }

    const isExportCategory = product.category === 'export_feed' || product.category === 'export' || product.isExport;

    if (isExportCategory) {
        body.innerHTML = `
            ${mediaHtml}
            <h3 style="color:var(--primary); font-size:1.1rem; margin-bottom:6px;">${safeTitle}</h3>
            <p style="font-size:0.95rem; font-weight:bold; color:#173627; margin-bottom:14px;"><i class="fa-solid fa-ship"></i> ${t('مخصص للتصدير والكميات الكبيرة (B2B)', 'Dedicated for Export & Bulk Quantities (B2B)')}</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button id="modalRfqBtn" class="btn-submit" style="background:#173627; padding:12px; font-size:0.95rem; flex:1;">
                    <i class="fa-solid fa-file-signature"></i> ${t('طلب عرض سعر جملة (RFQ)', 'Request Bulk Quotation (RFQ)')}
                </button>
                <button id="modalSampleBtn" class="btn-submit" style="background:var(--accent); color:var(--primary-dark); padding:12px; font-size:0.95rem; flex:1;">
                    <i class="fa-solid fa-vial"></i> ${t('طلب عينة فحص', 'Request Sample')}
                </button>
            </div>
        `;

        document.getElementById('modalRfqBtn').onclick = () => {
            const v = document.getElementById('productDetailModal')?.querySelector('video');
            if (v) v.pause();
            document.getElementById('productDetailModal').style.display = 'none';
            openExportRfqModal(product);
        };

        document.getElementById('modalSampleBtn').onclick = () => {
            const v = document.getElementById('productDetailModal')?.querySelector('video');
            if (v) v.pause();
            document.getElementById('productDetailModal').style.display = 'none';
            switchSection('qualitySpecsSection');
            setTimeout(() => prefillSampleProduct(prodTitle), 150);
        };
    } else {
        body.innerHTML = `
            ${mediaHtml}
            <h3 style="color:var(--primary); font-size:1.1rem; margin-bottom:6px;">${safeTitle}</h3>
            <p style="font-size:1.2rem; font-weight:bold; color:var(--accent); margin-bottom:14px;">${t('السعر: ' + escapeHtml(product.price) + ' ج.م', 'Price: ' + escapeHtml(product.price) + ' EGP')}</p>
            <div class="input-group" style="margin-bottom:15px;">
                <label>${t('حدد الكمية المطلوبة للحجز:', 'Specify required quantity:')}</label>
                <input type="number" id="modalQtyInput" value="1" min="1" max="500" style="padding:10px; border-radius:8px; border:1px solid #ccc; width:100%;">
            </div>
            <button id="modalAddToCartBtn" class="btn-submit" style="background:var(--primary); padding:12px; font-size:0.95rem;">
                <i class="fa-solid fa-cart-plus"></i> ${t('إضافة للسلة وحجز الكمية', 'Add to Cart & Reserve')}
            </button>
        `;

        document.getElementById('modalAddToCartBtn').onclick = () => {
            const v = document.getElementById('productDetailModal')?.querySelector('video');
            if (v) v.pause();
            const qty = Math.min(Math.max(1, parseInt(document.getElementById('modalQtyInput').value) || 1), 500);
            for (let i = 0; i < qty; i++) { cart.push({ ...product }); }
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
    const fallbackImg = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=150&q=80';

    Object.values(groupedCart).forEach(item => {
        const itemTotal = Number(item.price) * item.qty;
        totalSum += itemTotal;
        const itemTitle = escapeHtml(getProdDisplayName(item));
        const safeKey = escapeHtml(item.id || item.name);

        const imgUrl = (item.mediaType !== 'video' && item.mediaUrl) ? sanitizeUrl(item.mediaUrl, fallbackImg) : fallbackImg;

        list.innerHTML += `
            <div class="cart-item-card">
                <img src="${imgUrl}" class="cart-item-img" alt="${itemTitle}">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${itemTitle}</h4>
                    <span class="cart-item-price">${escapeHtml(item.price)} ${t('ج.م', 'EGP')}</span>
                </div>
                <div class="cart-qty-controls">
                    <button class="btn-qty" data-key="${safeKey}" onclick="changeItemQty(this.dataset.key, -1)">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="btn-qty" data-key="${safeKey}" onclick="changeItemQty(this.dataset.key, 1)">+</button>
                </div>
                <button class="btn-remove-item" data-key="${safeKey}" onclick="removeGroupFromCart(this.dataset.key)" title="${t('حذف', 'Remove')}">
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
        if (cart.length >= 500) return;
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
    if (checkoutBtn.disabled) return;
    if (!currentUser) {
        alert(t('الرجاء تسجيل الدخول أولاً لإتمام الطلب', 'Please sign in first to complete your order'));
        if (authModal) authModal.style.display = 'flex';
        return;
    }
    if (cart.length === 0) {
        alert(t('السلة فارغة!', 'Your cart is empty!'));
        return;
    }
    if (cart.length > 500) {
        alert(t('الحد الأقصى للطلب الواحد هو 500 وحدة.', 'Maximum items per order is 500.'));
        return;
    }

    const phoneInput = document.getElementById('checkoutPhoneInput');
    const phoneVal = phoneInput ? phoneInput.value.trim() : '';

    if (!phoneVal || phoneVal.length < 6) {
        alert(t('الرجاء إدخال رقم هاتف صحيح للتواصل والشحن قبل إتمام الطلب.', 'Please enter a valid contact & shipping phone number before checkout.'));
        if (phoneInput) phoneInput.focus();
        return;
    }

    const paymentType = document.getElementById('paymentTypeSelect').value;
    checkoutBtn.disabled = true;

    try {
        userSavedPhone = phoneVal;
        const userRef = doc(db, "users", currentUser.email);
        await setDoc(userRef, { phone: phoneVal }, { merge: true });

        const sanitizedItems = cart.map(item => {
            const serverProd = item.id ? allProductsCache.find(p => p.id === item.id) : null;
            const verifiedPrice = serverProd ? Number(serverProd.price) : Number(item.price || 0);
            const verifiedName = serverProd ? (serverProd.name || item.name || '') : (item.name || '');
            return {
                id: item.id || '',
                name: verifiedName,
                price: verifiedPrice
            };
        }).filter(i => i.price > 0);

        const grandTotal = sanitizedItems.reduce((sum, item) => sum + item.price, 0);
        if (sanitizedItems.length === 0 || !(grandTotal > 0)) {
            throw new Error(t('تعذر التحقق من أصناف السلة، يرجى إعادة المحاولة.', 'Unable to verify cart items.'));
        }

        const orderRef = await addDoc(collection(db, "orders"), {
            userEmail: currentUser.email,
            phone: phoneVal,
            items: sanitizedItems,
            total: grandTotal,
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
    } finally {
        checkoutBtn.disabled = false;
    }
});

addProductForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn?.disabled) return;

    const editId = document.getElementById('editProductId').value;
    const fileInput = document.getElementById('prodFile');
    const prodNameEnInput = document.getElementById('prodNameEn');
    const priceNum = Number(document.getElementById('prodPrice').value);

    if (!(priceNum >= 0)) {
        alert('يرجى إدخال سعر صحيح للمنتج.');
        return;
    }
    
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
            name: document.getElementById('prodName').value.trim(),
            nameEn: prodNameEnInput ? prodNameEnInput.value.trim() : '',
            price: priceNum,
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
    const saveCatBtn = document.getElementById('saveCatBtn');
    if (saveCatBtn?.disabled) return;

    const editCatId = document.getElementById('editCatId')?.value.trim() || '';
    const catId = editCatId || document.getElementById('catIdInput').value.trim();
    const catName = document.getElementById('catNameInput').value.trim();
    const catNameEn = document.getElementById('catNameEnInput')?.value.trim() || '';
    const catIcon = document.getElementById('catIconInput').value.trim();

    if (!catId || !catName) return;

    if (saveCatBtn) saveCatBtn.disabled = true;
    try {
        await setDoc(doc(db, "categories", catId), { name: catName, nameEn: catNameEn, icon: catIcon }, { merge: true });
        alert(editCatId ? 'تم تحديث القسم بنجاح!' : 'تم حفظ القسم بنجاح!');
        addCategoryForm.reset();
        if (document.getElementById('editCatId')) document.getElementById('editCatId').value = '';
        if (document.getElementById('catIdInput')) document.getElementById('catIdInput').disabled = false;
        if (document.getElementById('categoryFormTitle')) document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
        if (saveCatBtn) saveCatBtn.textContent = 'حفظ القسم الجديد';
        if (cancelCatEditBtn) cancelCatEditBtn.style.display = 'none';
        loadCategoriesForAdmin();
    } catch (err) {
        alert('خطأ: ' + err.message);
    } finally {
        if (saveCatBtn) saveCatBtn.disabled = false;
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
    const saveVehBtn = document.getElementById('saveVehicleBtn');
    if (saveVehBtn?.disabled) return;

    const editVehicleId = document.getElementById('editVehicleId').value;
    const plate = document.getElementById('vehPlate').value.trim();
    const model = document.getElementById('vehModel').value.trim();
    const driver = document.getElementById('vehDriverSelect').value;

    if (saveVehBtn) saveVehBtn.disabled = true;
    try {
        const vehicleData = { plate, model, driver, lat: newVehLat, lng: newVehLng };

        if (editVehicleId) {
            await updateDoc(doc(db, "vehicles", editVehicleId), vehicleData);
            alert('تم تحديث بيانات سيارة الأسطول بنجاح!');
            document.getElementById('editVehicleId').value = '';
            document.getElementById('vehicleFormTitle').textContent = 'إضافة سيارة جديدة للأسطول ("سيارتي") وتعيين السائق الموظف';
            if (saveVehBtn) saveVehBtn.textContent = 'تسجيل السيارة في الأسطول';
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
    } finally {
        if (saveVehBtn) saveVehBtn.disabled = false;
    }
});

if(cancelVehicleEditBtn) {
    cancelVehicleEditBtn.addEventListener('click', () => {
        addVehicleForm.reset();
        document.getElementById('editVehicleId').value = '';
        newVehLat = 30.0444;
        newVehLng = 31.2357;
        const display = document.getElementById('vehCoordsDisplay');
        if (display) {
            display.textContent = 'الإحداثيات الحالية: لم يتم التحديد (افتراضي القاهرة)';
            display.style.color = "#666";
        }
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
        vehiclesCache = [];
        list.innerHTML = '';
        snapshot.forEach(docSnap => {
            const v = { id: docSnap.id, ...docSnap.data() };
            vehiclesCache.push(v);
            const id = escapeHtml(docSnap.id);
            list.innerHTML += `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>سيارة: <strong>${escapeHtml(v.plate)}</strong> (${escapeHtml(v.model)}) | السائق المسؤول: <span style="color:var(--primary); font-weight:bold;">${escapeHtml(v.driver)}</span></div>
                    <div>
                        <button onclick="editVehicleById('${id}')" style="background:#234d39; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick="deleteVehicle('${id}')" style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في تحميل السيارات.';
    }
}

window.editVehicleById = function(id) {
    const v = vehiclesCache.find(item => item.id === id);
    if (!v) return;
    editVehicle(
        v.id,
        v.plate || '',
        v.model || '',
        v.driver || '',
        typeof v.lat === 'number' ? v.lat : 30.0444,
        typeof v.lng === 'number' ? v.lng : 31.2357
    );
};

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
    if (tabName === 'users' && !isAdminRole(currentUserRole)) {
        alert('عذراً، إدارة الرتب والصلاحيات مخصصة للمدير العام (Admin) فقط.');
        return;
    }

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
    } else if (tabName === 'accounting') {
        const accTab = document.getElementById('adminAccountingTab');
        if (accTab) accTab.style.display = 'block';
        document.getElementById('tabAccountingBtn')?.classList.add('active');
        loadAdminAccounting();
    } else if (tabName === 'market_prices') {
        const mpTab = document.getElementById('adminMarketPricesTab');
        if (mpTab) mpTab.style.display = 'block';
        document.getElementById('tabMarketPricesBtn')?.classList.add('active');
        loadAdminMarketPrices();
    } else if (tabName === 'quality_certs') {
        const qcTab = document.getElementById('adminQualityTab');
        if (qcTab) qcTab.style.display = 'block';
        document.getElementById('tabQualityBtn')?.classList.add('active');
        loadAdminQualityCerts();
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
            list.innerHTML = '<p style="color:#888;">لا توجد طلبات تصدير أو عينات حالياً.</p>';
            return;
        }
        snapshot.forEach(docSnap => {
            const r = docSnap.data();
            const id = escapeHtml(docSnap.id);
            const isSample = r.type === 'sample_request' || r.incoterm === 'SAMPLE';
            const badgeHtml = isSample
                ? `<span style="background:var(--accent); color:var(--primary-dark); padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; margin-inline-end:6px;">عينة فحص</span>`
                : `<span style="background:#173627; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; margin-inline-end:6px;">تصدير B2B</span>`;
            const waMsg = encodeURIComponent(`أهلاً بك ${r.companyName}، بخصوص طلبك لـ ${r.productTitle} (${r.quantity})...`);
            list.innerHTML += `
                <div class="data-item" style="border-right-color:#173627;">
                    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div>
                            <h4 style="color:#173627; margin-bottom:4px;">${badgeHtml}<i class="fa-solid fa-building"></i> ${escapeHtml(r.companyName)}</h4>
                            <p><strong>المنتج:</strong> ${escapeHtml(r.productTitle)} | <strong>الكمية:</strong> ${escapeHtml(r.quantity)} ${isSample ? '' : `طن (${escapeHtml(r.incoterm)})`}</p>
                            <p><strong>الوجهة:</strong> ${escapeHtml(r.destination)} | <strong>الهاتف:</strong> ${escapeHtml(r.phone)}</p>
                            <p style="font-size:0.8rem; color:#777;">البريد: ${escapeHtml(r.userEmail)} | التاريخ: ${escapeHtml(r.date || '')}</p>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:5px; justify-content:center;">
                            <a href="https://wa.me/${(r.phone || '').replace(/[^0-9]/g, '')}?text=${waMsg}" target="_blank" rel="noopener noreferrer" style="background:#25D366; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; text-align:center; font-weight:bold; font-size:0.85rem;"><i class="fa-brands fa-whatsapp"></i> تواصل واتساب</a>
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
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        await deleteDoc(doc(db, "rfq_orders", id));
        alert('تم حذف الطلب بنجاح');
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

    vehiclesCache = [];
    let vehicleOptions = '<option value="">اختر السيارة للأسطول</option>';
    vehiclesSnap.forEach(v => {
        const vData = { id: v.id, ...v.data() };
        vehiclesCache.push(vData);
        vehicleOptions += `<option value="${escapeHtml(vData.plate)}">${escapeHtml(vData.plate)} (سائق: ${escapeHtml(vData.driver)})</option>`;
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
    const matchedVeh = vehiclesCache.find(v => v.plate === veh);
    const driverEmail = matchedVeh?.driver || 'غير محدد';

    try {
        await updateDoc(doc(db, "orders", orderId), {
            assignedVehicle: veh,
            assignedDriver: driverEmail,
            status: `جاري التوصيل عبر سيارة الأسطول (${veh})`
        });
        alert('تم تعيين السيارة والسائق للشحنة بنجاح!');
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
    if (!isAdminRole(currentUserRole)) {
        list.innerHTML = '<p style="color:#dc2626; font-weight:bold;">عذراً، عرض وتعديل الرتب والصلاحيات متاح للمدير العام (Admin) فقط.</p>';
        return;
    }
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
    if (!isAdminRole(currentUserRole)) {
        alert('عذراً، تعديل الرتب والصلاحيات مخصص للمدير العام (Admin) فقط.');
        return;
    }
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
    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn?.disabled) return;

    const title = document.getElementById('notifTitle').value.trim();
    const body = document.getElementById('notifBody').value.trim();

    if (submitBtn) submitBtn.disabled = true;
    try {
        await addDoc(collection(db, "notifications"), { title, body, date: new Date().toLocaleString('ar-EG'), read: false });
        alert('تم إرسال الإشعار بنجاح!');
        form.reset();
    } catch (err) {
        alert('خطأ: ' + err.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

function getReadNotifIds() {
    if (!currentUser) return [];
    try {
        const raw = JSON.parse(localStorage.getItem(`omda_read_notifs_${currentUser.email}`) || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch (_) {
        return [];
    }
}

async function checkUnreadNotifications() {
    if (!currentUser) return;
    try {
        const snapshot = await getDocs(query(collection(db, "notifications"), where("read", "==", false), limit(25)));
        const readIds = getReadNotifIds();
        let unreadCount = 0;

        snapshot.forEach(docSnap => {
            if (!readIds.includes(docSnap.id)) {
                unreadCount++;
            }
        });

        const notifCountElem = document.getElementById('notifCount');
        const drawerNotifElem = document.getElementById('drawerNotifCount');
        if (notifCountElem) notifCountElem.textContent = unreadCount;
        if (drawerNotifElem) drawerNotifElem.textContent = unreadCount;
    } catch (e) { console.error(e); }
}

window.loadNotifications = async function() {
    const list = document.getElementById('notificationsListContent');
    if (!list) return;
    if (!currentUser) {
        list.innerHTML = `<p style="text-align:center; color:#888;">${t('يرجى تسجيل الدخول لعرض الإشعارات.', 'Please sign in to view notifications.')}</p>`;
        return;
    }
    const snapshot = await getDocs(query(collection(db, "notifications"), limit(30)));
    if (snapshot.empty) {
        list.innerHTML = `<p style="text-align:center; color:#888;" data-i18n="no_notifs">${t('لا توجد إشعارات حالياً.', 'No notifications currently.')}</p>`;
        return;
    }

    const readIds = new Set(getReadNotifIds());
    list.innerHTML = '';

    snapshot.forEach(docSnap => {
        readIds.add(docSnap.id);
        const n = docSnap.data();
        list.innerHTML += `<div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:8px; border-right:4px solid var(--accent);"><h4>${escapeHtml(n.title)}</h4><p>${escapeHtml(n.body)}</p></div>`;
    });

    localStorage.setItem(`omda_read_notifs_${currentUser.email}`, JSON.stringify([...readIds].slice(-100)));
    const notifCountElem = document.getElementById('notifCount');
    const drawerNotifElem = document.getElementById('drawerNotifCount');
    if (notifCountElem) notifCountElem.textContent = '0';
    if (drawerNotifElem) drawerNotifElem.textContent = '0';
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
    let userCreditDebit = 0;

    const qOrders = query(collection(db, "orders"), where("userEmail", "==", currentUser.email), limit(40));
    const ordersSnap = await getDocs(qOrders);
    
    ordersSnap.forEach((docSnap) => {
        const orderId = docSnap.id;
        const safeId = escapeHtml(orderId);
        const order = docSnap.data();
        ordersCache[orderId] = order;

        if ((order.paymentType || '').includes('آجل')) {
            userCreditDebit += Number(order.total || 0);
        }

        invoicesHtml += `
            <div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid var(--primary);">
                ${t('رقم الفاتورة:', 'Invoice #:')} <strong>#${safeId.slice(0,6)}</strong> | ${t('الإجمالي:', 'Total:')} <strong>${escapeHtml(order.total)} ${t('ج.م', 'EGP')}</strong><br>
                ${t('الحالة:', 'Status:')} <span style="color:green">${escapeHtml(order.status)}</span> | ${t('سيارة التوصيل:', 'Delivery Vehicle:')} <strong>${escapeHtml(order.assignedVehicle || t('قريباً', 'Soon'))}</strong><br>
                <button onclick="previewInvoice('${safeId}')" style="background:var(--primary); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-top:5px;"><i class="fa-solid fa-eye"></i> ${t('معاينة الفاتورة', 'Preview Invoice')}</button>
            </div>`;
    });

    try {
        const qPay = query(collection(db, "credit_payments"), where("clientEmail", "==", currentUser.email), limit(40));
        const paySnap = await getDocs(qPay);
        let userCreditPaid = 0;
        paySnap.forEach(p => { userCreditPaid += Number(p.data().amount || 0); });

        const creditBox = document.getElementById('userCreditSummaryBox');
        if (creditBox) {
            if (userCreditDebit > 0 || userCreditPaid > 0) {
                creditBox.style.display = 'block';
                const rem = Math.max(0, userCreditDebit - userCreditPaid);
                const cur = t('ج.م', 'EGP');
                document.getElementById('userTotalCreditVal').textContent = `${userCreditDebit.toLocaleString()} ${cur}`;
                document.getElementById('userTotalPaidVal').textContent = `${userCreditPaid.toLocaleString()} ${cur}`;
                document.getElementById('userRemainingCreditVal').textContent = `${rem.toLocaleString()} ${cur}`;
            } else {
                creditBox.style.display = 'none';
            }
        }
    } catch (e) { console.warn(e); }

    const qRfq = query(collection(db, "rfq_orders"), where("userEmail", "==", currentUser.email), limit(30));
    const rfqSnap = await getDocs(qRfq);

    rfqSnap.forEach((docSnap) => {
        const rfq = docSnap.data();
        const isSample = rfq.type === 'sample_request' || rfq.incoterm === 'SAMPLE';
        invoicesHtml += `
            <div style="background:#f0f7f4; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid #173627;">
                <span style="background:#173627; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem;"><i class="fa-solid ${isSample ? 'fa-vial' : 'fa-ship'}"></i> ${isSample ? t('طلب عينة فحص', 'Sample Request') : t('طلب تصدير B2B', 'Export B2B Request')}</span>
                <p style="margin-top:5px; margin-bottom:3px;">${t('المنتج:', 'Product:')} <strong>${escapeHtml(rfq.productTitle)}</strong> | ${t('الكمية:', 'Qty:')} <strong>${escapeHtml(rfq.quantity)} ${isSample ? '' : `${t('طن', 'Tons')} (${escapeHtml(rfq.incoterm)})`}</strong></p>
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
        const cachedMatchKey = Object.keys(ordersCache).find(k => k.toLowerCase().startsWith(cleanId.toLowerCase()));
        if (cachedMatchKey) {
            resultBox.innerHTML = renderTrackResultCard({ id: cachedMatchKey, ...ordersCache[cachedMatchKey] });
            return;
        }

        if (cleanId.length >= 20) {
            try {
                const docSnap = await getDoc(doc(db, "orders", cleanId));
                if (docSnap.exists()) {
                    const found = { id: docSnap.id, ...docSnap.data() };
                    ordersCache[found.id] = found;
                    resultBox.innerHTML = renderTrackResultCard(found);
                    return;
                }
            } catch (_) {
            }
        }

        let qSearch;
        if (isStaffRole(currentUserRole)) {
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
            if (typeof v.lat === 'number' && typeof v.lng === 'number') {
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
