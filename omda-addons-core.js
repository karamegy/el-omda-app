/**
 * ============================================================================
 * ملف النواة المنفصل للإضافات المتقدمة - منصة العمدة / مؤسسة الإخلاص
 * File: omda-addons-core.js
 * المميزات المدمجة:
 * 1. خريطة تتبع الشحنة الحية للعميل + دمج مواقع العملاء في خريطة الإدارة.
 * 2. نظام التسعير المتدرج للجملة (قطاعي / طن) + كوبونات الخصم الترويجية.
 * 3. حاسبة تركيب العليقة وموازنة البروتين (Ration Mixer) المرتبطة بالبورصة الحية.
 * 4. إعادة الطلب بنقرة واحدة (One-Click Reorder) + تنبيه موعد نفاد العلف.
 * 5. فلترة وبحث وتصدير تقارير الطلبات والمحاسبة والآجل كصورة (PNG) و PDF بمقاسي A4 و A5 (scale: 2).
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc,
    deleteDoc, updateDoc, query, where, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// مشاركة نفس تطبيق Firebase المثبت مسبقاً
const firebaseConfig = {
    apiKey: "AIzaSyCU--Klxwfg7pDinUgS0UEde9cpmmsrDRM",
    authDomain: "omda-a750f.firebaseapp.com",
    projectId: "omda-a750f",
    storageBucket: "omda-a750f.firebasestorage.app",
    messagingSenderId: "1078714497381",
    appId: "1:1078714497381:android:9430672b84226b0a46898c"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 1. أدوات مساعدة عامة وحماية النصوص والترجمة
// ==========================================
let coreUser = null;
let coreProductsMap = {};
let coreMarketPrices = [];
let activeCoupon = null;
let lastCartDiscountSummary = { subtotal: 0, wholesaleSavings: 0, couponDiscount: 0, netTotal: 0 };
const capturedMaps = {};

function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isEn() {
    return (document.documentElement.lang || localStorage.getItem('omda_lang') || 'ar') === 'en';
}

function tr(ar, en) {
    return isEn() ? en : ar;
}

function getCartArray() {
    try {
        const raw = JSON.parse(localStorage.getItem('omda_cart') || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch (_) {
        return [];
    }
}

// حقن التنسيقات الخاصة بالنواة المنفصلة تلقائياً دون لمس style.css
function injectAddonStyles() {
    if (document.getElementById('omda-addons-core-styles')) return;
    const style = document.createElement('style');
    style.id = 'omda-addons-core-styles';
    style.textContent = `
        .addon-card {
            background: #ffffff;
            border-radius: 14px;
            padding: 16px;
            border: 1px solid #e2ece7;
            box-shadow: 0 4px 14px rgba(0,0,0,0.05);
            margin-top: 16px;
        }
        .addon-badge-wholesale {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
            padding: 3px 9px;
            border-radius: 20px;
            font-size: 0.76rem;
            font-weight: 800;
        }
        .addon-coupon-box {
            display: flex;
            gap: 8px;
            margin-top: 10px;
            align-items: center;
        }
        .addon-coupon-box input {
            flex: 1;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px dashed #173627;
            background: #fff;
            text-transform: uppercase;
        }
        .addon-coupon-btn {
            background: #d4af37;
            color: #10271c;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
        }
        .addon-toolbar {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            background: #ffffff;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            margin-bottom: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .addon-toolbar input, .addon-toolbar select {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            flex: 1;
            min-width: 150px;
        }
        .addon-excel-btn {
            background: #15803d;
            color: #ffffff;
            border: none;
            padding: 9px 14px;
            border-radius: 8px;
            font-weight: 800;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.84rem;
            white-space: nowrap;
        }
        .addon-excel-btn:hover { filter: brightness(1.08); }
        .addon-excel-btn:disabled { opacity: 0.65; cursor: wait; }
        .addon-reorder-btn {
            background: #d4af37;
            color: #10271c;
            border: none;
            padding: 5px 11px;
            border-radius: 5px;
            font-weight: 800;
            cursor: pointer;
            margin-inline-start: 6px;
            margin-top: 5px;
            font-size: 0.82rem;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .addon-reminder-banner {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border: 1.5px solid #d4af37;
            border-radius: 12px;
            padding: 14px;
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .ration-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin-top: 12px;
        }
        .ration-item-pill {
            background: #f8faf9;
            border: 1px solid #d1fae5;
            border-radius: 10px;
            padding: 10px;
            text-align: center;
        }
        #customerLiveTrackMap {
            width: 100%;
            height: 230px;
            border-radius: 10px;
            margin-top: 10px;
            border: 1.5px solid #173627;
            z-index: 1;
        }
        .addon-report-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(16, 39, 28, 0.75);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
            backdrop-filter: blur(3px);
        }
        .addon-report-modal {
            background: #ffffff;
            width: 100%;
            max-width: 820px;
            max-height: 92vh;
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 50px rgba(0,0,0,0.35);
            border-top: 4px solid #d4af37;
        }
        .addon-report-head {
            background: #173627;
            color: #ffffff;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .addon-report-controls {
            background: #f0f7f4;
            padding: 10px 14px;
            border-bottom: 1px solid #d1fae5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }
        .addon-size-toggle {
            display: inline-flex;
            background: #e2e8f0;
            border-radius: 8px;
            padding: 3px;
            gap: 4px;
        }
        .addon-size-toggle button {
            border: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 0.82rem;
            cursor: pointer;
            background: transparent;
            color: #334155;
        }
        .addon-size-toggle button.active {
            background: #173627;
            color: #d4af37;
        }
        .addon-report-scroll {
            padding: 14px;
            overflow: auto;
            flex: 1;
            background: #e5e7eb;
            display: flex;
            justify-content: center;
        }
        .addon-report-sheet {
            background: #ffffff;
            color: #111827;
            padding: 18px;
            border: 1.5px solid #173627;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            direction: rtl;
            text-align: right;
            font-family: 'Cairo', sans-serif;
            box-sizing: border-box;
        }
        .addon-report-sheet.size-a4 {
            width: 794px;
            min-width: 794px;
        }
        .addon-report-sheet.size-a5 {
            width: 559px;
            min-width: 559px;
        }
        .addon-report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 0.78rem;
        }
        .addon-report-table th {
            background: #173627;
            color: #ffffff;
            padding: 7px 6px;
            border: 1px solid #173627;
            text-align: right;
        }
        .addon-report-table td {
            padding: 6px;
            border: 1px solid #cbd5e1;
            word-break: break-word;
        }
        .addon-report-table tr:nth-child(even) td {
            background: #f8fafc;
        }
        .addon-report-foot {
            padding: 10px 14px;
            background: #f8faf9;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 2. التقاط خرائط Leaflet تلقائياً بدون تعديل app.js
// ==========================================
function registerLeafletHook() {
    const attach = () => {
        if (typeof window.L === 'undefined' || window.__omdaLeafletHooked) return;
        window.__omdaLeafletHooked = true;
        window.L.Map.addInitHook(function () {
            const id = this._container && this._container.id;
            if (id) capturedMaps[id] = this;
            if (id === 'adminMap') {
                setTimeout(() => plotActiveCustomersOnAdminMap(this), 600);
            }
        });
    };
    attach();
    const interval = setInterval(() => {
        if (typeof window.L !== 'undefined') {
            attach();
            clearInterval(interval);
        }
    }, 300);
}

function calcDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ==========================================
// الإضافة 1: خريطة تتبع الشحنة الحية للعميل + دمج مواقع العملاء في خريطة الإدارة
// ==========================================
function initLiveShipmentTrackingAddon() {
    const trackBox = document.getElementById('trackResultBox');
    if (!trackBox) return;

    let lastRenderedOrderId = '';

    const observer = new MutationObserver(async () => {
        const btn = trackBox.querySelector('button[onclick^="previewInvoice"]');
        if (!btn) return;
        const match = btn.getAttribute('onclick')?.match(/previewInvoice\(['"]([^'"]+)['"]\)/);
        const orderId = match ? match[1] : '';
        if (!orderId || orderId === lastRenderedOrderId || trackBox.querySelector('#customerLiveTrackWrapper')) return;

        lastRenderedOrderId = orderId;
        await renderCustomerLiveTrackingMap(trackBox, orderId);
    });

    observer.observe(trackBox, { childList: true, subtree: true });

    // دمج دبابيس العملاء في خريطة الإدارة عند فتح تبويب الخريطة أو تحديثها
    document.getElementById('tabMapBtn')?.addEventListener('click', () => {
        setTimeout(() => {
            if (capturedMaps['adminMap']) plotActiveCustomersOnAdminMap(capturedMaps['adminMap']);
        }, 700);
    });
    document.getElementById('refreshAdminMapBtn')?.addEventListener('click', () => {
        setTimeout(() => {
            if (capturedMaps['adminMap']) plotActiveCustomersOnAdminMap(capturedMaps['adminMap']);
        }, 700);
    });
}

async function renderCustomerLiveTrackingMap(container, orderId) {
    try {
        const orderSnap = await getDoc(doc(db, "orders", orderId));
        if (!orderSnap.exists()) return;
        const order = orderSnap.data();

        const destLat = typeof order.lat === 'number' ? order.lat : 30.0444;
        const destLng = typeof order.lng === 'number' ? order.lng : 31.2357;

        let vehLat = null;
        let vehLng = null;
        let driverName = order.assignedDriver || '';

        if (order.assignedVehicle && order.assignedVehicle !== 'غير محدد') {
            const vSnap = await getDocs(query(collection(db, "vehicles"), where("plate", "==", order.assignedVehicle), limit(1)));
            vSnap.forEach(d => {
                const v = d.data();
                if (typeof v.lat === 'number' && typeof v.lng === 'number') {
                    vehLat = v.lat;
                    vehLng = v.lng;
                }
                if (v.driver) driverName = v.driver;
            });
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'customerLiveTrackWrapper';
        wrapper.style.marginTop = '12px';

        let distHtml = '';
        if (vehLat !== null && vehLng !== null) {
            const km = calcDistanceKm(vehLat, vehLng, destLat, destLng);
            const etaMins = Math.max(5, Math.round((km / 45) * 60));
            distHtml = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; background:#173627; color:#fff; padding:8px 12px; border-radius:8px; font-size:0.84rem;">
                    <span><i class="fa-solid fa-route" style="color:#d4af37;"></i> ${tr('المسافة المتبقية:', 'Remaining Distance:')} <strong>${km.toFixed(1)} ${tr('كم', 'km')}</strong></span>
                    <span><i class="fa-solid fa-clock" style="color:#d4af37;"></i> ${tr('الوصول التقديري:', 'Est. Arrival:')} <strong>~${etaMins} ${tr('دقيقة', 'mins')}</strong></span>
                </div>`;
        } else {
            distHtml = `
                <div style="background:#fffbeb; color:#92400e; border:1px solid #fcd34d; padding:8px 12px; border-radius:8px; font-size:0.82rem;">
                    <i class="fa-solid fa-circle-info"></i> ${tr('بانتظار بدء تحرك السيارة وتحديث إحداثيات GPS الخاصة بالسائق.', 'Waiting for vehicle dispatch and live GPS signal.')}
                </div>`;
        }

        wrapper.innerHTML = `${distHtml}<div id="customerLiveTrackMap"></div>`;
        container.appendChild(wrapper);

        if (typeof window.L === 'undefined') return;
        const map = window.L.map('customerLiveTrackMap', { center: [destLat, destLng], zoom: 12 });
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

        const farmIcon = window.L.divIcon({
            className: 'addon-farm-pin',
            html: `<div style="background:#173627; color:#d4af37; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.35);"><i class="fa-solid fa-warehouse"></i></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        const farmMarker = window.L.marker([destLat, destLng], { icon: farmIcon })
            .addTo(map)
            .bindPopup(tr('موقع تسليم المزرعة / العميل', 'Customer / Farm Delivery Location'));

        const points = [[destLat, destLng]];

        if (vehLat !== null && vehLng !== null) {
            const truckIcon = window.L.divIcon({
                className: 'addon-truck-pin',
                html: `<div style="background:#dc2626; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4);"><i class="fa-solid fa-truck-fast"></i></div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 34]
            });

            window.L.marker([vehLat, vehLng], { icon: truckIcon })
                .addTo(map)
                .bindPopup(`<b>${tr('سيارة التوصيل:', 'Delivery Truck:')}</b> ${esc(order.assignedVehicle)}<br><small>${esc(driverName)}</small>`)
                .openPopup();

            window.L.polyline([[vehLat, vehLng], [destLat, destLng]], {
                color: '#d4af37',
                weight: 4,
                dashArray: '8, 8'
            }).addTo(map);

            points.push([vehLat, vehLng]);
            map.fitBounds(points, { padding: [35, 35] });
        } else {
            farmMarker.openPopup();
        }
    } catch (err) {
        console.warn('تنبيه خريطة التتبع الحية:', err.message);
    }
}

let adminCustomersLayerGroup = null;
async function plotActiveCustomersOnAdminMap(map) {
    if (!map || typeof window.L === 'undefined') return;
    try {
        if (!adminCustomersLayerGroup) {
            adminCustomersLayerGroup = window.L.layerGroup().addTo(map);
        } else {
            adminCustomersLayerGroup.clearLayers();
        }

        const ordersSnap = await getDocs(query(collection(db, "orders"), limit(100)));
        const clientPinIcon = window.L.divIcon({
            className: 'addon-admin-client-pin',
            html: `<div style="background:#0284c7; color:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.35);"><i class="fa-solid fa-location-dot"></i></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        ordersSnap.forEach(d => {
            const o = d.data();
            const isDelivered = (o.status || '').includes('تم التسليم');
            if (!isDelivered && typeof o.lat === 'number' && typeof o.lng === 'number') {
                window.L.marker([o.lat, o.lng], { icon: clientPinIcon })
                    .bindPopup(`
                        <div style="text-align:right; font-family:'Cairo',sans-serif;">
                            <strong style="color:#0284c7;"><i class="fa-solid fa-box"></i> طلب نشط #${esc(d.id.slice(0, 6))}</strong><br>
                            <b>العميل:</b> ${esc(o.userEmail)}<br>
                            <b>الهاتف:</b> ${esc(o.phone || '-')}<br>
                            <b>الإجمالي:</b> ${esc(o.total)} ج.م<br>
                            <b>السيارة:</b> ${esc(o.assignedVehicle || 'غير معينة')}
                        </div>
                    `)
                    .addTo(adminCustomersLayerGroup);
            }
        });
    } catch (e) {
        console.warn('تعذر تحميل مواقع العملاء على خريطة الإدارة:', e.message);
    }
}

// ==========================================
// الإضافة 2: التسعير المتدرج للجملة (قطاعي / طن) + كوبونات الخصم
// ==========================================
async function loadProductsPricingMetadata() {
    try {
        const snap = await getDocs(query(collection(db, "products"), limit(120)));
        coreProductsMap = {};
        snap.forEach(d => {
            coreProductsMap[d.id] = { id: d.id, ...d.data() };
        });
    } catch (_) {}
}

function injectWholesaleFieldInAdminProductForm() {
    const prodPriceInput = document.getElementById('prodPrice');
    const addProductForm = document.getElementById('addProductForm');
    if (!prodPriceInput || !addProductForm || document.getElementById('addonWholesalePrice')) return;

    const group = document.createElement('div');
    group.className = 'input-group';
    group.innerHTML = `
        <label><i class="fa-solid fa-tags" style="color:#15803d;"></i> سعر الجملة للشكارة (للكميات من 20 شكارة / 1 طن فأكثر - اختياري)</label>
        <input type="number" id="addonWholesalePrice" min="0" step="0.01" placeholder="مثال: 1020 (يُخصم الفرق تلقائياً عند طلب طن فأكثر)">
    `;
    prodPriceInput.closest('.input-group')?.insertAdjacentElement('afterend', group);

    // حفظ سعر الجملة عند إضافة أو تعديل المنتج
    addProductForm.addEventListener('submit', () => {
        const wsVal = Number(document.getElementById('addonWholesalePrice')?.value || 0);
        const prodName = document.getElementById('prodName')?.value.trim();
        const editId = document.getElementById('editProductId')?.value.trim();

        setTimeout(async () => {
            try {
                if (editId) {
                    await updateDoc(doc(db, "products", editId), {
                        wholesalePrice: wsVal > 0 ? wsVal : 0,
                        wholesaleMinQty: 20
                    });
                } else if (prodName && wsVal > 0) {
                    const snap = await getDocs(query(collection(db, "products"), where("name", "==", prodName), limit(1)));
                    snap.forEach(async (d) => {
                        await updateDoc(doc(db, "products", d.id), {
                            wholesalePrice: wsVal,
                            wholesaleMinQty: 20
                        });
                    });
                }
                await loadProductsPricingMetadata();
            } catch (_) {}
        }, 1800);
    });
}

function calculateCartWholesaleAndCoupons() {
    const rawCart = getCartArray();
    const grouped = {};
    let subtotal = 0;
    let wholesaleSavings = 0;

    rawCart.forEach(item => {
        const key = item.id || item.name;
        if (!grouped[key]) {
            const meta = item.id ? coreProductsMap[item.id] : null;
            grouped[key] = {
                ...item,
                qty: 0,
                unitPrice: Number(item.price || 0),
                wholesalePrice: meta && Number(meta.wholesalePrice) > 0 ? Number(meta.wholesalePrice) : 0,
                minQty: (meta && Number(meta.wholesaleMinQty)) || 20
            };
        }
        grouped[key].qty += 1;
    });

    Object.values(grouped).forEach(g => {
        const lineNormal = g.unitPrice * g.qty;
        subtotal += lineNormal;
        if (g.qty >= g.minQty) {
            const effectiveWsPrice = (g.wholesalePrice > 0 && g.wholesalePrice < g.unitPrice)
                ? g.wholesalePrice
                : Math.round(g.unitPrice * 0.97);
            wholesaleSavings += Math.max(0, (g.unitPrice - effectiveWsPrice) * g.qty);
        }
    });

    const afterWholesale = Math.max(0, subtotal - wholesaleSavings);
    let couponDiscount = 0;
    if (activeCoupon && afterWholesale >= Number(activeCoupon.minOrder || 0)) {
        if (activeCoupon.type === 'percent') {
            couponDiscount = Math.round(afterWholesale * (Number(activeCoupon.value) / 100));
        } else {
            couponDiscount = Math.min(afterWholesale, Number(activeCoupon.value || 0));
        }
    }

    const netTotal = Math.max(0, afterWholesale - couponDiscount);
    lastCartDiscountSummary = { subtotal, wholesaleSavings, couponDiscount, netTotal };
    return lastCartDiscountSummary;
}

function initCartWholesaleAndCouponsUI() {
    const summaryCard = document.querySelector('#cartModal .cart-summary-card');
    const totalRow = summaryCard?.querySelector('.summary-row.total');
    if (!summaryCard || !totalRow || document.getElementById('addonCartDiscountsArea')) return;

    const discountArea = document.createElement('div');
    discountArea.id = 'addonCartDiscountsArea';
    discountArea.innerHTML = `
        <div id="addonWholesaleRow" class="summary-row" style="display:none; color:#15803d; font-weight:700;">
            <span><i class="fa-solid fa-boxes-stacked"></i> ${tr('خصم الجملة (1 طن / 20 شكارة+):', 'Wholesale Tier Discount (20+ bags):')}</span>
            <strong id="addonWholesaleVal">-0 ${tr('ج.م', 'EGP')}</strong>
        </div>
        <div id="addonCouponRow" class="summary-row" style="display:none; color:#0284c7; font-weight:700;">
            <span><i class="fa-solid fa-ticket"></i> ${tr('خصم الكوبون:', 'Coupon Discount:')} (<span id="addonCouponCodeLabel"></span>)</span>
            <strong id="addonCouponVal">-0 ${tr('ج.م', 'EGP')}</strong>
        </div>
        <div class="addon-coupon-box">
            <input type="text" id="addonCouponInput" placeholder="${tr('كود الخصم (مثال: OMDA10)', 'Promo Code (e.g. OMDA10)')}">
            <button type="button" id="addonApplyCouponBtn" class="addon-coupon-btn">${tr('تطبيق الكود', 'Apply')}</button>
        </div>
        <div id="addonCouponMsg" style="font-size:0.78rem; margin-top:4px;"></div>
    `;
    totalRow.insertAdjacentElement('beforebegin', discountArea);

    const refreshCartTotals = () => {
        const stats = calculateCartWholesaleAndCoupons();
        const wsRow = document.getElementById('addonWholesaleRow');
        const wsVal = document.getElementById('addonWholesaleVal');
        const cpRow = document.getElementById('addonCouponRow');
        const cpVal = document.getElementById('addonCouponVal');
        const cpCodeLabel = document.getElementById('addonCouponCodeLabel');
        const cartTotalSpan = document.getElementById('cartTotalPrice');

        if (wsRow && wsVal) {
            if (stats.wholesaleSavings > 0) {
                wsRow.style.display = 'flex';
                wsVal.textContent = `-${stats.wholesaleSavings.toLocaleString()} ${tr('ج.م', 'EGP')}`;
            } else {
                wsRow.style.display = 'none';
            }
        }

        if (cpRow && cpVal) {
            if (stats.couponDiscount > 0 && activeCoupon) {
                cpRow.style.display = 'flex';
                if (cpCodeLabel) cpCodeLabel.textContent = activeCoupon.code;
                cpVal.textContent = `-${stats.couponDiscount.toLocaleString()} ${tr('ج.م', 'EGP')}`;
            } else {
                cpRow.style.display = 'none';
            }
        }

        if (cartTotalSpan && (stats.wholesaleSavings > 0 || stats.couponDiscount > 0)) {
            cartTotalSpan.textContent = stats.netTotal;
        }
    };

    const cartItemsList = document.getElementById('cartItemsList');
    if (cartItemsList) {
        new MutationObserver(refreshCartTotals).observe(cartItemsList, { childList: true, subtree: true });
    }

    document.getElementById('addonApplyCouponBtn')?.addEventListener('click', async () => {
        const code = (document.getElementById('addonCouponInput')?.value || '').trim().toUpperCase();
        const msgEl = document.getElementById('addonCouponMsg');
        if (!code) return;

        try {
            const snap = await getDocs(query(collection(db, "coupons"), where("code", "==", code), limit(1)));
            let foundCoupon = null;
            snap.forEach(d => {
                const c = d.data();
                if (c.active !== false) foundCoupon = { id: d.id, ...c };
            });

            if (!foundCoupon && (code === 'OMDA10' || code === 'FARM5')) {
                foundCoupon = code === 'OMDA10'
                    ? { code: 'OMDA10', type: 'percent', value: 10, minOrder: 2000 }
                    : { code: 'FARM5', type: 'percent', value: 5, minOrder: 500 };
            }

            if (!foundCoupon) {
                activeCoupon = null;
                if (msgEl) {
                    msgEl.style.color = '#dc2626';
                    msgEl.textContent = tr('كود الخصم غير صالح أو منتهي الصلاحية.', 'Invalid or expired promo code.');
                }
                refreshCartTotals();
                return;
            }

            const currentSub = calculateCartWholesaleAndCoupons().subtotal;
            if (currentSub < Number(foundCoupon.minOrder || 0)) {
                activeCoupon = null;
                if (msgEl) {
                    msgEl.style.color = '#d97706';
                    msgEl.textContent = tr(`الحد الأدنى لتفعيل هذا الكود هو ${foundCoupon.minOrder} ج.م`, `Minimum order for this code is ${foundCoupon.minOrder} EGP`);
                }
                refreshCartTotals();
                return;
            }

            activeCoupon = foundCoupon;
            if (msgEl) {
                msgEl.style.color = '#15803d';
                msgEl.textContent = tr(`تم تفعيل كود الخصم (${foundCoupon.code}) بنجاح!`, `Promo code (${foundCoupon.code}) applied!`);
            }
            refreshCartTotals();
        } catch (err) {
            if (msgEl) {
                msgEl.style.color = '#dc2626';
                msgEl.textContent = err.message;
            }
        }
    });

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn?.addEventListener('click', async (e) => {
        const stats = calculateCartWholesaleAndCoupons();
        if (stats.wholesaleSavings <= 0 && stats.couponDiscount <= 0) return;

        e.stopImmediatePropagation();
        if (checkoutBtn.disabled) return;

        if (!coreUser) {
            alert(tr('الرجاء تسجيل الدخول أولاً لإتمام الطلب', 'Please sign in first to complete your order'));
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.style.display = 'flex';
            return;
        }

        const currentCart = getCartArray();
        if (currentCart.length === 0) return;

        const phoneInput = document.getElementById('checkoutPhoneInput');
        const phoneVal = phoneInput ? phoneInput.value.trim() : '';
        if (!phoneVal || phoneVal.length < 6) {
            alert(tr('الرجاء إدخال رقم هاتف صحيح للتواصل والشحن قبل إتمام الطلب.', 'Please enter a valid contact phone number.'));
            phoneInput?.focus();
            return;
        }

        const paymentType = document.getElementById('paymentTypeSelect')?.value || 'مدفوع (نقدي/إلكتروني)';
        checkoutBtn.disabled = true;

        try {
            await setDoc(doc(db, "users", coreUser.email), { phone: phoneVal }, { merge: true });

            const sanitizedItems = currentCart.map(item => ({
                id: item.id || '',
                name: item.name || '',
                price: Number(item.price || 0)
            })).filter(i => i.price > 0);

            const lat = parseFloat(localStorage.getItem('omda_user_lat')) || 30.0444;
            const lng = parseFloat(localStorage.getItem('omda_user_lng')) || 31.2357;

            const orderRef = await addDoc(collection(db, "orders"), {
                userEmail: coreUser.email,
                phone: phoneVal,
                items: sanitizedItems,
                subtotal: stats.subtotal,
                wholesaleDiscount: stats.wholesaleSavings,
                couponCode: activeCoupon ? activeCoupon.code : '',
                couponDiscount: stats.couponDiscount,
                total: stats.netTotal,
                status: 'قيد المراجعة والشحن',
                paymentType,
                lat,
                lng,
                assignedVehicle: 'غير محدد',
                assignedDriver: 'غير محدد',
                date: new Date().toLocaleDateString('ar-EG'),
                createdAt: new Date().toISOString()
            });

            const uniqueKeys = [...new Set(currentCart.map(i => i.id || i.name))];
            if (typeof window.removeGroupFromCart === 'function') {
                uniqueKeys.forEach(k => window.removeGroupFromCart(k));
            } else {
                localStorage.removeItem('omda_cart');
            }

            activeCoupon = null;
            const cartModal = document.getElementById('cartModal');
            if (cartModal) cartModal.style.display = 'none';

            const savedTotal = stats.wholesaleSavings + stats.couponDiscount;
            alert(tr(
                `تم إصدار الفاتورة #${orderRef.id.slice(0, 6)} بنجاح! الصافي: ${stats.netTotal} ج.م (إجمالي التوفير: ${savedTotal} ج.م)`,
                `Invoice #${orderRef.id.slice(0, 6)} issued! Net Total: ${stats.netTotal} EGP (Saved: ${savedTotal} EGP)`
            ));
        } catch (err) {
            alert(tr('خطأ أثناء إتمام الطلب: ', 'Checkout error: ') + err.message);
        } finally {
            checkoutBtn.disabled = false;
        }
    }, true);
}

// ==========================================
// الإضافة 3: حاسبة تركيب العليقة (Ration Mixer) المرتبطة بالبورصة الحية
// ==========================================
const RATION_FORMULAS = {
    '23': { labelAr: '23% بروتين (بادي تسمين سوبر)', labelEn: '23% Protein (Broiler Starter)', corn: 550, soya: 360, bran: 40, conc: 50 },
    '21': { labelAr: '21% بروتين (نامي تسمين)', labelEn: '21% Protein (Broiler Grower)', corn: 600, soya: 310, bran: 40, conc: 50 },
    '19': { labelAr: '19% بروتين (ناهي تسمين)', labelEn: '19% Protein (Finisher)', corn: 650, soya: 260, bran: 40, conc: 50 },
    '18': { labelAr: '18% بروتين (دواجن بياض إنتاجي)', labelEn: '18% Protein (Layer Production)', corn: 620, soya: 230, bran: 70, conc: 80 },
    '16': { labelAr: '16% بروتين (تسمين عجول وماشية)', labelEn: '16% Protein (Beef Cattle)', corn: 540, soya: 180, bran: 240, conc: 40 },
    '14': { labelAr: '14% بروتين (أبقار وجاموس حلاب)', labelEn: '14% Protein (Dairy Herd)', corn: 480, soya: 140, bran: 340, conc: 40 }
};

async function initRationMixerCard() {
    const calcSection = document.getElementById('feedCalculatorSection');
    if (!calcSection || document.getElementById('addonRationMixerCard')) return;

    try {
        const snap = await getDocs(query(collection(db, "market_prices"), limit(30)));
        coreMarketPrices = [];
        snap.forEach(d => coreMarketPrices.push({ id: d.id, ...d.data() }));
    } catch (_) {}

    const findTonPrice = (keywords, fallback) => {
        const found = coreMarketPrices.find(m =>
            keywords.some(kw => (m.nameAr || '').includes(kw) || (m.nameEn || '').toLowerCase().includes(kw))
        );
        return found && Number(found.price) > 0 ? Number(found.price) : fallback;
    };

    const card = document.createElement('div');
    card.id = 'addonRationMixerCard';
    card.className = 'form-card';
    card.style.marginTop = '22px';
    card.style.borderTop = '4px solid #173627';

    card.innerHTML = `
        <h3><i class="fa-solid fa-scale-unbalanced-flip" style="color:#d4af37;"></i> <span>${tr('حاسبة تركيب العليقة وموازنة البروتين (Ration Mixer)', 'Smart Ration Mixer & Protein Balancer')}</span></h3>
        <p style="font-size:0.84rem; color:#6b7280; margin-bottom:12px;">
            ${tr('احسب النسب الدقيقة للذرة وكسب الصويا والردة والمركزات بالطن والتكلفة الفورية من أسعار البورصة الحية.', 'Compute exact kg ratios of Yellow Corn, Soybean Meal, Bran & Concentrates priced live from daily market rates.')}
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <div class="input-group" style="flex:1; min-width:160px;">
                <label>${tr('نسبة البروتين المستهدفة في الخلطة', 'Target Crude Protein %')}</label>
                <select id="rationProteinTarget">
                    <option value="23">${tr('23% بروتين (بادي تسمين)', '23% Protein (Starter)')}</option>
                    <option value="21" selected>${tr('21% بروتين (نامي تسمين)', '21% Protein (Grower)')}</option>
                    <option value="19">${tr('19% بروتين (ناهي تسمين)', '19% Protein (Finisher)')}</option>
                    <option value="18">${tr('18% بروتين (بياض إنتاجي)', '18% Protein (Layer)')}</option>
                    <option value="16">${tr('16% بروتين (تسمين ماشية)', '16% Protein (Cattle)')}</option>
                    <option value="14">${tr('14% بروتين (ماشية حلاب)', '14% Protein (Dairy)')}</option>
                </select>
            </div>
            <div class="input-group" style="flex:1; min-width:140px;">
                <label>${tr('وزن الخلطة المطلوبة (بالطن)', 'Batch Weight (Tons)')}</label>
                <input type="number" id="rationTonsInput" min="0.5" max="100" step="0.5" value="1">
            </div>
        </div>
        <button type="button" id="runRationMixerBtn" class="btn-submit" style="background:#173627;">
            <i class="fa-solid fa-flask"></i> ${tr('حساب مكونات وتكلفة الخلطة الآن', 'Calculate Ration Mix & Live Cost')}
        </button>
        <div id="rationMixerOutput" style="display:none; margin-top:14px; padding:12px; background:#f0f7f4; border-radius:12px; border:1px dashed #173627;"></div>
    `;

    calcSection.appendChild(card);

    let lastMixOrderItems = [];

    document.getElementById('runRationMixerBtn')?.addEventListener('click', () => {
        const protKey = document.getElementById('rationProteinTarget')?.value || '21';
        const tons = Math.max(0.5, Number(document.getElementById('rationTonsInput')?.value) || 1);
        const formula = RATION_FORMULAS[protKey] || RATION_FORMULAS['21'];

        const cornPriceTon = findTonPrice(['ذرة', 'corn'], 14200);
        const soyaPriceTon = findTonPrice(['صويا', 'soya', 'soybean'], 22800);
        const branPriceTon = findTonPrice(['ردة', 'نخالة', 'bran'], 11500);
        const concPriceTon = findTonPrice(['مركز', 'بريمكس', 'concentrate'], 28000);

        const cornKg = Math.round(formula.corn * tons);
        const soyaKg = Math.round(formula.soya * tons);
        const branKg = Math.round(formula.bran * tons);
        const concKg = Math.round(formula.conc * tons);

        const cornCost = Math.round((cornKg / 1000) * cornPriceTon);
        const soyaCost = Math.round((soyaKg / 1000) * soyaPriceTon);
        const branCost = Math.round((branKg / 1000) * branPriceTon);
        const concCost = Math.round((concKg / 1000) * concPriceTon);
        const totalMixCost = cornCost + soyaCost + branCost + concCost;

        lastMixOrderItems = [
            { id: `mix_corn_${cornKg}`, name: `${tr('ذرة صفراء للخلطة', 'Yellow Corn Mix')} (${cornKg} ${tr('كجم', 'kg')})`, price: cornCost },
            { id: `mix_soya_${soyaKg}`, name: `${tr('كسب صويا 46% للخلطة', 'Soybean Meal Mix')} (${soyaKg} ${tr('كجم', 'kg')})`, price: soyaCost },
            { id: `mix_bran_${branKg}`, name: `${tr('ردة خشنة للخلطة', 'Wheat Bran Mix')} (${branKg} ${tr('كجم', 'kg')})`, price: branCost },
            { id: `mix_conc_${concKg}`, name: `${tr('مركزات وأملاح معدنية', 'Concentrates & Premix')} (${concKg} ${tr('كجم', 'kg')})`, price: concCost }
        ];

        const out = document.getElementById('rationMixerOutput');
        if (!out) return;
        out.style.display = 'block';
        out.innerHTML = `
            <h4 style="color:#173627; margin-bottom:6px;">${tr('تركيب خلطة', 'Formula for')} ${tr(formula.labelAr, formula.labelEn)} — (${tons} ${tr('طن', 'Ton')})</h4>
            <div class="ration-grid">
                <div class="ration-item-pill">
                    <span style="font-size:0.78rem; color:#555;">${tr('ذرة صفراء', 'Yellow Corn')}</span>
                    <strong style="display:block; color:#173627; font-size:1.05rem;">${cornKg} ${tr('كجم', 'kg')}</strong>
                    <small style="color:#15803d;">${cornCost.toLocaleString()} ${tr('ج.م', 'EGP')}</small>
                </div>
                <div class="ration-item-pill">
                    <span style="font-size:0.78rem; color:#555;">${tr('كسب صويا 46%', 'Soybean Meal')}</span>
                    <strong style="display:block; color:#173627; font-size:1.05rem;">${soyaKg} ${tr('كجم', 'kg')}</strong>
                    <small style="color:#15803d;">${soyaCost.toLocaleString()} ${tr('ج.م', 'EGP')}</small>
                </div>
                <div class="ration-item-pill">
                    <span style="font-size:0.78rem; color:#555;">${tr('ردة خشنة', 'Wheat Bran')}</span>
                    <strong style="display:block; color:#173627; font-size:1.05rem;">${branKg} ${tr('كجم', 'kg')}</strong>
                    <small style="color:#15803d;">${branCost.toLocaleString()} ${tr('ج.م', 'EGP')}</small>
                </div>
                <div class="ration-item-pill">
                    <span style="font-size:0.78rem; color:#555;">${tr('مركزات وإضافات', 'Concentrates')}</span>
                    <strong style="display:block; color:#173627; font-size:1.05rem;">${concKg} ${tr('كجم', 'kg')}</strong>
                    <small style="color:#15803d;">${concCost.toLocaleString()} ${tr('ج.م', 'EGP')}</small>
                </div>
            </div>
            <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <strong style="font-size:1.05rem; color:#173627;">${tr('التكلفة الإجمالية للخلطة:', 'Total Mix Cost:')} <span style="color:#d4af37;">${totalMixCost.toLocaleString()} ${tr('ج.م', 'EGP')}</span></strong>
                <button type="button" id="addRationMixToCartBtn" class="btn-submit" style="width:auto; padding:8px 16px; background:#d4af37; color:#10271c;">
                    <i class="fa-solid fa-cart-plus"></i> ${tr('طلب خامات الخلطة دفعة واحدة', 'Add All Mix Materials to Cart')}
                </button>
            </div>
        `;

        document.getElementById('addRationMixToCartBtn')?.addEventListener('click', () => {
            if (typeof window.addToCartDirect === 'function') {
                lastMixOrderItems.forEach(item => window.addToCartDirect(item));
            }
            alert(tr('تمت إضافة خامات الخلطة الأربعة إلى سلة المشتريات بنجاح!', 'All 4 mix ingredients added to your cart!'));
            if (typeof window.openCartModal === 'function') window.openCartModal();
        });
    });
}

// ==========================================
// الإضافة 4: إعادة الطلب بنقرة واحدة (One-Click Reorder) + تنبيه موعد نفاد العلف
// ==========================================
function initReorderAndDepletionAlert() {
    const invoicesList = document.getElementById('userInvoicesList');
    if (!invoicesList) return;

    const enhanceInvoices = async () => {
        const previewBtns = invoicesList.querySelectorAll('button[onclick^="previewInvoice"]');
        previewBtns.forEach(btn => {
            if (btn.parentElement?.querySelector('.addon-reorder-btn')) return;
            const match = btn.getAttribute('onclick')?.match(/previewInvoice\(['"]([^'"]+)['"]\)/);
            const orderId = match ? match[1] : '';
            if (!orderId) return;

            const reorderBtn = document.createElement('button');
            reorderBtn.type = 'button';
            reorderBtn.className = 'addon-reorder-btn';
            reorderBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> ${tr('إعادة طلب نفس الفاتورة', 'Reorder Invoice')}`;
            reorderBtn.onclick = async () => {
                reorderBtn.disabled = true;
                try {
                    const snap = await getDoc(doc(db, "orders", orderId));
                    if (!snap.exists()) return;
                    const items = snap.data().items || [];
                    if (items.length === 0) {
                        alert(tr('لا توجد أصناف مسجلة في هذه الفاتورة.', 'No items found in this invoice.'));
                        return;
                    }
                    if (typeof window.addToCartDirect === 'function') {
                        items.forEach(it => window.addToCartDirect(it));
                    }
                    alert(tr(`تمت إضافة (${items.length}) صنف من الفاتورة إلى السلة بنجاح!`, `Added (${items.length}) items from invoice to cart!`));
                    if (typeof window.openCartModal === 'function') window.openCartModal();
                } finally {
                    reorderBtn.disabled = false;
                }
            };
            btn.insertAdjacentElement('afterend', reorderBtn);
        });

        await renderFeedDepletionReminder();
    };

    new MutationObserver(enhanceInvoices).observe(invoicesList, { childList: true });
}

async function renderFeedDepletionReminder() {
    if (!coreUser) return;
    const profileHeader = document.querySelector('#profileSection .profile-card-header');
    if (!profileHeader || document.getElementById('addonFeedReminderBanner')) return;

    try {
        const snap = await getDocs(query(collection(db, "orders"), where("userEmail", "==", coreUser.email), limit(15)));
        if (snap.empty) return;

        let latestOrder = null;
        let latestId = '';
        snap.forEach(d => {
            const o = d.data();
            if (!latestOrder || new Date(o.createdAt || 0) > new Date(latestOrder.createdAt || 0)) {
                latestOrder = o;
                latestId = d.id;
            }
        });

        if (!latestOrder || !latestOrder.createdAt) return;
        const bagsCount = Array.isArray(latestOrder.items) ? latestOrder.items.length : 1;
        const estimatedCycleDays = Math.min(30, Math.max(7, Math.round(bagsCount * 0.7) || 14));
        const daysPassed = Math.floor((Date.now() - new Date(latestOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, estimatedCycleDays - daysPassed);

        const banner = document.createElement('div');
        banner.id = 'addonFeedReminderBanner';
        banner.className = 'addon-reminder-banner';
        banner.innerHTML = `
            <div>
                <strong style="color:#173627; font-size:0.92rem; display:block;">
                    <i class="fa-solid fa-bell-concierge" style="color:#d97706;"></i>
                    ${daysRemaining <= 3
                        ? tr('تنبيه: اقترب موعد نفاد العلف بمزرعتك!', 'Alert: Your farm feed stock is running low!')
                        : tr(`متبقي حوالي (${daysRemaining}) يوم على موعد دفعة العلف القادمة`, `~${daysRemaining} days remaining until your next feed batch`)}
                </strong>
                <small style="color:#555;">
                    ${tr(`بناءً على آخر طلبية (#${esc(latestId.slice(0, 6))} - ${bagsCount} وحدة)`, `Based on last order (#${esc(latestId.slice(0, 6))} - ${bagsCount} items)`)}
                </small>
            </div>
            <button type="button" id="addonQuickReorderLastBtn" class="btn-submit" style="width:auto; padding:8px 14px; background:#173627; font-size:0.84rem;">
                <i class="fa-solid fa-repeat"></i> ${tr('اطلب الدفعة القادمة الآن', 'Reorder Next Batch Now')}
            </button>
        `;
        profileHeader.appendChild(banner);

        document.getElementById('addonQuickReorderLastBtn')?.addEventListener('click', () => {
            const items = latestOrder.items || [];
            if (typeof window.addToCartDirect === 'function') {
                items.forEach(it => window.addToCartDirect(it));
            }
            if (typeof window.openCartModal === 'function') window.openCartModal();
        });
    } catch (_) {}
}

// ==========================================
// الإضافة 5: تصدير التقارير كصورة (PNG) و PDF بمقاسي A4 و A5 (scale: 2)
// ==========================================
function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

async function ensureCaptureLibraries() {
    if (typeof window.html2canvas === 'undefined') {
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
}

function downloadCsvFallback(filename, headers, rows) {
    const escapeCsvCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(r => r.map(escapeCsvCell).join(','))
    ].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function openReportExportModal({ title, subtitle, summaryBadges, headers, rows, baseFilename }) {
    document.getElementById('addonReportExportBackdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'addonReportExportBackdrop';
    backdrop.className = 'addon-report-backdrop';

    const todayStr = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const badgesHtml = (summaryBadges || []).map(b => `
        <div style="background:#f0f7f4; border:1px solid #bbf7d0; padding:6px 12px; border-radius:8px; font-size:0.8rem;">
            <span style="color:#4b5563;">${esc(b.label)}:</span>
            <strong style="color:#173627; margin-right:4px;">${esc(b.value)}</strong>
        </div>
    `).join('');

    const tableHeadHtml = headers.map(h => `<th>${esc(h)}</th>`).join('');
    const tableRowsHtml = rows.length
        ? rows.map(r => `<tr>${r.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${headers.length}" style="text-align:center; padding:16px;">لا توجد بيانات مسجلة لعرضها</td></tr>`;

    backdrop.innerHTML = `
        <div class="addon-report-modal">
            <div class="addon-report-head">
                <strong><i class="fa-solid fa-file-invoice" style="color:#d4af37;"></i> ${esc(title)}</strong>
                <button type="button" id="addonCloseReportModalBtn" style="background:none; border:none; color:#fff; font-size:1.3rem; cursor:pointer;">&times;</button>
            </div>
            <div class="addon-report-controls">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.82rem; font-weight:800; color:#173627;">مقاس الورقة:</span>
                    <div class="addon-size-toggle">
                        <button type="button" data-paper="a4" class="active">A4</button>
                        <button type="button" data-paper="a5">A5</button>
                    </div>
                </div>
                <span style="font-size:0.78rem; color:#15803d; font-weight:700;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> دقة فائقة (Scale 2)
                </span>
            </div>
            <div class="addon-report-scroll">
                <div id="addonReportCaptureSheet" class="addon-report-sheet size-a4">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #173627; padding-bottom:10px;">
                        <div>
                            <h3 style="margin:0; color:#173627; font-size:1.15rem;">مؤسسة الإخلاص للأعلاف الطبيعية والحبوب</h3>
                            <p style="margin:2px 0 0; color:#b45309; font-weight:800; font-size:0.88rem;">${esc(title)}</p>
                            ${subtitle ? `<small style="color:#6b7280;">${esc(subtitle)}</small>` : ''}
                        </div>
                        <div style="text-align:left; font-size:0.78rem; color:#374151;">
                            <div><strong>التاريخ:</strong> ${esc(todayStr)}</div>
                            <div><strong>إجمالي السجلات:</strong> ${rows.length}</div>
                        </div>
                    </div>
                    ${badgesHtml ? `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">${badgesHtml}</div>` : ''}
                    <table class="addon-report-table">
                        <thead><tr>${tableHeadHtml}</tr></thead>
                        <tbody>${tableRowsHtml}</tbody>
                    </table>
                    <div style="margin-top:12px; padding-top:8px; border-top:1px dashed #cbd5e1; display:flex; justify-content:space-between; font-size:0.74rem; color:#6b7280;">
                        <span>منصة العمدة / مؤسسة الإخلاص - شبرا منت، الجيزة</span>
                        <span>تم الإصدار آلياً بدقة عالية</span>
                    </div>
                </div>
            </div>
            <div class="addon-report-foot">
                <button type="button" id="addonSaveReportPngBtn" class="addon-excel-btn" style="background:#173627;">
                    <i class="fa-solid fa-image"></i> حفظ كصورة (PNG)
                </button>
                <button type="button" id="addonSaveReportPdfBtn" class="addon-excel-btn" style="background:#b91c1c;">
                    <i class="fa-solid fa-file-pdf"></i> حفظ ملف (PDF)
                </button>
                <button type="button" id="addonSaveReportCsvBtn" class="addon-excel-btn" style="background:#15803d;">
                    <i class="fa-solid fa-file-excel"></i> Excel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);

    let selectedPaper = 'a4';
    const sheetEl = document.getElementById('addonReportCaptureSheet');

    backdrop.querySelectorAll('.addon-size-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
            backdrop.querySelectorAll('.addon-size-toggle button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaper = btn.dataset.paper;
            sheetEl.classList.remove('size-a4', 'size-a5');
            sheetEl.classList.add(`size-${selectedPaper}`);
        });
    });

    document.getElementById('addonCloseReportModalBtn')?.addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.remove();
    });

    // حفظ كصورة PNG بنفس آلية حفظ الفواتير (scale: 2, useCORS: true)
    document.getElementById('addonSaveReportPngBtn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التصوير...`;
        try {
            await ensureCaptureLibraries();
            const canvas = await window.html2canvas(sheetEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const fileName = `${baseFilename}_${selectedPaper.toUpperCase()}.png`;

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert('تعذر حفظ الصورة: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    });

    // حفظ كملف PDF بمقاس A4 أو A5 بدقة scale: 2
    document.getElementById('addonSaveReportPdfBtn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التجهيز...`;
        try {
            await ensureCaptureLibraries();
            const canvas = await window.html2canvas(sheetEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });
            const imgData = canvas.toDataURL('image/png', 1.0);
            const JsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (!JsPDFCtor) throw new Error('مكتبة PDF غير متاحة');

            const pdf = new JsPDFCtor({
                orientation: 'portrait',
                unit: 'mm',
                format: selectedPaper
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 6;
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin;

            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - margin * 2);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pageHeight - margin * 2);
            }

            pdf.save(`${baseFilename}_${selectedPaper.toUpperCase()}.pdf`);
        } catch (err) {
            alert('تعذر حفظ ملف PDF: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    });

    document.getElementById('addonSaveReportCsvBtn')?.addEventListener('click', () => {
        downloadCsvFallback(baseFilename, headers, rows);
    });
}

function initAdminFiltersAndExcelExports() {
    // 1. شريط البحث والفلترة وتصدير تقرير الطلبات (صورة / PDF A4 & A5)
    const ordersList = document.getElementById('adminOrdersList');
    if (ordersList && !document.getElementById('addonOrdersToolbar')) {
        const toolbar = document.createElement('div');
        toolbar.id = 'addonOrdersToolbar';
        toolbar.className = 'addon-toolbar';
        toolbar.innerHTML = `
            <input type="text" id="addonOrderSearchInput" placeholder="ابحث برقم الطلب، بريد العميل، الهاتف، أو السيارة...">
            <select id="addonOrderStatusFilter">
                <option value="all">كل الحالات</option>
                <option value="قيد المراجعة">قيد المراجعة والشحن</option>
                <option value="جاري التوصيل">جاري التوصيل</option>
                <option value="تم التسليم">تم التسليم بنجاح</option>
            </select>
            <button type="button" id="addonExportOrdersExcelBtn" class="addon-excel-btn">
                <i class="fa-solid fa-image"></i> تصدير الطلبات (صورة / PDF)
            </button>
        `;
        ordersList.insertAdjacentElement('beforebegin', toolbar);

        const applyOrderFilters = () => {
            const term = (document.getElementById('addonOrderSearchInput')?.value || '').trim().toLowerCase();
            const statusFilter = document.getElementById('addonOrderStatusFilter')?.value || 'all';
            ordersList.querySelectorAll('.data-item').forEach(card => {
                const text = card.textContent.toLowerCase();
                const matchesTerm = !term || text.includes(term);
                const matchesStatus = statusFilter === 'all' || text.includes(statusFilter.toLowerCase());
                card.style.display = (matchesTerm && matchesStatus) ? '' : 'none';
            });
        };

        document.getElementById('addonOrderSearchInput')?.addEventListener('input', applyOrderFilters);
        document.getElementById('addonOrderStatusFilter')?.addEventListener('change', applyOrderFilters);

        document.getElementById('addonExportOrdersExcelBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...`;
            try {
                const snap = await getDocs(query(collection(db, "orders"), limit(500)));
                const rows = [];
                let totalSales = 0;
                snap.forEach(d => {
                    const o = d.data();
                    const amount = Number(o.total || 0);
                    totalSales += amount;
                    rows.push([
                        '#' + d.id.slice(0, 6),
                        o.date || '-',
                        o.userEmail || '-',
                        o.phone || '-',
                        Array.isArray(o.items) ? o.items.length : 0,
                        `${amount.toLocaleString()} ج.م`,
                        o.paymentType || '-',
                        o.status || '-',
                        o.assignedVehicle || 'غير محدد'
                    ]);
                });

                openReportExportModal({
                    title: 'تقرير الطلبات والمبيعات الشامل',
                    subtitle: 'كشف تفصيلي بالطلبات وحالات الشحن والتحصيل',
                    summaryBadges: [
                        { label: 'عدد الطلبات', value: `${rows.length} طلب` },
                        { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ج.م` }
                    ],
                    headers: ['الفاتورة', 'التاريخ', 'العميل', 'الهاتف', 'الأصناف', 'الإجمالي', 'الدفع', 'الحالة', 'السيارة'],
                    rows,
                    baseFilename: `تقرير_الطلبات_العمدة_${new Date().toISOString().slice(0, 10)}`
                });
            } catch (err) {
                alert('خطأ أثناء تجهيز التقرير: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        });
    }

    // 2. زر تصدير كشف حساب الآجل والمديونيات (صورة / PDF A4 & A5) في تبويب المحاسبة
    const accSummary = document.getElementById('accountingSummaryCards');
    if (accSummary && !document.getElementById('addonAccountingExportBar')) {
        const bar = document.createElement('div');
        bar.id = 'addonAccountingExportBar';
        bar.style.cssText = 'display:flex; justify-content:flex-end; margin-bottom:12px;';
        bar.innerHTML = `
            <button type="button" id="addonExportAccountingExcelBtn" class="addon-excel-btn">
                <i class="fa-solid fa-image"></i> تصدير كشف المديونيات (صورة / PDF)
            </button>
        `;
        accSummary.insertAdjacentElement('afterend', bar);

        document.getElementById('addonExportAccountingExcelBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التجهيز...`;
            try {
                const [ordersSnap, paySnap] = await Promise.all([
                    getDocs(query(collection(db, "orders"), limit(500))),
                    getDocs(query(collection(db, "credit_payments"), limit(500)))
                ]);

                const ledger = {};
                ordersSnap.forEach(d => {
                    const o = d.data();
                    if ((o.paymentType || '').includes('آجل')) {
                        const email = o.userEmail || 'غير معروف';
                        if (!ledger[email]) ledger[email] = { email, phone: o.phone || '', debit: 0, paid: 0 };
                        ledger[email].debit += Number(o.total || 0);
                        if (o.phone && !ledger[email].phone) ledger[email].phone = o.phone;
                    }
                });

                paySnap.forEach(d => {
                    const p = d.data();
                    const email = p.clientEmail || 'غير معروف';
                    if (!ledger[email]) ledger[email] = { email, phone: '', debit: 0, paid: 0 };
                    ledger[email].paid += Number(p.amount || 0);
                });

                let sumDebit = 0;
                let sumPaid = 0;
                let sumRemain = 0;

                const rows = Object.values(ledger).map(c => {
                    const remain = Math.max(0, c.debit - c.paid);
                    sumDebit += c.debit;
                    sumPaid += c.paid;
                    sumRemain += remain;
                    return [
                        c.email,
                        c.phone || '-',
                        `${c.debit.toLocaleString()} ج.م`,
                        `${c.paid.toLocaleString()} ج.م`,
                        `${remain.toLocaleString()} ج.م`
                    ];
                });

                openReportExportModal({
                    title: 'كشف حساب الآجل والمديونيات',
                    subtitle: 'ملخص أرصدة العملاء والدفعات المسددة والمتبقية',
                    summaryBadges: [
                        { label: 'إجمالي الآجل', value: `${sumDebit.toLocaleString()} ج.م` },
                        { label: 'إجمالي المسدد', value: `${sumPaid.toLocaleString()} ج.م` },
                        { label: 'الرصيد المتبقي', value: `${sumRemain.toLocaleString()} ج.م` }
                    ],
                    headers: ['العميل', 'الهاتف', 'إجمالي الآجل', 'إجمالي المسدد', 'الرصيد المتبقي'],
                    rows,
                    baseFilename: `كشف_حساب_الآجل_والمديونيات_${new Date().toISOString().slice(0, 10)}`
                });
            } catch (err) {
                alert('خطأ أثناء تجهيز كشف المحاسبة: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        });
    }
}

// ==========================================
// التشغيل التلقائي الآمن للنواة المنفصلة
// ==========================================
onAuthStateChanged(auth, (user) => {
    coreUser = user || null;
});

function bootstrapOmdaAddonsCore() {
    injectAddonStyles();
    registerLeafletHook();
    loadProductsPricingMetadata();
    initLiveShipmentTrackingAddon();
    injectWholesaleFieldInAdminProductForm();
    initCartWholesaleAndCouponsUI();
    initRationMixerCard();
    initReorderAndDepletionAlert();
    initAdminFiltersAndExcelExports();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapOmdaAddonsCore);
} else {
    bootstrapOmdaAddonsCore();
}
