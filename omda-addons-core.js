/**
 * ============================================================================
 * ملف النواة المنفصل للإضافات المتقدمة - منصة العمدة / مؤسسة الإخلاص
 * File: omda-addons-core.js
 * المميزات المدمجة:
 * 1. خريطة تتبع الشحنة الحية للعميل + دمج مواقع العملاء في خريطة الإدارة.
 * 2. نظام التسعير المتدرج للجملة (قطاعي / طن) + كوبونات الخصم الترويجية.
 * 3. حاسبة تركيب العليقة وموازنة البروتين (Ration Mixer) المرتبطة بالبورصة الحية.
 * 4. إعادة الطلب بنقرة واحدة (One-Click Reorder) + تنبيه موعد نفاد العلف.
 * 5. عرض الجداول بتصميم متجاوب على التطبيق + صناعة الصورة (PNG) و PDF بمقاسي A4 و A5
 *    في الخلفية بعيداً عن عين المستخدم بدقة طباعة عالية ومنع قص الصفوف أو تداخل الأعمدة.
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

        /* =========================================================
           تصميم نافذة المعاينة المتجاوبة على شاشة التطبيق (App UI)
           ========================================================= */
        .addon-report-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(16, 39, 28, 0.82);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            backdrop-filter: blur(3px);
        }
        .addon-report-modal {
            background: #ffffff;
            width: 100%;
            max-width: 900px;
            max-height: 92vh;
            max-height: 92dvh;
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
            flex-shrink: 0;
        }
        .addon-report-controls {
            background: #f0f7f4;
            padding: 9px 14px;
            border-bottom: 1px solid #d1fae5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            flex-shrink: 0;
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
            transition: all 0.15s ease;
        }
        .addon-size-toggle button.active {
            background: #173627;
            color: #d4af37;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .addon-app-preview-body {
            padding: 14px;
            overflow-y: auto;
            flex: 1;
            background: #f8fafc;
            direction: rtl;
            text-align: right;
            -webkit-overflow-scrolling: touch;
        }
        .addon-app-table-wrap {
            width: 100%;
            overflow-x: auto;
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            margin-top: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            -webkit-overflow-scrolling: touch;
        }
        .addon-app-table {
            width: 100%;
            min-width: 640px;
            border-collapse: collapse;
            font-size: 0.82rem;
            background: #ffffff;
        }
        .addon-app-table th {
            background: #173627 !important;
            color: #ffffff !important;
            padding: 9px 8px !important;
            border: 1px solid #10271c !important;
            text-align: right !important;
            font-weight: 800 !important;
            white-space: nowrap;
            position: sticky;
            top: 0;
            z-index: 2;
        }
        .addon-app-table td {
            padding: 8px !important;
            border: 1px solid #cbd5e1 !important;
            color: #111827 !important;
            vertical-align: middle;
            line-height: 1.45;
        }
        .addon-app-table tr:nth-child(even) td {
            background: #f8fafc !important;
        }
        .addon-report-foot {
            padding: 10px 14px;
            background: #f8faf9;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
            flex-shrink: 0;
        }

        /* =========================================================
           قالب الطباعة الخلفي المعزول (Off-Screen Print Stage)
           يُبنى بعيداً عن عين المستخدم لضمان دقة A4 و A5 دون قص أو تداخل
           ========================================================= */
        #omdaOffscreenPrintHost {
            position: fixed !important;
            left: 0 !important;
            top: -35000px !important;
            z-index: -9999 !important;
            pointer-events: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
        }
        .omda-print-sheet {
            background: #ffffff !important;
            color: #111827 !important;
            border: 2.5px solid #173627 !important;
            border-radius: 0 !important;
            direction: rtl !important;
            text-align: right !important;
            font-family: 'Cairo', Tahoma, Arial, sans-serif !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .omda-print-sheet.paper-a4 {
            width: 794px !important;
            min-width: 794px !important;
            max-width: 794px !important;
            padding: 20px !important;
        }
        .omda-print-sheet.paper-a5 {
            width: 559px !important;
            min-width: 559px !important;
            max-width: 559px !important;
            padding: 13px !important;
        }
        .omda-print-table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            margin-top: 12px !important;
            background: #ffffff !important;
        }
        .omda-print-sheet.paper-a4 .omda-print-table {
            font-size: 11px !important;
        }
        .omda-print-sheet.paper-a5 .omda-print-table {
            font-size: 9px !important;
        }
        .omda-print-table th {
            background-color: #173627 !important;
            background: #173627 !important;
            color: #ffffff !important;
            border: 1.2px solid #173627 !important;
            font-weight: 800 !important;
            text-align: right !important;
            vertical-align: middle !important;
            line-height: 1.35 !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
        }
        .omda-print-sheet.paper-a4 .omda-print-table th {
            padding: 7px 5px !important;
        }
        .omda-print-sheet.paper-a5 .omda-print-table th {
            padding: 5px 3px !important;
        }
        .omda-print-table td {
            border: 1px solid #94a3b8 !important;
            color: #111827 !important;
            vertical-align: middle !important;
            line-height: 1.4 !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            box-sizing: border-box !important;
        }
        .omda-print-sheet.paper-a4 .omda-print-table td {
            padding: 6px 5px !important;
        }
        .omda-print-sheet.paper-a5 .omda-print-table td {
            padding: 4.5px 3px !important;
        }
        .omda-print-table tr:nth-child(even) td {
            background-color: #f1f5f9 !important;
            background: #f1f5f9 !important;
        }
        .omda-print-table tr:nth-child(odd) td {
            background-color: #ffffff !important;
            background: #ffffff !important;
        }
        .omda-ltr-isolate {
            direction: ltr !important;
            unicode-bidi: isolate !important;
            display: inline-block !important;
            max-width: 100% !important;
            text-align: left !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
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
        window.L.tileLayer('https://{s}.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

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
// الإضافة 5: معاينة متجاوبة على التطبيق + محرك طباعة خلفي A4 / A5 (PNG & PDF)
// ==========================================
let libsLoadingPromise = null;
const scriptPromises = {};

function loadScriptOnce(src) {
    if (scriptPromises[src]) return scriptPromises[src];
    scriptPromises[src] = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing && (existing.dataset.loaded === '1')) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = () => {
            s.dataset.loaded = '1';
            resolve();
        };
        s.onerror = () => {
            delete scriptPromises[src];
            reject(new Error(`فشل تحميل: ${src}`));
        };
        document.head.appendChild(s);
    });
    return scriptPromises[src];
}

