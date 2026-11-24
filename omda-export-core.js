import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// 1. التهيئة والاتصال بقاعدة البيانات والجلسة
// ==========================================
const FALLBACK_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCU--Klxwfg7pDinUgS0UEde9cpmmsrDRM",
    authDomain: "omda-a750f.firebaseapp.com",
    projectId: "omda-a750f",
    storageBucket: "omda-a750f.firebasestorage.app",
    messagingSenderId: "1078714497381",
    appId: "1:1078714497381:android:9430672b84226b0a46898c"
};

const firebaseApp = getApps().length ? getApp() : initializeApp(FALLBACK_FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let exportCurrentUser = null;
let exportSpecsCache = [];
let exportSpecsFromDb = false;
let exportDocsCache = [];
let exportDocsFromDb = false;
let exportRfqsCache = [];
let lastContainerCalc = null;

const DEFAULT_EXPORT_SETTINGS = {
    enabled: true,
    heroTitleAr: 'بوابة التصدير الدولي والصفقات الكبرى (B2B)',
    heroTitleEn: 'International Export & Bulk Trade Portal (B2B)',
    heroDescAr: 'تصدير أجود الأعلاف المصنعة، الدريس الحجازي، الذرة الصفراء، وكسب الصويا من الموانئ المصرية إلى الأسواق العربية والأفريقية والأوروبية بأعلى معايير الجودة.',
    heroDescEn: 'Exporting premium manufactured feeds, alfalfa hay, yellow corn, and soybean meal from Egyptian ports to Arab, African & European markets.',
    portsBannerAr: 'الإسكندرية • دمياط • العين السخنة',
    portsBannerEn: 'Alexandria • Damietta • Sokhna',
    waPhone: '201114099799',
    directPhone: '+201114099799',
    defaultUsdRate: 50.5,
    cap20ft: 24,
    cap40hc: 27
};

let exportSettingsCache = { ...DEFAULT_EXPORT_SETTINGS };

function getLang() {
    return localStorage.getItem('omda_lang') === 'en' ? 'en' : 'ar';
}

function tx(ar, en) {
    return getLang() === 'en' ? en : ar;
}

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
// 2. البيانات الافتراضية للمواصفات والمستندات ومراحل الشحن
// ==========================================
const DEFAULT_EXPORT_SPECS = [
    {
        id: 'exp_spec_1',
        nameAr: 'علف دواجن تسمين وتسمين ماشية مركز (تصدير)',
        nameEn: 'Concentrated Poultry & Cattle Fattening Feed (Export Grade)',
        hsCode: '2309.90',
        protein: '21% - 23.5%',
        moisture: 'Max 11.5%',
        packagingAr: 'شكاير بولي بروبلين 50 كجم أو جامبو باج 1000 كجم',
        packagingEn: '50kg PP Woven Bags or 1000kg Jumbo Big Bags',
        portsAr: 'ميناء الإسكندرية / دمياط / العين السخنة',
        portsEn: 'Alexandria / Damietta / Ain Sokhna Ports',
        minOrderTons: 24,
        baseFobUsd: 445
    },
    {
        id: 'exp_spec_2',
        nameAr: 'دريس حجازي وبرسيم مصري مكبوس بالات عالية الكثافة',
        nameEn: 'Double-Compressed Egyptian Alfalfa & Berseem Clover Hay',
        hsCode: '1214.90',
        protein: '16% - 19%',
        moisture: 'Max 12%',
        packagingAr: 'بالات مضغوطة 400-450 كجم مربطة سلك مجلفن (حاوية 40 HC)',
        packagingEn: '400-450kg Galvanized Wire Compressed Bales (40ft HC)',
        portsAr: 'ميناء الإسكندرية / دمياط / سفاجا',
        portsEn: 'Alexandria / Damietta / Safaga Ports',
        minOrderTons: 26,
        baseFobUsd: 295
    },
    {
        id: 'exp_spec_3',
        nameAr: 'نخالة قمح خشنة (ردة) وذرة صفراء مفروزة',
        nameEn: 'Coarse Wheat Bran & Graded Yellow Corn',
        hsCode: '2302.30',
        protein: '14.5% - 16%',
        moisture: 'Max 12.5%',
        packagingAr: 'شكاير 40 / 50 كجم أو شحن صب (Bulk)',
        packagingEn: '40 / 50kg PP Bags or Bulk Shipment',
        portsAr: 'ميناء دمياط / الإسكندرية',
        portsEn: 'Damietta / Alexandria Ports',
        minOrderTons: 25,
        baseFobUsd: 265
    },
    {
        id: 'exp_spec_4',
        nameAr: 'كسب فول صويا 46% بروتين عالي الطاقة',
        nameEn: 'High-Energy Soybean Meal 46% Protein',
        hsCode: '2304.00',
        protein: 'Min 46%',
        moisture: 'Max 11.5%',
        packagingAr: 'شكاير 50 كجم معالجة ضد الرطوبة أو جامبو باج',
        packagingEn: '50kg Moisture-Barrier Bags or Jumbo Bags',
        portsAr: 'ميناء الإسكندرية / العين السخنة',
        portsEn: 'Alexandria / Ain Sokhna Ports',
        minOrderTons: 25,
        baseFobUsd: 490
    }
];

const EXPORT_SHIPMENT_STAGES = [
    { step: 1, key: 'rfq_approved', ar: 'اعتماد طلب التسعير والفاتورة المبدئية', en: 'RFQ & Proforma Invoice Approved', icon: 'fa-file-signature' },
    { step: 2, key: 'production', ar: 'التصنيع والتعبئة بالمواصفات القياسية', en: 'Production & Export Bagging', icon: 'fa-industry' },
    { step: 3, key: 'lab_clearance', ar: 'الفحص المعملي والحجر الزراعي', en: 'Lab COA & Phytosanitary Clearance', icon: 'fa-microscope' },
    { step: 4, key: 'customs', ar: 'التخليص الجمركي بميناء الشحن', en: 'Port Customs Clearance', icon: 'fa-stamp' },
    { step: 5, key: 'on_sea', ar: 'تم التحميل على الباخرة (في البحر)', en: 'Loaded on Vessel (In Transit)', icon: 'fa-ship' },
    { step: 6, key: 'arrived', ar: 'وصلت ميناء الوصول المستهدف', en: 'Arrived at Destination Port', icon: 'fa-anchor' }
];

const DEFAULT_EXPORT_DOCS = [
    {
        id: 'exp_doc_1',
        code: 'CO / GAFTA / EUR.1',
        titleAr: 'شهادة المنشأ المعتمدة (إعفاء جمركي للدول العربية والأوروبية)',
        titleEn: 'Certified Certificate of Origin (GAFTA / Arab League / EUR.1)',
        descAr: 'تُصدر من الهيئة العامة للرقابة على الصادرات والواردات لتمنح المستورد إعفاءً جمركياً كاملاً.',
        descEn: 'Issued by GOEIC granting full customs duty exemption in GAFTA & partner countries.',
        icon: 'fa-earth-africa'
    },
    {
        id: 'exp_doc_2',
        code: 'PHYTO / VET',
        titleAr: 'شهادة الحجر الزراعي والشهادة الصحية البيطرية',
        titleEn: 'Phytosanitary & Official Veterinary Health Certificate',
        descAr: 'تثبت خلو الشحنة من الآفات الزراعية والأمراض ومطابقتها لاشتراطات الاستيراد.',
        descEn: 'Certifies pest-free status and compliance with destination import regulations.',
        icon: 'fa-seedling'
    },
    {
        id: 'exp_doc_3',
        code: 'COA / AFLATOXIN',
        titleAr: 'شهادة التحليل المعملي وخلو السموم الفطرية',
        titleEn: 'Certificate of Analysis (COA) & Aflatoxin-Free Report',
        descAr: 'تحليل دقيق لنسب البروتين والرطوبة والطاقة وخلو الشحنة من الأفلاتوكسين (< 5 ppb).',
        descEn: 'Detailed lab analysis for protein, moisture, energy & Aflatoxin (< 5 ppb).',
        icon: 'fa-flask-vial'
    },
    {
        id: 'exp_doc_4',
        code: 'CI / PL / B/L',
        titleAr: 'الفاتورة التجارية + قائمة التعبئة + بوليصة الشحن البحري',
        titleEn: 'Commercial Invoice + Packing List + Bill of Lading (B/L)',
        descAr: 'مستندات الشحن البنكية والجمركية الكاملة سواء بنظام الاعتماد المستندي (L/C) أو التحويل (T/T).',
        descEn: 'Full banking & customs shipping set supporting L/C and T/T payment terms.',
        icon: 'fa-file-invoice-dollar'
    },
    {
        id: 'exp_doc_5',
        code: 'SGS / INTERTEK',
        titleAr: 'شهادة الفحص والوزن قبل الشحن (حسب طلب المستورد)',
        titleEn: 'Pre-Shipment Inspection & Weight Certificate (Optional)',
        descAr: 'إمكانية إشراف شركات الفحص الدولية (SGS / Intertek) أثناء التحميل بالميناء.',
        descEn: 'Third-party inspection by SGS or Intertek during container stuffing at port.',
        icon: 'fa-shield-check'
    }
];

// ==========================================
// 3. تحميل ومزامنة بيانات التصدير من Firestore
// ==========================================
async function loadExportSettingsFromDb() {
    try {
        const snap = await getDoc(doc(db, "export_settings", "general"));
        if (snap.exists()) {
            exportSettingsCache = { ...DEFAULT_EXPORT_SETTINGS, ...snap.data() };
        }
    } catch (_) {}
    applyExportSettingsToGlobalUI();
    return exportSettingsCache;
}

async function loadExportSpecsFromDb() {
    try {
        const snap = await getDocs(query(collection(db, "export_specs"), limit(50)));
        if (!snap.empty) {
            exportSpecsCache = [];
            snap.forEach(d => exportSpecsCache.push({ id: d.id, ...d.data() }));
            exportSpecsFromDb = true;
            return exportSpecsCache;
        }
    } catch (_) {}
    exportSpecsFromDb = false;
    exportSpecsCache = [...DEFAULT_EXPORT_SPECS];
    return exportSpecsCache;
}

async function loadExportDocsFromDb() {
    try {
        const snap = await getDocs(query(collection(db, "export_docs"), limit(30)));
        if (!snap.empty) {
            exportDocsCache = [];
            snap.forEach(d => exportDocsCache.push({ id: d.id, ...d.data() }));
            exportDocsFromDb = true;
            return exportDocsCache;
        }
    } catch (_) {}
    exportDocsFromDb = false;
    exportDocsCache = [...DEFAULT_EXPORT_DOCS];
    return exportDocsCache;
}

async function syncAllExportPortalData() {
    await Promise.all([
        loadExportSettingsFromDb(),
        loadExportSpecsFromDb(),
        loadExportDocsFromDb()
    ]);
    updateExportDrawerButtonText();
    renderExportHubContent();
}

function applyExportSettingsToGlobalUI() {
    const drawerBtn = document.getElementById('drawerExportHubBtn');
    if (drawerBtn) {
        drawerBtn.style.display = exportSettingsCache.enabled === false ? 'none' : '';
    }
    const waBtn = document.getElementById('rfqWhatsAppBtn');
    if (waBtn && exportSettingsCache.waPhone) {
        waBtn.href = `https://wa.me/${exportSettingsCache.waPhone.replace(/[^0-9]/g, '')}`;
    }
    const callBtn = document.getElementById('rfqCallBtn');
    if (callBtn && exportSettingsCache.directPhone) {
        callBtn.href = `tel:${exportSettingsCache.directPhone}`;
    }
}

// ==========================================
// 4. حقن التنسيقات البصرية (CSS) الخاصة بقسم التصدير ولوحة الإدارة
// ==========================================
function injectExportCoreStyles() {
    if (document.getElementById('omda-export-core-styles')) return;
    const style = document.createElement('style');
    style.id = 'omda-export-core-styles';
    style.textContent = `
        .export-hero-card {
            background: linear-gradient(135deg, #10271c 0%, #173627 60%, #234d39 100%);
            color: #fff;
            border-radius: var(--radius, 16px);
            padding: 22px;
            margin-bottom: 18px;
            border: 1.5px solid var(--accent, #d4af37);
            box-shadow: 0 8px 24px rgba(16, 39, 28, 0.22);
            position: relative;
            overflow: hidden;
        }
        .export-hero-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
        }
        .export-pill-badge {
            background: rgba(212, 175, 55, 0.16);
            border: 1px solid rgba(212, 175, 55, 0.45);
            color: #f3e5ab;
            padding: 4px 11px;
            border-radius: 20px;
            font-size: 0.78rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .export-subtabs {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 6px;
            margin-bottom: 16px;
            scrollbar-width: none;
        }
        .export-subtabs::-webkit-scrollbar { display: none; }
        .export-subtab-btn {
            background: #fff;
            border: 1px solid var(--border-color, #e5e7eb);
            color: var(--primary, #173627);
            padding: 9px 15px;
            border-radius: 25px;
            font-weight: 800;
            font-size: 0.84rem;
            cursor: pointer;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            transition: all 0.2s ease;
        }
        .export-subtab-btn.active, .export-subtab-btn:hover {
            background: var(--primary, #173627);
            color: var(--accent, #d4af37);
            border-color: var(--primary, #173627);
            box-shadow: 0 4px 10px rgba(23, 54, 39, 0.18);
        }
        .export-calc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
        }
        .export-result-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin-top: 14px;
        }
        .export-stat-card {
            background: #f8faf9;
            border: 1px solid #d1e3da;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
        }
        .export-stat-card span {
            display: block;
            font-size: 0.78rem;
            color: #555;
            margin-bottom: 4px;
        }
        .export-stat-card strong {
            font-size: 1.15rem;
            font-weight: 900;
            color: var(--primary, #173627);
        }
        .export-spec-card {
            background: #fff;
            border-radius: 14px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-top: 4px solid var(--primary, #173627);
            padding: 16px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.04);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .export-hs-tag {
            background: #173627;
            color: #d4af37;
            padding: 3px 9px;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 800;
            font-family: monospace;
        }
        .export-timeline {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 14px;
        }
        .export-stage-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 10px;
            background: #f8faf9;
            border: 1px solid #e5e7eb;
            opacity: 0.6;
        }
        .export-stage-row.done {
            opacity: 1;
            background: #eef7f2;
            border-color: #234d39;
        }
        .export-stage-row.current {
            opacity: 1;
            background: #fffbeb;
            border: 1.5px solid #d4af37;
            box-shadow: 0 2px 8px rgba(212, 175, 55, 0.18);
        }
        .export-stage-icon {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #e2e8f0;
            color: #475569;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .export-stage-row.done .export-stage-icon {
            background: #173627;
            color: #d4af37;
        }
        .export-stage-row.current .export-stage-icon {
            background: #d4af37;
            color: #10271c;
        }
        .export-cat-banner {
            background: linear-gradient(135deg, #173627, #234d39);
            color: #fff;
            border-radius: 14px;
            padding: 14px 16px;
            margin-bottom: 16px;
            border: 1px solid #d4af37;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .admin-exp-subtabs {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 4px 2px 10px 2px;
            margin-bottom: 14px;
            border-bottom: 1.5px solid #e5e7eb;
            scrollbar-width: none;
        }
        .admin-exp-subtabs::-webkit-scrollbar { display: none; }
        .admin-exp-subtab-btn {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #173627;
            padding: 8px 14px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 0.83rem;
            cursor: pointer;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        .admin-exp-subtab-btn.active {
            background: #173627;
            color: #d4af37;
            border-color: #173627;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 5. بناء واجهة بوابة التصدير الدولي وربطها بالقائمة ولوحة الإدارة
// ==========================================
function injectExportHubUI() {
    injectExportCoreStyles();

    // 1) إضافة زر البوابة في القائمة الجانبية
    const drawerLinks = document.querySelector('#sideMenuDrawer .drawer-links');
    if (drawerLinks && !document.getElementById('drawerExportHubBtn')) {
        const btn = document.createElement('button');
        btn.id = 'drawerExportHubBtn';
        btn.className = 'drawer-item admin-highlight';
        btn.onclick = () => {
            if (typeof window.closeSideMenu === 'function') window.closeSideMenu();
            if (typeof window.switchSection === 'function') window.switchSection('exportHubSection');
            renderExportHubContent();
        };

        const qualityItem = drawerLinks.querySelector('[onclick*="qualitySpecsSection"]');
        if (qualityItem && qualityItem.nextSibling) {
            drawerLinks.insertBefore(btn, qualityItem.nextSibling);
        } else {
            drawerLinks.appendChild(btn);
        }
    }

    // 2) إضافة زر سريع في شريط تبويبات لوحة الإدارة للوصول الفوري لإعدادات بوابة التصدير
    const adminTabs = document.querySelector('#adminSection .admin-tabs');
    const tabExportBtn = document.getElementById('tabExportBtn');
    if (adminTabs && tabExportBtn && !document.getElementById('tabExportPortalManageBtn')) {
        const manageBtn = document.createElement('button');
        manageBtn.type = 'button';
        manageBtn.id = 'tabExportPortalManageBtn';
        manageBtn.className = 'tab-btn';
        manageBtn.innerHTML = '<i class="fa-solid fa-sliders"></i> إدارة بوابة التصدير';
        manageBtn.addEventListener('click', () => {
            if (typeof window.switchAdminTab === 'function') {
                window.switchAdminTab('export_rfq');
            }
            activeAdminExportSubTab = 'specs';
            enhanceAdminExportPanel();
            renderAdminExportSubView();
            adminTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            manageBtn.classList.add('active');
        });
        if (tabExportBtn.nextSibling) {
            adminTabs.insertBefore(manageBtn, tabExportBtn.nextSibling);
        } else {
            adminTabs.appendChild(manageBtn);
        }
    }

    // 3) إضافة القسم الرئيسي لبوابة التصدير داخل app-main
    const mainEl = document.querySelector('main.app-main');
    if (mainEl && !document.getElementById('exportHubSection')) {
        const section = document.createElement('section');
        section.id = 'exportHubSection';
        section.className = 'app-section';
        section.style.display = 'none';
        mainEl.appendChild(section);
    }

    // 4) إضافة شريط دخول سريع لبوابة التصدير داخل قسم المنتجات عند تصفية التصدير
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid && !document.getElementById('exportCategoryQuickBanner')) {
        const banner = document.createElement('div');
        banner.id = 'exportCategoryQuickBanner';
        banner.className = 'export-cat-banner';
        banner.style.display = 'none';
        productsGrid.parentNode.insertBefore(banner, productsGrid);
    }

    exportSpecsCache = [...DEFAULT_EXPORT_SPECS];
    exportDocsCache = [...DEFAULT_EXPORT_DOCS];
    updateExportDrawerButtonText();
    renderExportHubContent();
    syncAllExportPortalData();
}

function updateExportDrawerButtonText() {
    const btn = document.getElementById('drawerExportHubBtn');
    if (btn) {
        btn.innerHTML = `
            <span class="drawer-item-left">
                <i class="fa-solid fa-ship"></i>
                <span>${tx('بوابة التصدير الدولي B2B', 'International Export Hub B2B')}</span>
            </span>
            <span class="drawer-badge" style="background: var(--accent); color: var(--primary-dark);">B2B</span>
        `;
    }

    const banner = document.getElementById('exportCategoryQuickBanner');
    if (banner) {
        banner.innerHTML = `
            <div>
                <strong style="color: var(--accent); font-size: 0.98rem; display: block;">
                    <i class="fa-solid fa-globe"></i> ${tx('خدمات التصدير المتكاملة (حاسبة الحاويات + HS Codes + تتبع الشحنات)', 'Complete Export Suite (Container Calculator + HS Codes + Tracking)')}
                </strong>
                <span style="font-size: 0.82rem; opacity: 0.9;">
                    ${tx('احسب حمولة الحاويات 20/40 قدم، استعرض الأكواد الجمركية، وتابع شحنتك البحرية.', 'Calculate 20/40ft container loads, browse HS codes, and track sea shipments.')}
                </span>
            </div>
            <button type="button" id="openExportHubFromBannerBtn" style="background: var(--accent); color: var(--primary-dark); border: none; padding: 8px 16px; border-radius: 20px; font-weight: 900; cursor: pointer; white-space: nowrap;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> ${tx('فتح بوابة التصدير', 'Open Export Hub')}
            </button>
        `;
        banner.querySelector('#openExportHubFromBannerBtn')?.addEventListener('click', () => {
            if (typeof window.switchSection === 'function') window.switchSection('exportHubSection');
            renderExportHubContent();
        });
    }
}

// ==========================================
// 6. بناء محتوى بوابة التصدير التفاعلية للعملاء (4 تبويبات)
// ==========================================
let activeExportSubTab = 'calculator';

function renderExportHubContent() {
    const section = document.getElementById('exportHubSection');
    if (!section) return;

    const cfg = exportSettingsCache;
    const heroTitle = escapeHtml(getLang() === 'en' ? cfg.heroTitleEn : cfg.heroTitleAr);
    const heroDesc = escapeHtml(getLang() === 'en' ? cfg.heroDescEn : cfg.heroDescAr);
    const portsBanner = escapeHtml(getLang() === 'en' ? cfg.portsBannerEn : cfg.portsBannerAr);
    const waClean = (cfg.waPhone || '201114099799').replace(/[^0-9]/g, '');

    section.innerHTML = `
        <div class="export-hero-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                <div>
                    <span style="color: var(--accent); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.5px;">
                        <i class="fa-solid fa-globe"></i> AL-EKHLAS GLOBAL EXPORT DIVISION
                    </span>
                    <h2 style="font-size: 1.45rem; font-weight: 900; margin: 4px 0 6px 0; color: #fff;">
                        ${heroTitle}
                    </h2>
                    <p style="font-size: 0.88rem; opacity: 0.92; max-width: 680px;">
                        ${heroDesc}
                    </p>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <a href="https://wa.me/${waClean}?text=${encodeURIComponent('السلام عليكم، استفسار بخصوص التصدير الدولي B2B من مؤسسة الإخلاص')}" target="_blank" rel="noopener noreferrer" style="background:#25D366; color:#fff; padding:9px 14px; border-radius:10px; text-decoration:none; font-weight:800; font-size:0.84rem; display:inline-flex; align-items:center; gap:6px;">
                        <i class="fa-brands fa-whatsapp"></i> ${tx('واتساب التصدير', 'Export WhatsApp')}
                    </a>
                    <button type="button" id="hubDirectRfqBtn" style="background:var(--accent); color:var(--primary-dark); border:none; padding:9px 14px; border-radius:10px; font-weight:900; font-size:0.84rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-file-signature"></i> ${tx('طلب عرض سعر فوري', 'Instant RFQ')}
                    </button>
                </div>
            </div>
            <div class="export-hero-badges">
                <span class="export-pill-badge"><i class="fa-solid fa-anchor"></i> FOB / CIF / EXW</span>
                <span class="export-pill-badge"><i class="fa-solid fa-certificate"></i> GAFTA / EUR.1 / CO</span>
                <span class="export-pill-badge"><i class="fa-solid fa-microscope"></i> Aflatoxin &lt; 5 ppb</span>
                <span class="export-pill-badge"><i class="fa-solid fa-ship"></i> ${portsBanner}</span>
            </div>
        </div>

        <div class="export-subtabs">
            <button type="button" class="export-subtab-btn ${activeExportSubTab === 'calculator' ? 'active' : ''}" data-subtab="calculator">
                <i class="fa-solid fa-boxes-packing"></i> ${tx('حاسبة الحاويات والشحن', 'Container & Freight Calc')}
            </button>
            <button type="button" class="export-subtab-btn ${activeExportSubTab === 'specs' ? 'active' : ''}" data-subtab="specs">
                <i class="fa-solid fa-barcode"></i> ${tx('المواصفات و HS Codes', 'Specs & HS Codes')}
            </button>
            <button type="button" class="export-subtab-btn ${activeExportSubTab === 'docs' ? 'active' : ''}" data-subtab="docs">
                <i class="fa-solid fa-folder-open"></i> ${tx('مستندات وشهادات التصدير', 'Export Documents')}
            </button>
            <button type="button" class="export-subtab-btn ${activeExportSubTab === 'tracking' ? 'active' : ''}" data-subtab="tracking">
                <i class="fa-solid fa-route"></i> ${tx('تتبع شحنات التصدير', 'Track Export Shipment')}
            </button>
        </div>

        <div id="exportHubDynamicBody"></div>
    `;

    section.querySelector('#hubDirectRfqBtn')?.addEventListener('click', () => {
        if (typeof window.openExportRfqModal === 'function') {
            window.openExportRfqModal({
                id: 'export_general',
                name: 'طلب تصدير جملة مخصص (B2B)',
                nameEn: 'Custom Bulk Export Inquiry (B2B)',
                minQty: tx(`${cfg.cap20ft || 24} طن (حاوية 20 قدم)`, `${cfg.cap20ft || 24} Tons (20ft Container)`)
            });
        }
    });

    section.querySelectorAll('.export-subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeExportSubTab = btn.dataset.subtab;
            renderExportHubContent();
        });
    });

    const body = document.getElementById('exportHubDynamicBody');
    if (!body) return;

    if (activeExportSubTab === 'calculator') renderContainerCalculatorTab(body);
    else if (activeExportSubTab === 'specs') renderExportSpecsTab(body);
    else if (activeExportSubTab === 'docs') renderExportDocsTab(body);
    else if (activeExportSubTab === 'tracking') renderExportTrackingTab(body);
}

// ==========================================
// 7. تبويب حاسبة الحاويات والشحن البحري
// ==========================================
function renderContainerCalculatorTab(container) {
    const specs = exportSpecsCache.length > 0 ? exportSpecsCache : DEFAULT_EXPORT_SPECS;
    const cfg = exportSettingsCache;
    const cap20 = Number(cfg.cap20ft || 24);
    const cap40 = Number(cfg.cap40hc || 27);
    const defaultRate = Number(cfg.defaultUsdRate || 50.5);

    const productOptions = specs.map((s, idx) => {
        const label = escapeHtml(getLang() === 'en' ? (s.nameEn || s.nameAr) : s.nameAr);
        return `<option value="${idx}" data-fob="${Number(s.baseFobUsd || 400)}">${label} (~$${Number(s.baseFobUsd || 400)}/Ton)</option>`;
    }).join('');

    container.innerHTML = `
        <div class="form-card" style="border-top: 4px solid var(--accent);">
            <h3><i class="fa-solid fa-calculator"></i> ${tx('حاسبة تحميل الحاويات والتكلفة التقديرية للتصدير (USD / EGP)', 'Container Load & Export Cost Estimator (USD / EGP)')}</h3>
            <form id="exportContainerCalcForm">
                <div class="export-calc-grid">
                    <div class="input-group">
                        <label>${tx('الصنف التصديري', 'Export Commodity')}</label>
                        <select id="expCalcProductSelect">${productOptions}</select>
                    </div>
                    <div class="input-group">
                        <label>${tx('نوع الحاوية / الشحن', 'Container / Vessel Type')}</label>
                        <select id="expCalcContainerType">
                            <option value="20ft">${tx(`حاوية 20 قدم جافة (${cap20} طن)`, `20ft Dry Container (${cap20} Tons)`)}</option>
                            <option value="40hc">${tx(`حاوية 40 قدم مرتفعة HC (${cap40} طن)`, `40ft High Cube Container (${cap40} Tons)`)}</option>
                            <option value="bulk">${tx('شحن صب بالسفن (Bulk Vessel)', 'Bulk Vessel Shipment')}</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>${tx('نظام التعبئة والتغليف', 'Packaging Type')}</label>
                        <select id="expCalcPackaging">
                            <option value="50">${tx('شكاير PP محبوكة 50 كجم', '50 kg PP Woven Bags')}</option>
                            <option value="25">${tx('شكاير 25 كجم', '25 kg PP Bags')}</option>
                            <option value="1000">${tx('جامبو باج 1000 كجم (1 طن)', '1,000 kg Jumbo Big Bags')}</option>
                            <option value="425">${tx('بالات مكبوسة (~425 كجم)', 'Compressed Bales (~425 kg)')}</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>${tx('الكمية المطلوبة (بالطن)', 'Required Quantity (Tons)')}</label>
                        <input type="number" id="expCalcTons" min="10" max="500000" value="${cap20 * 2}" required>
                    </div>
                    <div class="input-group">
                        <label>${tx('شرط التسليم (Incoterm)', 'Incoterm')}</label>
                        <select id="expCalcIncoterm">
                            <option value="FOB">FOB (تسليم ظهر السفينة بميناء مصر)</option>
                            <option value="CIF">CIF (شامل الشحن البحري والتأمين لمينائك)</option>
                            <option value="EXW">EXW (تسليم أرض المصنع / المخزن)</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>${tx('سعر صرف الدولار (ج.م)', 'USD to EGP Rate')}</label>
                        <input type="number" id="expCalcUsdRate" min="1" step="0.1" value="${defaultRate}" required>
                    </div>
                </div>
                <button type="submit" class="btn-submit" style="margin-top: 8px;">
                    <i class="fa-solid fa-ship"></i> ${tx('احسب عدد الحاويات والتكلفة الإجمالية', 'Calculate Containers & Total Cost')}
                </button>
            </form>

            <div id="expCalcOutputBox" style="display:none; margin-top: 18px; padding-top: 16px; border-top: 1.5px dashed #cbd5e1;">
                <h4 style="color: var(--primary); margin-bottom: 8px;"><i class="fa-solid fa-chart-column"></i> ${tx('ملخص التقدير اللوجستي والمالي:', 'Logistical & Financial Estimate:')}</h4>
                <div id="expCalcStatsCards" class="export-result-cards"></div>
                <button type="button" id="convertCalcToRfqBtn" class="btn-submit" style="margin-top: 14px; background: var(--accent); color: var(--primary-dark); font-weight: 900;">
                    <i class="fa-solid fa-paper-plane"></i> ${tx('اعتماد هذه الكمية وطلب عرض سعر رسمي (RFQ)', 'Convert to Official RFQ Now')}
                </button>
            </div>
        </div>
    `;

    container.querySelector('#exportContainerCalcForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const prodSel = document.getElementById('expCalcProductSelect');
        const selectedOpt = prodSel.options[prodSel.selectedIndex];
        const prodName = selectedOpt ? selectedOpt.textContent.split(' (~$')[0] : 'Export Feed';
        const baseFobUsd = Number(selectedOpt?.dataset.fob || 400);

        const contType = document.getElementById('expCalcContainerType').value;
        const unitKg = Number(document.getElementById('expCalcPackaging').value) || 50;
        const tons = Math.max(10, Number(document.getElementById('expCalcTons').value) || cap20);
        const incoterm = document.getElementById('expCalcIncoterm').value;
        const usdRate = Math.max(1, Number(document.getElementById('expCalcUsdRate').value) || defaultRate);

        const capacityPerCont = contType === '20ft' ? cap20 : (contType === '40hc' ? cap40 : 0);
        const containersCount = capacityPerCont > 0 ? Math.ceil(tons / capacityPerCont) : 0;
        const totalUnits = Math.ceil((tons * 1000) / unitKg);

        let adjustedPricePerTonUsd = baseFobUsd;
        if (incoterm === 'EXW') adjustedPricePerTonUsd = Math.max(50, baseFobUsd - 22);
        else if (incoterm === 'CIF') adjustedPricePerTonUsd = baseFobUsd + 55;

        const totalUsd = tons * adjustedPricePerTonUsd;
        const totalEgp = totalUsd * usdRate;

        lastContainerCalc = {
            prodName,
            tons,
            containersCount,
            contType,
            totalUnits,
            unitKg,
            incoterm,
            adjustedPricePerTonUsd,
            totalUsd
        };

        const outBox = document.getElementById('expCalcOutputBox');
        const cardsBox = document.getElementById('expCalcStatsCards');
        if (cardsBox) {
            cardsBox.innerHTML = `
                <div class="export-stat-card">
                    <span>${tx('عدد الحاويات المطلوبة', 'Required Containers')}</span>
                    <strong>${contType === 'bulk' ? tx('شحن صب (Bulk)', 'Bulk Vessel') : `${containersCount} × ${contType.toUpperCase()}`}</strong>
                </div>
                <div class="export-stat-card">
                    <span>${tx('إجمالي الوحدات / الشكاير', 'Total Bags / Bales')}</span>
                    <strong>${totalUnits.toLocaleString()} <small>(${unitKg} kg)</small></strong>
                </div>
                <div class="export-stat-card">
                    <span>${tx('سعر الطن الاسترشادي', 'Indicative Price/Ton')}</span>
                    <strong style="color:#0284c7;">$${adjustedPricePerTonUsd.toLocaleString()} <small>(${incoterm})</small></strong>
                </div>
                <div class="export-stat-card">
                    <span>${tx('الإجمالي التقديري (USD)', 'Estimated Total (USD)')}</span>
                    <strong style="color:#16a34a;">$${totalUsd.toLocaleString()}</strong>
                </div>
                <div class="export-stat-card">
                    <span>${tx('المعادل بالجنيه المصري', 'Equivalent in EGP')}</span>
                    <strong style="color:var(--accent);">${Math.round(totalEgp).toLocaleString()} ${tx('ج.م', 'EGP')}</strong>
                </div>
            `;
        }
        if (outBox) outBox.style.display = 'block';
    });

    container.querySelector('#convertCalcToRfqBtn')?.addEventListener('click', () => {
        if (!lastContainerCalc) return;
        const rfqModal = document.getElementById('exportRfqModal');
        if (!rfqModal) return;

        document.getElementById('rfqProdTitle').textContent = `${lastContainerCalc.prodName} (${lastContainerCalc.totalUnits} × ${lastContainerCalc.unitKg}kg)`;
        document.getElementById('rfqMinQty').textContent = lastContainerCalc.contType === 'bulk'
            ? `${lastContainerCalc.tons} ${tx('طن (شحن صب)', 'Tons (Bulk)')}`
            : `${lastContainerCalc.containersCount} ${tx('حاوية', 'Containers')} (${lastContainerCalc.tons} ${tx('طن', 'Tons')})`;

        const qtyInput = document.getElementById('rfqQuantity');
        const incotermSel = document.getElementById('rfqIncoterm');
        if (qtyInput) qtyInput.value = lastContainerCalc.tons;
        if (incotermSel) incotermSel.value = lastContainerCalc.incoterm;

        rfqModal.style.display = 'flex';
    });
}

// ==========================================
// 8. تبويب دليل المواصفات القياسية والأكواد الجمركية HS Codes
// ==========================================
async function renderExportSpecsTab(container) {
    const list = exportSpecsCache.length > 0 ? exportSpecsCache : DEFAULT_EXPORT_SPECS;

    container.innerHTML = `
        <div class="section-title">
            <h3><i class="fa-solid fa-barcode"></i> ${tx('دليل المواصفات القياسية وبنود التعريفة الجمركية (HS Codes)', 'Export Product Specifications & Harmonized System (HS Codes)')}</h3>
            <span>${tx('مواصفات معتمدة للتخليص الجمركي الدولي وطلب عروض الأسعار المباشرة', 'Certified specifications for international customs clearance and direct RFQ')}</span>
        </div>
        <div class="products-grid" style="grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));">
            ${list.map(item => {
                const title = escapeHtml(getLang() === 'en' ? (item.nameEn || item.nameAr) : item.nameAr);
                const pack = escapeHtml(getLang() === 'en' ? (item.packagingEn || item.packagingAr) : item.packagingAr);
                const ports = escapeHtml(getLang() === 'en' ? (item.portsEn || item.portsAr) : item.portsAr);
                return `
                    <div class="export-spec-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                            <span class="export-hs-tag">HS: ${escapeHtml(item.hsCode)}</span>
                            <span style="font-size:0.78rem; color:#16a34a; font-weight:800;">
                                <i class="fa-solid fa-circle-check"></i> ${tx('جاهز للتصدير', 'Export Ready')}
                            </span>
                        </div>
                        <h4 style="color:var(--primary); font-size:1rem; line-height:1.4;">${title}</h4>
                        <div style="background:#f8faf9; padding:10px; border-radius:8px; font-size:0.83rem; display:flex; flex-direction:column; gap:5px;">
                            <div><strong>${tx('البروتين:', 'Protein:')}</strong> ${escapeHtml(item.protein)} | <strong>${tx('الرطوبة:', 'Moisture:')}</strong> ${escapeHtml(item.moisture)}</div>
                            <div><strong>${tx('التعبئة:', 'Packaging:')}</strong> ${pack}</div>
                            <div><strong>${tx('موانئ الشحن:', 'Loading Ports:')}</strong> ${ports}</div>
                            <div><strong>${tx('الحد الأدنى:', 'MOQ:')}</strong> ${Number(item.minOrderTons || 24)} ${tx('طن', 'Tons')} | <strong>FOB:</strong> ~$${Number(item.baseFobUsd || 0)}/Ton</div>
                        </div>
                        <button type="button" class="btn-submit exp-spec-rfq-btn" data-title="${escapeHtml(item.nameAr)}" data-qty="${Number(item.minOrderTons || 24)}" style="margin-top:auto; padding:9px;">
                            <i class="fa-solid fa-file-signature"></i> ${tx('طلب عرض سعر لهذا الصنف', 'Request Quote for Item')}
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.querySelectorAll('.exp-spec-rfq-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof window.openExportRfqModal === 'function') {
                window.openExportRfqModal({
                    id: 'spec_rfq',
                    name: btn.dataset.title,
                    nameEn: btn.dataset.title,
                    minQty: `${btn.dataset.qty} ${tx('طن', 'Tons')}`
                });
            }
            const qtyInput = document.getElementById('rfqQuantity');
            if (qtyInput && btn.dataset.qty) qtyInput.value = btn.dataset.qty;
        });
    });
}

// ==========================================
// 9. تبويب مستندات وشهادات التصدير الدولية
// ==========================================
function renderExportDocsTab(container) {
    const docsList = exportDocsCache.length > 0 ? exportDocsCache : DEFAULT_EXPORT_DOCS;

    container.innerHTML = `
        <div class="section-title">
            <h3><i class="fa-solid fa-folder-open"></i> ${tx('حزمة مستندات التصدير والشهادات المعتمدة', 'Official Export Documentation & Compliance Package')}</h3>
            <span>${tx('نوفر كافة المستندات الجمركية والبيطرية والبنكية لضمان دخول سلس لبضائعكم في ميناء الوصول', 'We provide complete customs, veterinary & banking documents for smooth clearance at destination port')}</span>
        </div>
        <div class="products-grid" style="grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));">
            ${docsList.map(docItem => `
                <div class="export-spec-card" style="border-top-color: var(--accent);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="width:38px; height:38px; border-radius:10px; background:#eef7f2; color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                            <i class="fa-solid ${escapeHtml(docItem.icon || 'fa-file-shield')}"></i>
                        </span>
                        <span class="export-hs-tag">${escapeHtml(docItem.code)}</span>
                    </div>
                    <h4 style="color:var(--primary); font-size:0.96rem;">${escapeHtml(getLang() === 'en' ? (docItem.titleEn || docItem.titleAr) : docItem.titleAr)}</h4>
                    <p style="font-size:0.83rem; color:#555; line-height:1.5;">${escapeHtml(getLang() === 'en' ? (docItem.descEn || docItem.descAr) : docItem.descAr)}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// ==========================================
// 10. تبويب تتبع شحنات التصدير والحاويات (B2B Tracker)
// ==========================================
function renderExportTrackingTab(container) {
    container.innerHTML = `
        <div class="form-card" style="border-top: 4px solid var(--primary);">
            <h3><i class="fa-solid fa-route"></i> ${tx('تتبع شحنة التصدير أو رقم الحاوية / بوليصة الشحن (B/L)', 'Track Export Shipment by RFQ ID, Container # or B/L')}</h3>
            <p style="font-size:0.85rem; color:#666; margin-bottom:12px;">
                ${tx('أدخل رقم طلب التصدير أو رقم الحاوية أو رقم الهاتف المسجل في الطلب لعرض حالة الشحنة ومراحل التخليص.', 'Enter your Export RFQ ID, Container Number, or registered phone number to view live shipment milestones.')}
            </p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <input type="text" id="exportTrackInput" placeholder="${tx('مثال: رقم الطلب أو رقم الحاوية MSCU1234567 أو الهاتف', 'e.g., RFQ ID, Container # MSCU1234567, or Phone')}" style="flex:1; min-width:220px; padding:10px; border-radius:8px; border:1px solid #ccc;">
                <button type="button" id="runExportTrackBtn" class="btn-submit" style="width:auto; padding:10px 22px;">
                    <i class="fa-solid fa-magnifying-glass"></i> ${tx('تتبع الشحنة', 'Track')}
                </button>
            </div>
            <div id="exportTrackResultArea" style="margin-top: 16px;"></div>
        </div>
    `;

    container.querySelector('#runExportTrackBtn')?.addEventListener('click', async () => {
        const raw = (document.getElementById('exportTrackInput')?.value || '').trim().replace(/^#/, '').toLowerCase();
        const resultArea = document.getElementById('exportTrackResultArea');
        if (!raw || !resultArea) return;

        resultArea.innerHTML = `<p style="color:#666;">${tx('جاري البحث في سجلات التصدير...', 'Searching export records...')}</p>`;

        try {
            const snap = await getDocs(query(collection(db, "rfq_orders"), limit(100)));
            let matched = null;
            snap.forEach(d => {
                const data = d.data();
                const idMatch = d.id.toLowerCase().startsWith(raw);
                const contMatch = (data.containerNo || '').toLowerCase().includes(raw);
                const phoneMatch = (data.phone || '').replace(/\s+/g, '').includes(raw.replace(/\s+/g, ''));
                if (!matched && (idMatch || contMatch || phoneMatch)) {
                    matched = { id: d.id, ...data };
                }
            });

            if (!matched) {
                resultArea.innerHTML = `<p style="color:#dc2626; font-weight:bold;">${tx('لم يتم العثور على شحنة تصدير مطابقة. تأكد من الرقم أو تواصل مع قسم التصدير.', 'No matching export shipment found. Please verify your reference or contact Export Desk.')}</p>`;
                return;
            }

            const currentStep = Number(matched.exportStageStep || 1);
            const timelineHtml = EXPORT_SHIPMENT_STAGES.map(st => {
                const cls = st.step < currentStep ? 'done' : (st.step === currentStep ? 'current' : '');
                return `
                    <div class="export-stage-row ${cls}">
                        <div class="export-stage-icon"><i class="fa-solid ${st.icon}"></i></div>
                        <div style="flex:1;">
                            <strong style="font-size:0.88rem; color:var(--primary); display:block;">${escapeHtml(getLang() === 'en' ? st.en : st.ar)}</strong>
                            ${st.step === currentStep ? `<span style="font-size:0.76rem; color:#b45309; font-weight:800;">${tx('المرحلة الحالية للشحنة', 'Current Shipment Stage')}</span>` : ''}
                        </div>
                        ${st.step <= currentStep ? `<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i>` : ''}
                    </div>
                `;
            }).join('');

            resultArea.innerHTML = `
                <div style="background:#fff; border:1.5px solid var(--primary); border-radius:12px; padding:16px;">
                    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; border-bottom:1px solid #eee; padding-bottom:10px;">
                        <div>
                            <strong style="color:var(--primary); font-size:1rem;">${tx('ملف تصدير رقم:', 'Export File #')} ${escapeHtml(matched.id.slice(0, 8))}</strong>
                            <p style="font-size:0.85rem; color:#555; margin-top:3px;">
                                <strong>${tx('الشركة:', 'Company:')}</strong> ${escapeHtml(matched.companyName)} | 
                                <strong>${tx('الصنف:', 'Commodity:')}</strong> ${escapeHtml(matched.productTitle)} (${escapeHtml(matched.quantity)} ${tx('طن', 'Tons')})
                            </p>
                        </div>
                        <div style="text-align:${getLang() === 'en' ? 'right' : 'left'};">
                            <span style="background:var(--primary); color:var(--accent); padding:4px 10px; border-radius:8px; font-size:0.8rem; font-weight:800;">
                                ${escapeHtml(matched.incoterm || 'FOB')} — ${escapeHtml(matched.destination || '')}
                            </span>
                            ${matched.containerNo ? `<div style="font-size:0.82rem; font-weight:bold; color:#0284c7; margin-top:4px;">Container / B/L: ${escapeHtml(matched.containerNo)}</div>` : ''}
                            ${matched.vesselName ? `<div style="font-size:0.78rem; color:#555;">Vessel: ${escapeHtml(matched.vesselName)}</div>` : ''}
                        </div>
                    </div>
                    <div class="export-timeline">${timelineHtml}</div>
                </div>
            `;
        } catch (err) {
            resultArea.innerHTML = `<p style="color:#dc2626;">${escapeHtml(err.message)}</p>`;
        }
    });
}

// ==========================================
// 11. مركز التحكم الشامل في بوابة التصدير داخل لوحة الإدارة
// ==========================================
let activeAdminExportSubTab = 'specs';

function enhanceAdminExportPanel() {
    const adminExportTab = document.getElementById('adminExportTab');
    if (!adminExportTab) return;

    let controlHub = document.getElementById('adminExportFullControlCenter');
    if (!controlHub) {
        controlHub = document.createElement('div');
        controlHub.id = 'adminExportFullControlCenter';
        controlHub.style.marginBottom = '20px';
        adminExportTab.insertBefore(controlHub, adminExportTab.firstChild);
    }

    renderAdminExportSubView();
}

function renderAdminExportSubView() {
    const controlHub = document.getElementById('adminExportFullControlCenter');
    if (!controlHub) return;

    controlHub.innerHTML = `
        <div class="form-card" style="border-top: 4px solid var(--accent); margin-bottom: 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                <h3 style="margin:0;"><i class="fa-solid fa-ship"></i> لوحة التحكم الكاملة في بوابة التصدير الدولي (B2B)</h3>
                <button type="button" id="adminExpPreviewPortalBtn" class="btn-submit" style="width:auto; padding:6px 14px; background:var(--accent); color:var(--primary-dark); font-size:0.82rem;">
                    <i class="fa-solid fa-eye"></i> معاينة بوابة التصدير
                </button>
            </div>

            <div class="admin-exp-subtabs">
                <button type="button" class="admin-exp-subtab-btn ${activeAdminExportSubTab === 'specs' ? 'active' : ''}" data-admintab="specs">
                    <i class="fa-solid fa-barcode"></i> الأصناف والمواصفات و HS Codes
                </button>
                <button type="button" class="admin-exp-subtab-btn ${activeAdminExportSubTab === 'settings' ? 'active' : ''}" data-admintab="settings">
                    <i class="fa-solid fa-sliders"></i> إعدادات البوابة وحاسبة الحاويات
                </button>
                <button type="button" class="admin-exp-subtab-btn ${activeAdminExportSubTab === 'docs' ? 'active' : ''}" data-admintab="docs">
                    <i class="fa-solid fa-folder-open"></i> مستندات وشهادات التصدير
                </button>
                <button type="button" class="admin-exp-subtab-btn ${activeAdminExportSubTab === 'shipments' ? 'active' : ''}" data-admintab="shipments">
                    <i class="fa-solid fa-file-invoice-dollar"></i> الشحنات والفواتير المبدئية ($)
                </button>
            </div>

            <div id="adminExportSubBody"></div>
        </div>
    `;

    controlHub.querySelector('#adminExpPreviewPortalBtn')?.addEventListener('click', () => {
        if (typeof window.switchSection === 'function') window.switchSection('exportHubSection');
        renderExportHubContent();
    });

    controlHub.querySelectorAll('.admin-exp-subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeAdminExportSubTab = btn.dataset.admintab;
            renderAdminExportSubView();
        });
    });

    const subBody = document.getElementById('adminExportSubBody');
    if (!subBody) return;

    if (activeAdminExportSubTab === 'specs') renderAdminExportSpecsManager(subBody);
    else if (activeAdminExportSubTab === 'settings') renderAdminExportSettingsManager(subBody);
    else if (activeAdminExportSubTab === 'docs') renderAdminExportDocsManager(subBody);
    else if (activeAdminExportSubTab === 'shipments') {
        subBody.innerHTML = `<div id="adminExportProList" class="data-list"></div>`;
        loadAdminExportProList();
    }
}

// --- 11.أ إدارة الأصناف والمواصفات و HS Codes ---
async function renderAdminExportSpecsManager(container) {
    container.innerHTML = `
        <div style="background:#f8faf9; padding:14px; border-radius:12px; border:1px solid #d1e3da; margin-bottom:16px;">
            <h4 id="adminExpSpecFormHeading" style="color:var(--primary); margin-bottom:10px;">
                <i class="fa-solid fa-plus-circle"></i> إضافة أو تعديل صنف تصديري ومواصفاته القياسية
            </h4>
            <form id="adminExpSpecForm">
                <input type="hidden" id="adminExpSpecId" value="">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:10px;">
                    <div class="input-group">
                        <label>اسم الصنف التصديري (بالعربية) *</label>
                        <input type="text" id="adminExpSpecNameAr" placeholder="مثال: علف دواجن تسمين مركز (تصدير)" required>
                    </div>
                    <div class="input-group">
                        <label>اسم الصنف (بالإنجليزية)</label>
                        <input type="text" id="adminExpSpecNameEn" placeholder="Example: Concentrated Poultry Feed">
                    </div>
                    <div class="input-group">
                        <label>البند الجمركي (HS Code) *</label>
                        <input type="text" id="adminExpSpecHsCode" placeholder="مثال: 2309.90" required>
                    </div>
                    <div class="input-group">
                        <label>سعر الطن الاسترشادي FOB ($) *</label>
                        <input type="number" id="adminExpSpecFobUsd" min="1" step="0.5" placeholder="445" required>
                    </div>
                    <div class="input-group">
                        <label>الحد الأدنى للطلب (طن) *</label>
                        <input type="number" id="adminExpSpecMinTons" min="1" value="24" required>
                    </div>
                    <div class="input-group">
                        <label>نسبة البروتين (%)</label>
                        <input type="text" id="adminExpSpecProtein" placeholder="مثال: 21% - 23.5%" required>
                    </div>
                    <div class="input-group">
                        <label>نسبة الرطوبة (%)</label>
                        <input type="text" id="adminExpSpecMoisture" placeholder="مثال: Max 11.5%" required>
                    </div>
                    <div class="input-group">
                        <label>التعبئة والتغليف (عربي)</label>
                        <input type="text" id="adminExpSpecPackAr" placeholder="شكاير 50 كجم أو جامبو باج 1000 كجم" required>
                    </div>
                    <div class="input-group">
                        <label>التعبئة والتغليف (إنجليزي)</label>
                        <input type="text" id="adminExpSpecPackEn" placeholder="50kg PP Bags or 1000kg Jumbo Bags">
                    </div>
                    <div class="input-group">
                        <label>موانئ الشحن (عربي)</label>
                        <input type="text" id="adminExpSpecPortsAr" placeholder="ميناء الإسكندرية / دمياط / العين السخنة" required>
                    </div>
                    <div class="input-group">
                        <label>موانئ الشحن (إنجليزي)</label>
                        <input type="text" id="adminExpSpecPortsEn" placeholder="Alexandria / Damietta / Ain Sokhna Ports">
                    </div>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                    <button type="submit" id="adminExpSpecSaveBtn" class="btn-submit" style="flex:1; min-width:180px;">
                        <i class="fa-solid fa-floppy-disk"></i> حفظ ونشر الصنف في بوابة التصدير
                    </button>
                    <button type="button" id="adminExpSpecCancelBtn" class="btn-submit" style="width:auto; background:#64748b; display:none;">
                        إلغاء التعديل
                    </button>
                </div>
            </form>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
            <h4 style="margin:0; color:var(--primary);"><i class="fa-solid fa-list-check"></i> الأصناف التصديرية المعروضة حالياً (${exportSpecsCache.length})</h4>
            ${!exportSpecsFromDb ? `<button type="button" id="seedDefaultExportSpecsBtn" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:8px; font-size:0.8rem; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-cloud-arrow-up"></i> تثبيت القائمة الافتراضية بقاعدة البيانات</button>` : ''}
        </div>
        <div id="adminExpSpecsListContainer" class="data-list"></div>
    `;

    const resetForm = () => {
        document.getElementById('adminExpSpecId').value = '';
        document.getElementById('adminExpSpecForm').reset();
        document.getElementById('adminExpSpecMinTons').value = '24';
        document.getElementById('adminExpSpecFormHeading').innerHTML = '<i class="fa-solid fa-plus-circle"></i> إضافة أو تعديل صنف تصديري ومواصفاته القياسية';
        document.getElementById('adminExpSpecSaveBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ ونشر الصنف في بوابة التصدير';
        document.getElementById('adminExpSpecCancelBtn').style.display = 'none';
    };

    document.getElementById('adminExpSpecCancelBtn')?.addEventListener('click', resetForm);

    document.getElementById('seedDefaultExportSpecsBtn')?.addEventListener('click', async () => {
        try {
            for (const item of DEFAULT_EXPORT_SPECS) {
                const { id, ...cleanData } = item;
                await addDoc(collection(db, "export_specs"), { ...cleanData, updatedAt: new Date().toISOString() });
            }
            alert('تم حفظ الأصناف الافتراضية في قاعدة البيانات بنجاح!');
            await syncAllExportPortalData();
            renderAdminExportSpecsManager(container);
        } catch (err) {
            alert('خطأ أثناء الحفظ: ' + err.message);
        }
    });

    document.getElementById('adminExpSpecForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('adminExpSpecId').value.trim();
        const payload = {
            nameAr: document.getElementById('adminExpSpecNameAr').value.trim(),
            nameEn: document.getElementById('adminExpSpecNameEn').value.trim() || document.getElementById('adminExpSpecNameAr').value.trim(),
            hsCode: document.getElementById('adminExpSpecHsCode').value.trim(),
            baseFobUsd: Number(document.getElementById('adminExpSpecFobUsd').value) || 0,
            minOrderTons: Number(document.getElementById('adminExpSpecMinTons').value) || 24,
            protein: document.getElementById('adminExpSpecProtein').value.trim(),
            moisture: document.getElementById('adminExpSpecMoisture').value.trim(),
            packagingAr: document.getElementById('adminExpSpecPackAr').value.trim(),
            packagingEn: document.getElementById('adminExpSpecPackEn').value.trim() || document.getElementById('adminExpSpecPackAr').value.trim(),
            portsAr: document.getElementById('adminExpSpecPortsAr').value.trim(),
            portsEn: document.getElementById('adminExpSpecPortsEn').value.trim() || document.getElementById('adminExpSpecPortsAr').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            // إذا كانت البيانات ما زالت افتراضية ولم تُخزن في Firestore بعد، نحفظ باقي الأصناف أولاً حتى لا تختفي
            if (!exportSpecsFromDb) {
                for (const defItem of DEFAULT_EXPORT_SPECS) {
                    if (defItem.id === editId) continue;
                    const { id, ...cleanDef } = defItem;
                    await addDoc(collection(db, "export_specs"), { ...cleanDef, updatedAt: new Date().toISOString() });
                }
                await addDoc(collection(db, "export_specs"), payload);
            } else if (editId) {
                await updateDoc(doc(db, "export_specs", editId), payload);
            } else {
                await addDoc(collection(db, "export_specs"), payload);
            }

            alert(editId ? 'تم تحديث مواصفات وسعر الصنف بنجاح!' : 'تمت إضافة الصنف التصديري الجديد بنجاح!');
            resetForm();
            await syncAllExportPortalData();
            renderAdminExportSpecsManager(container);
        } catch (err) {
            alert('حدث خطأ أثناء الحفظ في Firestore: ' + err.message);
        }
    });

    const listEl = document.getElementById('adminExpSpecsListContainer');
    if (listEl) {
        listEl.innerHTML = exportSpecsCache.map(item => `
            <div class="data-item" style="border-right: 4px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                    <div>
                        <span class="export-hs-tag">HS: ${escapeHtml(item.hsCode)}</span>
                        <strong style="color:var(--primary); font-size:0.98rem; margin-right:6px;">${escapeHtml(item.nameAr)}</strong>
                        <div style="font-size:0.82rem; color:#555; margin-top:5px;">
                            <span>البروتين: <strong>${escapeHtml(item.protein)}</strong></span> |
                            <span>الرطوبة: <strong>${escapeHtml(item.moisture)}</strong></span> |
                            <span>الحد الأدنى: <strong>${Number(item.minOrderTons)} طن</strong></span> |
                            <span style="color:#16a34a;">FOB: <strong>$${Number(item.baseFobUsd)}/Ton</strong></span>
                        </div>
                        <div style="font-size:0.78rem; color:#666; margin-top:2px;">
                            الموانئ: ${escapeHtml(item.portsAr)} | التعبئة: ${escapeHtml(item.packagingAr)}
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="btn-edit-exp-spec" data-id="${escapeHtml(item.id)}" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">
                            <i class="fa-solid fa-pen-to-square"></i> تعديل
                        </button>
                        <button type="button" class="btn-del-exp-spec" data-id="${escapeHtml(item.id)}" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">
                            <i class="fa-solid fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        listEl.querySelectorAll('.btn-edit-exp-spec').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = exportSpecsCache.find(x => x.id === btn.dataset.id);
                if (!item) return;
                document.getElementById('adminExpSpecId').value = item.id;
                document.getElementById('adminExpSpecNameAr').value = item.nameAr || '';
                document.getElementById('adminExpSpecNameEn').value = item.nameEn || '';
                document.getElementById('adminExpSpecHsCode').value = item.hsCode || '';
                document.getElementById('adminExpSpecFobUsd').value = item.baseFobUsd || '';
                document.getElementById('adminExpSpecMinTons').value = item.minOrderTons || 24;
                document.getElementById('adminExpSpecProtein').value = item.protein || '';
                document.getElementById('adminExpSpecMoisture').value = item.moisture || '';
                document.getElementById('adminExpSpecPackAr').value = item.packagingAr || '';
                document.getElementById('adminExpSpecPackEn').value = item.packagingEn || '';
                document.getElementById('adminExpSpecPortsAr').value = item.portsAr || '';
                document.getElementById('adminExpSpecPortsEn').value = item.portsEn || '';

                document.getElementById('adminExpSpecFormHeading').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل الصنف: ${escapeHtml(item.nameAr)}`;
                document.getElementById('adminExpSpecSaveBtn').innerHTML = '<i class="fa-solid fa-check"></i> حفظ التعديلات الآن';
                document.getElementById('adminExpSpecCancelBtn').style.display = 'inline-block';
                document.getElementById('adminExpSpecForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        listEl.querySelectorAll('.btn-del-exp-spec').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('هل أنت متأكد من حذف هذا الصنف من بوابة التصدير؟')) return;
                const delId = btn.dataset.id;
                try {
                    if (!exportSpecsFromDb) {
                        for (const defItem of DEFAULT_EXPORT_SPECS) {
                            if (defItem.id === delId) continue;
                            const { id, ...cleanDef } = defItem;
                            await addDoc(collection(db, "export_specs"), { ...cleanDef, updatedAt: new Date().toISOString() });
                        }
                    } else {
                        await deleteDoc(doc(db, "export_specs", delId));
                    }
                    alert('تم حذف الصنف بنجاح!');
                    await syncAllExportPortalData();
                    renderAdminExportSpecsManager(container);
                } catch (err) {
                    alert('خطأ أثناء الحذف: ' + err.message);
                }
            });
        });
    }
}

// --- 11.ب إعدادات بوابة التصدير وحاسبة الحاويات ---
function renderAdminExportSettingsManager(container) {
    const cfg = exportSettingsCache;
    container.innerHTML = `
        <form id="adminExpSettingsForm" style="background:#f8faf9; padding:14px; border-radius:12px; border:1px solid #d1e3da;">
            <h4 style="color:var(--primary); margin-bottom:12px;"><i class="fa-solid fa-sliders"></i> إعدادات العرض، التواصل، وسعر الصرف في بوابة التصدير</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                <div class="input-group">
                    <label>حالة ظهور بوابة التصدير للعملاء</label>
                    <select id="cfgExpEnabled">
                        <option value="true" ${cfg.enabled !== false ? 'selected' : ''}>مفعّلة وتظهر في القائمة</option>
                        <option value="false" ${cfg.enabled === false ? 'selected' : ''}>مخفية مؤقتاً</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>سعر صرف الدولار الافتراضي (ج.م)</label>
                    <input type="number" id="cfgExpUsdRate" step="0.1" min="1" value="${Number(cfg.defaultUsdRate || 50.5)}" required>
                </div>
                <div class="input-group">
                    <label>سعة حاوية 20 قدم (طن)</label>
                    <input type="number" id="cfgExpCap20" min="1" value="${Number(cfg.cap20ft || 24)}" required>
                </div>
                <div class="input-group">
                    <label>سعة حاوية 40 قدم HC (طن)</label>
                    <input type="number" id="cfgExpCap40" min="1" value="${Number(cfg.cap40hc || 27)}" required>
                </div>
                <div class="input-group">
                    <label>رقم واتساب التصدير (بالكود الدولي بدون +)</label>
                    <input type="text" id="cfgExpWaPhone" value="${escapeHtml(cfg.waPhone || '201114099799')}" required>
                </div>
                <div class="input-group">
                    <label>رقم الاتصال المباشر للتصدير</label>
                    <input type="text" id="cfgExpDirectPhone" value="${escapeHtml(cfg.directPhone || '+201114099799')}" required>
                </div>
                <div class="input-group">
                    <label>عنوان البوابة الرئيسي (عربي)</label>
                    <input type="text" id="cfgExpTitleAr" value="${escapeHtml(cfg.heroTitleAr)}" required>
                </div>
                <div class="input-group">
                    <label>عنوان البوابة الرئيسي (إنجليزي)</label>
                    <input type="text" id="cfgExpTitleEn" value="${escapeHtml(cfg.heroTitleEn)}" required>
                </div>
                <div class="input-group">
                    <label>شريط الموانئ المعتمدة (عربي)</label>
                    <input type="text" id="cfgExpPortsAr" value="${escapeHtml(cfg.portsBannerAr)}" required>
                </div>
                <div class="input-group">
                    <label>شريط الموانئ المعتمدة (إنجليزي)</label>
                    <input type="text" id="cfgExpPortsEn" value="${escapeHtml(cfg.portsBannerEn)}" required>
                </div>
            </div>
            <div class="input-group">
                <label>الوصف التعريفي لبوابة التصدير (عربي)</label>
                <textarea id="cfgExpDescAr" rows="2" style="width:100%; padding:8px; border-radius:8px; border:1px solid #ccc;" required>${escapeHtml(cfg.heroDescAr)}</textarea>
            </div>
            <div class="input-group">
                <label>الوصف التعريفي لبوابة التصدير (إنجليزي)</label>
                <textarea id="cfgExpDescEn" rows="2" style="width:100%; padding:8px; border-radius:8px; border:1px solid #ccc;" required>${escapeHtml(cfg.heroDescEn)}</textarea>
            </div>
            <button type="submit" class="btn-submit" style="margin-top:6px;">
                <i class="fa-solid fa-floppy-disk"></i> حفظ وتطبيق إعدادات بوابة التصدير
            </button>
        </form>
    `;

    document.getElementById('adminExpSettingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedSettings = {
            enabled: document.getElementById('cfgExpEnabled').value === 'true',
            defaultUsdRate: Number(document.getElementById('cfgExpUsdRate').value) || 50.5,
            cap20ft: Number(document.getElementById('cfgExpCap20').value) || 24,
            cap40hc: Number(document.getElementById('cfgExpCap40').value) || 27,
            waPhone: document.getElementById('cfgExpWaPhone').value.trim(),
            directPhone: document.getElementById('cfgExpDirectPhone').value.trim(),
            heroTitleAr: document.getElementById('cfgExpTitleAr').value.trim(),
            heroTitleEn: document.getElementById('cfgExpTitleEn').value.trim(),
            portsBannerAr: document.getElementById('cfgExpPortsAr').value.trim(),
            portsBannerEn: document.getElementById('cfgExpPortsEn').value.trim(),
            heroDescAr: document.getElementById('cfgExpDescAr').value.trim(),
            heroDescEn: document.getElementById('cfgExpDescEn').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            await setDoc(doc(db, "export_settings", "general"), updatedSettings, { merge: true });
            exportSettingsCache = { ...DEFAULT_EXPORT_SETTINGS, ...updatedSettings };
            applyExportSettingsToGlobalUI();
            renderExportHubContent();
            alert('تم حفظ وتحديث إعدادات بوابة التصدير بنجاح!');
        } catch (err) {
            alert('حدث خطأ أثناء حفظ الإعدادات: ' + err.message);
        }
    });
}

// --- 11.ج إدارة مستندات وشهادات التصدير ---
function renderAdminExportDocsManager(container) {
    container.innerHTML = `
        <div style="background:#f8faf9; padding:14px; border-radius:12px; border:1px solid #d1e3da; margin-bottom:16px;">
            <h4 id="adminExpDocHeading" style="color:var(--primary); margin-bottom:10px;"><i class="fa-solid fa-folder-plus"></i> إضافة أو تعديل مستند / شهادة تصدير</h4>
            <form id="adminExpDocForm">
                <input type="hidden" id="adminExpDocId" value="">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
                    <div class="input-group">
                        <label>كود الشهادة / المستند *</label>
                        <input type="text" id="adminExpDocCode" placeholder="مثال: CO / GAFTA / EUR.1" required>
                    </div>
                    <div class="input-group">
                        <label>أيقونة FontAwesome</label>
                        <input type="text" id="adminExpDocIcon" value="fa-file-shield" placeholder="fa-earth-africa">
                    </div>
                    <div class="input-group">
                        <label>عنوان المستند (عربي) *</label>
                        <input type="text" id="adminExpDocTitleAr" placeholder="مثال: شهادة المنشأ المعتمدة" required>
                    </div>
                    <div class="input-group">
                        <label>عنوان المستند (إنجليزي)</label>
                        <input type="text" id="adminExpDocTitleEn" placeholder="Example: Certified Certificate of Origin">
                    </div>
                </div>
                <div class="input-group">
                    <label>الوصف والتفاصيل (عربي) *</label>
                    <input type="text" id="adminExpDocDescAr" placeholder="شرح أهمية المستند للمستورد والتخليص الجمركي" required>
                </div>
                <div class="input-group">
                    <label>الوصف والتفاصيل (إنجليزي)</label>
                    <input type="text" id="adminExpDocDescEn" placeholder="English description of the export certificate">
                </div>
                <div style="display:flex; gap:8px;">
                    <button type="submit" id="adminExpDocSaveBtn" class="btn-submit" style="flex:1;">
                        <i class="fa-solid fa-floppy-disk"></i> حفظ المستند في بوابة التصدير
                    </button>
                    <button type="button" id="adminExpDocCancelBtn" class="btn-submit" style="width:auto; background:#64748b; display:none;">إلغاء</button>
                </div>
            </form>
        </div>

        <h4 style="color:var(--primary); margin-bottom:10px;">المستندات والشهادات المعروضة حالياً (${exportDocsCache.length})</h4>
        <div id="adminExpDocsListContainer" class="data-list"></div>
    `;

    const resetDocForm = () => {
        document.getElementById('adminExpDocId').value = '';
        document.getElementById('adminExpDocForm').reset();
        document.getElementById('adminExpDocIcon').value = 'fa-file-shield';
        document.getElementById('adminExpDocHeading').innerHTML = '<i class="fa-solid fa-folder-plus"></i> إضافة أو تعديل مستند / شهادة تصدير';
        document.getElementById('adminExpDocSaveBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ المستند في بوابة التصدير';
        document.getElementById('adminExpDocCancelBtn').style.display = 'none';
    };

    document.getElementById('adminExpDocCancelBtn')?.addEventListener('click', resetDocForm);

    document.getElementById('adminExpDocForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('adminExpDocId').value.trim();
        const payload = {
            code: document.getElementById('adminExpDocCode').value.trim(),
            icon: document.getElementById('adminExpDocIcon').value.trim() || 'fa-file-shield',
            titleAr: document.getElementById('adminExpDocTitleAr').value.trim(),
            titleEn: document.getElementById('adminExpDocTitleEn').value.trim() || document.getElementById('adminExpDocTitleAr').value.trim(),
            descAr: document.getElementById('adminExpDocDescAr').value.trim(),
            descEn: document.getElementById('adminExpDocDescEn').value.trim() || document.getElementById('adminExpDocDescAr').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (!exportDocsFromDb) {
                for (const defDoc of DEFAULT_EXPORT_DOCS) {
                    if (defDoc.id === editId) continue;
                    const { id, ...cleanDoc } = defDoc;
                    await addDoc(collection(db, "export_docs"), { ...cleanDoc, updatedAt: new Date().toISOString() });
                }
                await addDoc(collection(db, "export_docs"), payload);
            } else if (editId) {
                await updateDoc(doc(db, "export_docs", editId), payload);
            } else {
                await addDoc(collection(db, "export_docs"), payload);
            }
            alert('تم حفظ المستند التصديري بنجاح!');
            resetDocForm();
            await syncAllExportPortalData();
            renderAdminExportDocsManager(container);
        } catch (err) {
            alert('خطأ أثناء الحفظ: ' + err.message);
        }
    });

    const listEl = document.getElementById('adminExpDocsListContainer');
    if (listEl) {
        listEl.innerHTML = exportDocsCache.map(d => `
            <div class="data-item" style="border-right: 4px solid var(--accent);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                    <div>
                        <span class="export-hs-tag">${escapeHtml(d.code)}</span>
                        <strong style="color:var(--primary); margin-right:6px;">${escapeHtml(d.titleAr)}</strong>
                        <p style="font-size:0.82rem; color:#555; margin-top:4px;">${escapeHtml(d.descAr)}</p>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="btn-edit-exp-doc" data-id="${escapeHtml(d.id)}" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">تعديل</button>
                        <button type="button" class="btn-del-exp-doc" data-id="${escapeHtml(d.id)}" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">حذف</button>
                    </div>
                </div>
            </div>
        `).join('');

        listEl.querySelectorAll('.btn-edit-exp-doc').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = exportDocsCache.find(x => x.id === btn.dataset.id);
                if (!item) return;
                document.getElementById('adminExpDocId').value = item.id;
                document.getElementById('adminExpDocCode').value = item.code || '';
                document.getElementById('adminExpDocIcon').value = item.icon || 'fa-file-shield';
                document.getElementById('adminExpDocTitleAr').value = item.titleAr || '';
                document.getElementById('adminExpDocTitleEn').value = item.titleEn || '';
                document.getElementById('adminExpDocDescAr').value = item.descAr || '';
                document.getElementById('adminExpDocDescEn').value = item.descEn || '';
                document.getElementById('adminExpDocHeading').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل المستند: ${escapeHtml(item.code)}`;
                document.getElementById('adminExpDocSaveBtn').innerHTML = '<i class="fa-solid fa-check"></i> حفظ التعديلات';
                document.getElementById('adminExpDocCancelBtn').style.display = 'inline-block';
            });
        });

        listEl.querySelectorAll('.btn-del-exp-doc').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('هل تريد حذف هذا المستند من قائمة التصدير؟')) return;
                const delId = btn.dataset.id;
                try {
                    if (!exportDocsFromDb) {
                        for (const defDoc of DEFAULT_EXPORT_DOCS) {
                            if (defDoc.id === delId) continue;
                            const { id, ...cleanDoc } = defDoc;
                            await addDoc(collection(db, "export_docs"), { ...cleanDoc, updatedAt: new Date().toISOString() });
                        }
                    } else {
                        await deleteDoc(doc(db, "export_docs", delId));
                    }
                    alert('تم حذف المستند بنجاح!');
                    await syncAllExportPortalData();
                    renderAdminExportDocsManager(container);
                } catch (err) {
                    alert('خطأ أثناء الحذف: ' + err.message);
                }
            });
        });
    }
}

