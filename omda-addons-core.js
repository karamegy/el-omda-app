/**
 * ============================================================================
 * ملف النواة المنفصل للإضافات المتقدمة - منصة العمدة / مؤسسة الإخلاص
 * File: omda-addons-core.js
 * المميزات المدمجة:
 * 1. خريطة تتبع الشحنة الحية للعميل + دمج مواقع العملاء في خريطة الإدارة.
 * 2. نظام التسعير المتدرج للجملة (قطاعي / طن) + كوبونات الخصم الترويجية.
 * 3. حاسبة تركيب العليقة وموازنة البروتين (Ration Mixer) المرتبطة بالبورصة الحية.
 * 4. إعادة الطلب بنقرة واحدة (One-Click Reorder) + تنبيه موعد نفاد العلف.
 * 5. فلترة وبحث وتصدير تقارير الطلبات والمحاسبة والآجل إلى Excel (CSV) على الهاتف والكمبيوتر.
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
            // إذا حدد المدير سعر جملة نستخدمه، وإلا نطبق خصم جملة تلقائي 3% للكميات >= 20 شكارة (1 طن)
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

    // مراقبة تحديث عناصر السلة لتحديث خصومات الجملة والكوبون لحظياً
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

            // كوبونات افتراضية جاهزة في حال عدم إنشاء كوبونات في قاعدة البيانات بعد
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

    // اعتراض زر إتمام الطلب فقط في حال وجود خصم جملة أو كوبون لتسجيل السعر الصافي بدقة
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

            // تفريغ السلة في الذاكرة و localStorage معاً عبر دوال التطبيق الأساسية
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
        // تقدير دورة الاستهلاك القياسية (14 يوم افتراضياً للدفعة)
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
// الإضافة 5: فلترة وتصدير التقارير المحاسبية والطلبات (Excel / CSV) للهاتف والكمبيوتر
// ==========================================
async function downloadCsvForExcel(filename, headers, rows) {
    const escapeCsvCell = (val) => {
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
    };
    const csvLines = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(r => r.map(escapeCsvCell).join(','))
    ];
    // إضافة UTF-8 BOM لضمان ظهور الحروف العربية بشكل سليم تماماً داخل برنامج Excel
    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    // 1. الحل المعتمد لتطبيق الأندرويد (TWA / WebView): فتح نافذة المشاركة/الحفظ في Excel أو واتساب أو مدير الملفات
    try {
        const file = new File([csvContent], filename, { type: 'text/csv;charset=utf-8;' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: filename,
                text: 'تقرير منصة العمدة / مؤسسة الإخلاص'
            });
            return;
        }
    } catch (err) {
        if (err && err.name === 'AbortError') return; // ألغى المستخدم نافذة المشاركة يدوياً
    }

    // 2. بديل Android WebView القديم في حال عدم دعم مشاركة الملفات
    if (/; wv\)/.test(navigator.userAgent)) {
        const dataLink = document.createElement('a');
        dataLink.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        dataLink.download = filename;
        dataLink.style.display = 'none';
        document.body.appendChild(dataLink);
        dataLink.click();
        document.body.removeChild(dataLink);
        return;
    }

    // 3. التحميل المباشر للمتصفحات والكمبيوتر
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function initAdminFiltersAndExcelExports() {
    // 1. شريط البحث والفلترة وتصدير Excel في تبويب الطلبات
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
                <i class="fa-solid fa-file-excel"></i> تصدير الطلبات Excel
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
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري تجهيز الملف...`;
            try {
                const snap = await getDocs(query(collection(db, "orders"), limit(500)));
                const rows = [];
                snap.forEach(d => {
                    const o = d.data();
                    rows.push([
                        d.id,
                        o.date || '',
                        o.userEmail || '',
                        o.phone || '',
                        Array.isArray(o.items) ? o.items.length : 0,
                        o.total || 0,
                        o.paymentType || '',
                        o.status || '',
                        o.assignedVehicle || 'غير محدد'
                    ]);
                });
                await downloadCsvForExcel(
                    `تقرير_الطلبات_العمدة_${new Date().toISOString().slice(0, 10)}.csv`,
                    ['رقم الفاتورة', 'التاريخ', 'البريد الإلكتروني للعميل', 'الهاتف', 'عدد الأصناف', 'الإجمالي (ج.م)', 'طريقة الدفع', 'حالة الشحنة', 'السيارة المعينة'],
                    rows
                );
            } catch (err) {
                alert('خطأ أثناء تصدير الطلبات: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        });
    }

    // 2. زر تصدير كشف حساب الآجل والمدفوعات إلى Excel في تبويب المحاسبة
    const accSummary = document.getElementById('accountingSummaryCards');
    if (accSummary && !document.getElementById('addonAccountingExportBar')) {
        const bar = document.createElement('div');
        bar.id = 'addonAccountingExportBar';
        bar.style.cssText = 'display:flex; justify-content:flex-end; margin-bottom:12px;';
        bar.innerHTML = `
            <button type="button" id="addonExportAccountingExcelBtn" class="addon-excel-btn">
                <i class="fa-solid fa-file-excel"></i> تصدير كشف المديونيات والآجل Excel
            </button>
        `;
        accSummary.insertAdjacentElement('afterend', bar);

        document.getElementById('addonExportAccountingExcelBtn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري تجهيز الكشف...`;
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

                const rows = Object.values(ledger).map(c => [
                    c.email,
                    c.phone,
                    c.debit,
                    c.paid,
                    Math.max(0, c.debit - c.paid)
                ]);

                await downloadCsvForExcel(
                    `كشف_حساب_الآجل_والمديونيات_${new Date().toISOString().slice(0, 10)}.csv`,
                    ['البريد الإلكتروني للعميل', 'رقم الهاتف', 'إجمالي فواتير الآجل (ج.م)', 'إجمالي المسدد (ج.م)', 'الرصيد المتبقي (ج.م)'],
                    rows
                );
            } catch (err) {
                alert('خطأ أثناء تصدير كشف المحاسبة: ' + err.message);
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