function ensureCaptureLibraries() {
    if (typeof window.html2canvas !== 'undefined' && (typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined')) {
        return Promise.resolve();
    }
    if (!libsLoadingPromise) {
        libsLoadingPromise = Promise.all([
            typeof window.html2canvas === 'undefined'
                ? loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
                : Promise.resolve(),
            (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined')
                ? loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
                : Promise.resolve()
        ]).catch(err => {
            libsLoadingPromise = null;
            throw err;
        });
    }
    return libsLoadingPromise;
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const res = String(reader.result || '');
            resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = () => reject(new Error('فشل قراءة بيانات الملف'));
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64, mimeType) {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

function toSafeAndroidFileName(fileName) {
    const dotIdx = fileName.lastIndexOf('.');
    const ext = dotIdx !== -1 ? fileName.slice(dotIdx) : '';
    const namePart = dotIdx !== -1 ? fileName.slice(0, dotIdx) : fileName;
    const cleanName = namePart
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    const finalBase = /^[a-zA-Z]/.test(cleanName) ? cleanName : `Omda_Report_${cleanName || Date.now()}`;
    return `${finalBase}${ext}`;
}

async function shareOrDownloadFast({ pureBase64, blob, mimeType, fileName, shareTitle }) {
    const shareText = `${shareTitle} - مؤسسة الإخلاص للأعلاف الطبيعية والحبوب`;
    const safeFileName = toSafeAndroidFileName(fileName);

    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins?.Share && Capacitor.Plugins?.Filesystem) {
        try {
            const base64Data = pureBase64 || (blob ? await blobToBase64(blob) : '');
            const savedFile = await Capacitor.Plugins.Filesystem.writeFile({
                path: safeFileName,
                data: base64Data,
                directory: 'CACHE'
            });

            await Capacitor.Plugins.Share.share({
                title: shareTitle,
                text: shareText,
                url: savedFile.uri,
                dialogTitle: shareTitle
            });
            return;
        } catch (err) {
            const msg = String(err?.message || '').toLowerCase();
            if (err?.name === 'AbortError' || msg.includes('cancel')) {
                return;
            }
            console.warn('Capacitor Share fallback:', err);
        }
    }

    const finalBlob = blob || base64ToBlob(pureBase64, mimeType);

    try {
        const file = new File([finalBlob], safeFileName, { type: mimeType });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: shareTitle,
                text: shareText
            });
            return;
        }
    } catch (err) {
        if (err && err.name === 'AbortError') return;
    }

    const url = URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function downloadCsvFallback(filename, headers, rows, title) {
    const escapeCsvCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(r => r.map(escapeCsvCell).join(','))
    ].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    await shareOrDownloadFast({
        blob,
        mimeType: 'text/csv;charset=utf-8;',
        fileName: filename + '.csv',
        shareTitle: title || filename
    });
}