// --- 11.د إدارة شحنات التصدير والحاويات والفواتير المبدئية ---
async function loadAdminExportProList() {
    const list = document.getElementById('adminExportProList');
    if (!list) return;
    list.innerHTML = '<p style="color:#888;">جاري تحميل ملفات التصدير...</p>';

    try {
        const snap = await getDocs(query(collection(db, "rfq_orders"), limit(60)));
        exportRfqsCache = [];
        snap.forEach(d => exportRfqsCache.push({ id: d.id, ...d.data() }));

        if (exportRfqsCache.length === 0) {
            list.innerHTML = '<p style="color:#888;">لا توجد ملفات تصدير مسجلة حالياً.</p>';
            return;
        }

        list.innerHTML = exportRfqsCache.map(r => {
            const safeId = escapeHtml(r.id);
            const currentStep = Number(r.exportStageStep || 1);
            const stageOptions = EXPORT_SHIPMENT_STAGES.map(st =>
                `<option value="${st.step}" ${st.step === currentStep ? 'selected' : ''}>${st.step}. ${st.ar}</option>`
            ).join('');

            return `
                <div class="data-item" style="border-right: 4px solid var(--accent);">
                    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                        <div>
                            <strong style="color:var(--primary);"><i class="fa-solid fa-building"></i> ${escapeHtml(r.companyName)}</strong>
                            <span style="font-size:0.78rem; color:#666;">(#${safeId.slice(0, 6)})</span><br>
                            <small>الصنف: <strong>${escapeHtml(r.productTitle)}</strong> | الكمية: <strong>${escapeHtml(r.quantity)}</strong> | الوجهة: <strong>${escapeHtml(r.destination)}</strong></small>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button type="button" class="btn-proforma-inv" data-id="${safeId}" style="background:var(--primary); color:var(--accent); border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:800; font-size:0.82rem;">
                                <i class="fa-solid fa-file-invoice-dollar"></i> إصدار Proforma Invoice ($)
                            </button>
                            <button type="button" class="btn-del-exp-rfq" data-id="${safeId}" style="background:#dc2626; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;" title="حذف الطلب">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap:8px; background:#f8faf9; padding:10px; border-radius:8px;">
                        <div>
                            <label style="font-size:0.75rem; font-weight:bold;">مرحلة الشحنة:</label>
                            <select id="expStage_${safeId}" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:0.82rem !important;">${stageOptions}</select>
                        </div>
                        <div>
                            <label style="font-size:0.75rem; font-weight:bold;">رقم الحاوية / B/L:</label>
                            <input type="text" id="expCont_${safeId}" value="${escapeHtml(r.containerNo || '')}" placeholder="MSCU1234567" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:0.82rem !important;">
                        </div>
                        <div>
                            <label style="font-size:0.75rem; font-weight:bold;">اسم الباخرة:</label>
                            <input type="text" id="expVessel_${safeId}" value="${escapeHtml(r.vesselName || '')}" placeholder="MSC / Maersk" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:0.82rem !important;">
                        </div>
                        <div>
                            <label style="font-size:0.75rem; font-weight:bold;">سعر الطن المعتمد ($):</label>
                            <input type="number" id="expUsdPrice_${safeId}" value="${Number(r.quotedUsdPerTon || 0) || ''}" placeholder="450" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:0.82rem !important;">
                        </div>
                    </div>
                    <button type="button" class="btn-save-exp-meta" data-id="${safeId}" style="margin-top:8px; background:#234d39; color:#fff; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.82rem;">
                        <i class="fa-solid fa-floppy-disk"></i> حفظ تحديثات الشحنة والتسعير
                    </button>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.btn-save-exp-meta').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const step = Number(document.getElementById(`expStage_${id}`)?.value || 1);
                const containerNo = document.getElementById(`expCont_${id}`)?.value.trim() || '';
                const vesselName = document.getElementById(`expVessel_${id}`)?.value.trim() || '';
                const quotedUsdPerTon = Number(document.getElementById(`expUsdPrice_${id}`)?.value || 0);
                const stageObj = EXPORT_SHIPMENT_STAGES.find(s => s.step === step);

                try {
                    await updateDoc(doc(db, "rfq_orders", id), {
                        exportStageStep: step,
                        status: stageObj ? stageObj.ar : 'قيد التجهيز',
                        containerNo,
                        vesselName,
                        quotedUsdPerTon,
                        updatedAt: new Date().toISOString()
                    });
                    alert('تم حفظ تحديثات شحنة التصدير بنجاح!');
                    loadAdminExportProList();
                } catch (e) {
                    alert('خطأ أثناء التحديث: ' + e.message);
                }
            });
        });

        list.querySelectorAll('.btn-del-exp-rfq').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('هل تريد حذف طلب التصدير هذا نهائياً؟')) return;
                try {
                    await deleteDoc(doc(db, "rfq_orders", btn.dataset.id));
                    alert('تم حذف الطلب بنجاح!');
                    loadAdminExportProList();
                } catch (e) {
                    alert('خطأ أثناء الحذف: ' + e.message);
                }
            });
        });

        list.querySelectorAll('.btn-proforma-inv').forEach(btn => {
            btn.addEventListener('click', () => {
                const rfq = exportRfqsCache.find(x => x.id === btn.dataset.id);
                if (rfq) openExportProformaInvoice(rfq);
            });
        });
    } catch (err) {
        list.innerHTML = `<p style="color:#dc2626;">${escapeHtml(err.message)}</p>`;
    }
}

function openExportProformaInvoice(rfq) {
    const modal = document.getElementById('invoiceModal');
    const content = document.getElementById('printableInvoiceContent');
    if (!modal || !content) return;

    const qtyNum = parseFloat(rfq.quantity) || 24;
    const unitUsd = Number(rfq.quotedUsdPerTon || 420);
    const totalUsd = qtyNum * unitUsd;

    content.innerHTML = `
        <div id="invoiceCanvasArea" style="background:#fff; padding:18px; direction:ltr; text-align:left; font-family:'Cairo', sans-serif; border:2px solid #173627;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #d4af37; padding-bottom:10px; margin-bottom:12px;">
                <div>
                    <h2 style="color:#173627; margin:0; font-size:1.25rem;">AL-EKHLAS FEED & GRAINS EST.</h2>
                    <span style="font-size:0.78rem; color:#555;">International Export Division — Giza, Egypt</span>
                </div>
                <div style="text-align:right;">
                    <strong style="background:#173627; color:#d4af37; padding:4px 10px; border-radius:6px; font-size:0.85rem;">PROFORMA INVOICE</strong>
                    <div style="font-size:0.78rem; color:#666; margin-top:4px;">Ref: PI-${escapeHtml(rfq.id.slice(0, 6).toUpperCase())}</div>
                </div>
            </div>
            <div style="font-size:0.84rem; margin-bottom:12px; line-height:1.6;">
                <div><strong>Importer / Buyer:</strong> ${escapeHtml(rfq.companyName)}</div>
                <div><strong>Destination Port:</strong> ${escapeHtml(rfq.destination)} | <strong>Incoterm:</strong> ${escapeHtml(rfq.incoterm || 'FOB')}</div>
                <div><strong>Contact Phone:</strong> ${escapeHtml(rfq.phone)} | <strong>Date:</strong> ${escapeHtml(rfq.date || new Date().toLocaleDateString('en-GB'))}</div>
                ${rfq.containerNo ? `<div><strong>Container / B/L:</strong> ${escapeHtml(rfq.containerNo)} ${rfq.vesselName ? `| <strong>Vessel:</strong> ${escapeHtml(rfq.vesselName)}` : ''}</div>` : ''}
            </div>
            <table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:0.85rem;">
                <tr style="background:#173627; color:#fff;">
                    <th style="padding:8px; border:1px solid #ddd;">Commodity Description</th>
                    <th style="padding:8px; border:1px solid #ddd;">Qty (MT)</th>
                    <th style="padding:8px; border:1px solid #ddd;">Unit Price (USD)</th>
                    <th style="padding:8px; border:1px solid #ddd;">Total (USD)</th>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;">${escapeHtml(rfq.productTitle)}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${qtyNum} MT</td>
                    <td style="padding:8px; border:1px solid #ddd;">$${unitUsd.toLocaleString()}</td>
                    <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">$${totalUsd.toLocaleString()}</td>
                </tr>
            </table>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px dashed #ccc;">
                <span style="font-size:0.78rem; color:#555;">Included Docs: CO (GAFTA/EUR.1), Phytosanitary, COA, Packing List</span>
                <strong style="font-size:1.1rem; color:#173627;">TOTAL (${escapeHtml(rfq.incoterm || 'FOB')}): $${totalUsd.toLocaleString()} USD</strong>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    const closeBtn = document.getElementById('closeInvoiceModalBtn');
    const saveImgBtn = document.getElementById('saveInvoiceImgBtn');
    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
    if (saveImgBtn) {
        saveImgBtn.onclick = () => {
            const printBtn = document.getElementById('printInvoiceBtn');
            if (printBtn) printBtn.click();
        };
    }
}

// ==========================================
// 12. الربط مع أحداث التطبيق وتبديل اللغة والأقسام
// ==========================================
function hookIntoAppLifecycle() {
    if (typeof window.applyAppLanguage === 'function' && !window.applyAppLanguage._exportHooked) {
        const origApplyLang = window.applyAppLanguage;
        window.applyAppLanguage = function(lang) {
            origApplyLang(lang);
            updateExportDrawerButtonText();
            renderExportHubContent();
        };
        window.applyAppLanguage._exportHooked = true;
    }

    if (typeof window.renderProducts === 'function' && !window.renderProducts._exportHooked) {
        const origRenderProducts = window.renderProducts;
        window.renderProducts = function(category, searchTerm) {
            origRenderProducts(category, searchTerm);
            const banner = document.getElementById('exportCategoryQuickBanner');
            if (banner) {
                const isExp = category === 'export_feed' || category === 'export';
                banner.style.display = isExp ? 'flex' : 'none';
            }
        };
        window.renderProducts._exportHooked = true;
    }

    if (typeof window.switchAdminTab === 'function' && !window.switchAdminTab._exportHooked) {
        const origSwitchAdmin = window.switchAdminTab;
        window.switchAdminTab = function(tabName) {
            origSwitchAdmin(tabName);
            const manageBtn = document.getElementById('tabExportPortalManageBtn');
            if (manageBtn && tabName !== 'export_rfq') {
                manageBtn.classList.remove('active');
            }
            if (tabName === 'export_rfq') {
                enhanceAdminExportPanel();
            }
        };
        window.switchAdminTab._exportHooked = true;
    }
}

onAuthStateChanged(auth, (user) => {
    exportCurrentUser = user || null;
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injectExportHubUI();
        hookIntoAppLifecycle();
    });
} else {
    injectExportHubUI();
    hookIntoAppLifecycle();
}