// تنسيق محتوى الخلية بأمان وعزل النصوص الإنجليزية (البريد/الهاتف/الكود) لمنع تداخلها مع الخلايا المجاورة
function formatPrintCellHtml(val, isMoneyCol = false) {
    const raw = String(val ?? '-').trim();
    if (!raw) return '-';

    // عزل القيم الإنجليزية أو الأرقام الدولية أو أكواد الفواتير لمنع تداخل BiDi في RTL
    if (
        raw.startsWith('#') ||
        raw.includes('@') ||
        /^\+?[0-9\s\-()./]+$/.test(raw)
    ) {
        const noWrap = raw.startsWith('#') || /^\+?[0-9\-/]+$/.test(raw);
        return `<span class="omda-ltr-isolate" style="${noWrap ? 'white-space:nowrap;' : ''}">${esc(raw)}</span>`;
    }

    if (isMoneyCol || /ج\.م$/.test(raw)) {
        return `<span style="white-space:nowrap; font-weight:800; color:#173627;">${esc(raw)}</span>`;
    }

    return esc(raw);
}

// حساب نسب عرض الأعمدة المثالية لكل جدول بحيث لا يتداخل أي عمود في A4 أو A5
function resolveColumnWidths(headers) {
    const count = headers.length;
    if (count === 9) {
        // ['الفاتورة', 'التاريخ', 'العميل', 'الهاتف', 'الأصناف', 'الإجمالي', 'الدفع', 'الحالة', 'السيارة']
        return ['8%', '11%', '21%', '14%', '6%', '12%', '10%', '10%', '8%'];
    }
    if (count === 5) {
        // ['العميل', 'الهاتف', 'إجمالي الآجل', 'إجمالي المسدد', 'الرصيد المتبقي']
        return ['32%', '18%', '16%', '17%', '17%'];
    }
    const equalPct = (100 / Math.max(1, count)).toFixed(2) + '%';
    return headers.map(() => equalPct);
}

/**
 * بناء وتصوير الفاتورة/التقرير في الخلفية بعيداً عن عين المستخدم (Off-Screen Print Stage)
 * بمقاس A4 (794px) أو A5 (559px) مع دقة طباعة فائقة ومنع أي قص جانبي أو تداخل
 */
async function renderOffscreenPrintCanvas({ title, subtitle, summaryBadges, headers, rows, paperSize }) {
    await ensureCaptureLibraries();

    document.getElementById('omdaOffscreenPrintHost')?.remove();

    const host = document.createElement('div');
    host.id = 'omdaOffscreenPrintHost';

    const isA5 = paperSize === 'a5';
    const sheetWidthPx = isA5 ? 559 : 794;
    const todayStr = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const colWidths = resolveColumnWidths(headers);
    const colGroupHtml = `<colgroup>${colWidths.map(w => `<col style="width:${w};">`).join('')}</colgroup>`;

    const badgesHtml = (summaryBadges || []).map(b => `
        <div style="background:#f0f7f4; border:1.5px solid #173627; padding:${isA5 ? '4px 9px' : '6px 13px'}; border-radius:6px; font-size:${isA5 ? '10.5px' : '12px'}; display:inline-flex; align-items:center; gap:5px;">
            <span style="color:#374151; font-weight:700;">${esc(b.label)}:</span>
            <strong style="color:#173627; font-weight:900;">${esc(b.value)}</strong>
        </div>
    `).join('');

    const thHtml = headers.map((h, idx) => {
        const isCenter = h === 'الأصناف';
        return `<th style="width:${colWidths[idx]}; text-align:${isCenter ? 'center' : 'right'} !important;">${esc(h)}</th>`;
    }).join('');

    const tbodyHtml = rows.length
        ? rows.map(r => {
            const tds = r.map((cell, idx) => {
                const hName = headers[idx] || '';
                const isCenter = hName === 'الأصناف';
                const isMoney = hName.includes('الإجمالي') || hName.includes('الآجل') || hName.includes('المسدد') || hName.includes('المتبقي');
                return `<td style="text-align:${isCenter ? 'center' : 'right'} !important;">${formatPrintCellHtml(cell, isMoney)}</td>`;
            }).join('');
            return `<tr>${tds}</tr>`;
        }).join('')
        : `<tr><td colspan="${headers.length}" style="text-align:center !important; padding:18px !important;">لا توجد بيانات مسجلة لعرضها</td></tr>`;

    const sheet = document.createElement('div');
    sheet.className = `omda-print-sheet ${isA5 ? 'paper-a5' : 'paper-a4'}`;
    sheet.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2.5px solid #173627; padding-bottom:${isA5 ? '8px' : '11px'}; gap:10px;">
            <div>
                <div style="font-size:${isA5 ? '14px' : '18px'}; font-weight:900; color:#173627; line-height:1.3;">
                    مؤسسة الإخلاص للأعلاف الطبيعية والحبوب
                </div>
                <div style="font-size:${isA5 ? '11.5px' : '14px'}; font-weight:800; color:#b45309; margin-top:2px;">
                    ${esc(title)}
                </div>
                ${subtitle ? `<div style="font-size:${isA5 ? '9.5px' : '11px'}; color:#4b5563; margin-top:2px;">${esc(subtitle)}</div>` : ''}
            </div>
            <div style="text-align:left; font-size:${isA5 ? '9.5px' : '11.5px'}; color:#1f2937; white-space:nowrap; background:#f8fafc; border:1px solid #cbd5e1; padding:6px 10px; border-radius:6px;">
                <div><strong>التاريخ:</strong> ${esc(todayStr)}</div>
                <div style="margin-top:2px;"><strong>عدد السجلات:</strong> ${rows.length}</div>
                <div style="margin-top:2px;"><strong>المقاس:</strong> ${paperSize.toUpperCase()}</div>
            </div>
        </div>

        ${badgesHtml ? `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:${isA5 ? '8px' : '11px'};">${badgesHtml}</div>` : ''}

        <table class="omda-print-table">
            ${colGroupHtml}
            <thead><tr>${thHtml}</tr></thead>
            <tbody>${tbodyHtml}</tbody>
        </table>

        <div style="margin-top:${isA5 ? '10px' : '14px'}; padding-top:8px; border-top:1.5px dashed #94a3b8; display:flex; justify-content:space-between; align-items:center; font-size:${isA5 ? '9px' : '10.5px'}; color:#475569; font-weight:700;">
            <span>منصة العمدة / مؤسسة الإخلاص - شبرا منت، الجيزة</span>
            <span>مستند معتمد للطباعة والمراجعة المحاسبية</span>
        </div>
    `;

    host.appendChild(sheet);
    document.body.appendChild(host);

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready.catch(() => {});
        }
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const sheetRect = sheet.getBoundingClientRect();
        const domTotalHeight = Math.ceil(sheet.scrollHeight);
        const rowBreaksDom = Array.from(sheet.querySelectorAll('tbody tr')).map(trEl => {
            const r = trEl.getBoundingClientRect();
            return {
                top: Math.max(0, r.top - sheetRect.top),
                bottom: Math.max(0, r.bottom - sheetRect.top)
            };
        });

        const canvas = await window.html2canvas(sheet, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 0,
            removeContainer: true,
            width: sheetWidthPx,
            height: domTotalHeight,
            windowWidth: sheetWidthPx + 40,
            windowHeight: domTotalHeight + 40,
            scrollX: 0,
            scrollY: 0,
            ignoreElements: (el) => {
                if (!el || el === document.documentElement || el === document.body) return false;
                if (el === host || host.contains(el)) return false;
                if (el.tagName === 'STYLE' || (el.tagName === 'LINK' && el.rel === 'stylesheet')) return false;
                return true;
            }
        });

        return { canvas, domTotalHeight, rowBreaksDom };
    } finally {
        host.remove();
    }
}

function openReportExportModal({ title, subtitle, summaryBadges, headers, rows, baseFilename }) {
    document.getElementById('addonReportExportBackdrop')?.remove();

    // تحضير المكتبات فوراً
    ensureCaptureLibraries().catch(() => {});

    const backdrop = document.createElement('div');
    backdrop.id = 'addonReportExportBackdrop';
    backdrop.className = 'addon-report-backdrop';

    const todayStr = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const badgesHtml = (summaryBadges || []).map(b => `
        <div style="background:#ffffff; border:1px solid #bbf7d0; padding:7px 12px; border-radius:9px; font-size:0.82rem; box-shadow:0 1px 4px rgba(0,0,0,0.03);">
            <span style="color:#4b5563;">${esc(b.label)}:</span>
            <strong style="color:#173627; margin-right:4px;">${esc(b.value)}</strong>
        </div>
    `).join('');

    const tableHeadHtml = headers.map(h => `<th>${esc(h)}</th>`).join('');
    const tableRowsHtml = rows.length
        ? rows.map(r => `<tr>${r.map((cell, idx) => {
            const hName = headers[idx] || '';
            const isMoney = hName.includes('الإجمالي') || hName.includes('الآجل') || hName.includes('المسدد') || hName.includes('المتبقي');
            return `<td>${formatPrintCellHtml(cell, isMoney)}</td>`;
        }).join('')}</tr>`).join('')
        : `<tr><td colspan="${headers.length}" style="text-align:center; padding:18px;">لا توجد بيانات مسجلة لعرضها</td></tr>`;

    backdrop.innerHTML = `
        <div class="addon-report-modal">
            <div class="addon-report-head">
                <strong><i class="fa-solid fa-file-invoice" style="color:#d4af37;"></i> ${esc(title)}</strong>
                <button type="button" id="addonCloseReportModalBtn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <div class="addon-report-controls">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.82rem; font-weight:800; color:#173627;">مقاس الطباعة:</span>
                    <div class="addon-size-toggle">
                        <button type="button" data-paper="a4" class="active">A4</button>
                        <button type="button" data-paper="a5">A5</button>
                    </div>
                </div>
                <span style="font-size:0.78rem; color:#15803d; font-weight:700;">
                    <i class="fa-solid fa-print"></i> جاهز للطباعة والمشاركة الفورية
                </span>
            </div>

            <!-- معاينة متجاوبة ونظيفة على شاشة التطبيق -->
            <div class="addon-app-preview-body">
                <div style="background:#ffffff; border:1px solid #d1fae5; border-right:4px solid #173627; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <strong style="color:#173627; font-size:0.96rem; display:block;">مؤسسة الإخلاص للأعلاف الطبيعية والحبوب</strong>
                        ${subtitle ? `<small style="color:#6b7280;">${esc(subtitle)}</small>` : ''}
                    </div>
                    <div style="font-size:0.78rem; color:#374151;">
                        <span><strong>التاريخ:</strong> ${esc(todayStr)}</span> |
                        <span><strong>السجلات:</strong> ${rows.length}</span>
                    </div>
                </div>

                ${badgesHtml ? `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">${badgesHtml}</div>` : ''}

                <div class="addon-app-table-wrap">
                    <table class="addon-app-table">
                        <thead><tr>${tableHeadHtml}</tr></thead>
                        <tbody>${tableRowsHtml}</tbody>
                    </table>
                </div>
            </div>

            <div class="addon-report-foot">
                <button type="button" id="addonSaveReportPngBtn" class="addon-excel-btn" style="background:#173627;">
                    <i class="fa-solid fa-image"></i> مشاركة / حفظ صورة (PNG)
                </button>
                <button type="button" id="addonSaveReportPdfBtn" class="addon-excel-btn" style="background:#b91c1c;">
                    <i class="fa-solid fa-file-pdf"></i> مشاركة / حفظ (PDF)
                </button>
                <button type="button" id="addonSaveReportCsvBtn" class="addon-excel-btn" style="background:#15803d;">
                    <i class="fa-solid fa-file-excel"></i> Excel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);

    let selectedPaper = 'a4';

    const closeModal = () => backdrop.remove();

    backdrop.querySelectorAll('.addon-size-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
            backdrop.querySelectorAll('.addon-size-toggle button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaper = btn.dataset.paper;
        });
    });

    document.getElementById('addonCloseReportModalBtn')?.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
    });

    // 1. صناعة ومشاركة صورة PNG في الخلفية بمقاس A4 أو A5 بدقة فائقة
    document.getElementById('addonSaveReportPngBtn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التجهيز...`;
        try {
            const { canvas } = await renderOffscreenPrintCanvas({
                title,
                subtitle,
                summaryBadges,
                headers,
                rows,
                paperSize: selectedPaper
            });
            const dataUrl = canvas.toDataURL('image/png');
            const pureBase64 = dataUrl.split(',')[1];
            const fileName = `${baseFilename}_${selectedPaper.toUpperCase()}.png`;

            await shareOrDownloadFast({
                pureBase64,
                mimeType: 'image/png',
                fileName,
                shareTitle: `${title} (${selectedPaper.toUpperCase()})`
            });
        } catch (err) {
            alert('تعذر مشاركة أو حفظ الصورة: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    });

    // 2. صناعة ومشاركة ملف PDF في الخلفية بمقاس A4 أو A5 مع تقسيم الصفحات بدقة ومنع قص أي صف
    document.getElementById('addonSaveReportPdfBtn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التجهيز...`;
        try {
            const { canvas, domTotalHeight, rowBreaksDom } = await renderOffscreenPrintCanvas({
                title,
                subtitle,
                summaryBadges,
                headers,
                rows,
                paperSize: selectedPaper
            });

            const JsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (!JsPDFCtor) throw new Error('مكتبة PDF غير متاحة');

            const pdf = new JsPDFCtor({
                orientation: 'portrait',
                unit: 'mm',
                format: selectedPaper,
                compress: true
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = selectedPaper === 'a5' ? 5 : 7;
            const usableWidthMm = pageWidth - margin * 2;
            const usableHeightMm = pageHeight - margin * 2;

            const pxPerMm = canvas.width / usableWidthMm;
            const maxSliceHeightPx = Math.floor(usableHeightMm * pxPerMm);
            const domToCanvasRatio = canvas.height / Math.max(1, domTotalHeight);

            const rowBreaksPx = rowBreaksDom.map(rb => ({
                top: Math.floor(rb.top * domToCanvasRatio),
                bottom: Math.ceil(rb.bottom * domToCanvasRatio)
            }));

            let currentY = 0;
            let pageIndex = 0;

            while (currentY < canvas.height) {
                let sliceEnd = Math.min(canvas.height, currentY + maxSliceHeightPx);

                if (sliceEnd < canvas.height) {
                    const intersectingRow = rowBreaksPx.find(rb => rb.top < sliceEnd && rb.bottom > sliceEnd);
                    if (intersectingRow && intersectingRow.top > currentY + 40) {
                        sliceEnd = intersectingRow.top;
                    }
                }

                const sliceHeight = Math.max(1, sliceEnd - currentY);
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = sliceHeight;
                const ctx = pageCanvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                ctx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

                const pageImgData = pageCanvas.toDataURL('image/png');
                const sliceHeightMm = sliceHeight / pxPerMm;

                if (pageIndex > 0) pdf.addPage();
                pdf.addImage(pageImgData, 'PNG', margin, margin, usableWidthMm, sliceHeightMm, undefined, 'FAST');

                currentY = sliceEnd;
                pageIndex++;
            }

            const pdfDataUri = pdf.output('datauristring');
            const pureBase64 = pdfDataUri.split(',')[1];
            const fileName = `${baseFilename}_${selectedPaper.toUpperCase()}.pdf`;

            await shareOrDownloadFast({
                pureBase64,
                mimeType: 'application/pdf',
                fileName,
                shareTitle: `${title} (${selectedPaper.toUpperCase()})`
            });
        } catch (err) {
            alert('تعذر مشاركة أو حفظ ملف PDF: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    });

    document.getElementById('addonSaveReportCsvBtn')?.addEventListener('click', async () => {
        await downloadCsvFallback(baseFilename, headers, rows, title);
    });
}

// إتاحة الدالة عالمياً لأي فاتورة أو كشف حساب إضافي
window.openOmdaPrintReportModal = openReportExportModal;

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
    ensureCaptureLibraries().catch(() => {});
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
