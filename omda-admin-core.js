import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    db,
    currentUser,
    currentUserRole,
    escapeHtml,
    isAdminRole,
    isStaffRole,
    isDriverRole,
    t,
    OmdaLocalDB,
    allProductsCache,
    allCategoriesCache,
    ordersCache,
    marketPricesCache,
    qualityCertsCache,
    setMarketPricesCache,
    setQualityCertsCache,
    resolveProduct,
    uploadMediaToCloudinary,
    getCurrentDeviceLocation,
    renderChatBubbles
} from "./app.js";

// ==========================================
// === متغيرات وعناصر لوحة الإدارة وبوابة السائق ===
// ==========================================
let vehiclesCache = [];
let adminUsersCache = [];
let adminMap = null;
let adminMapMarkersGroup = null;
let editingOldMediaUrl = '';
let editingOldMediaType = 'image';
let newVehLat = 30.0444;
let newVehLng = 31.2357;

// متغيرات نظام الشات الإداري
let activeAdminChatEmail = null;
let activeAdminChatPhone = '';
let unsubscribeAdminRecentChats = null;
let unsubscribeActiveAdminThread = null;
let unsubscribeAdminUnreadCount = null;
let recentAdminChatsCache = [];
let activeAdminThreadMessages = [];

const addProductForm = document.getElementById('addProductForm');
const addCategoryForm = document.getElementById('addCategoryForm');
const cancelCatEditBtn = document.getElementById('cancelCatEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const sendNotificationForm = document.getElementById('sendNotificationForm');
const addVehicleForm = document.getElementById('addVehicleForm');
const cancelVehicleEditBtn = document.getElementById('cancelVehicleEditBtn');
const refreshAdminMapBtn = document.getElementById('refreshAdminMapBtn');
const adminSendChatForm = document.getElementById('adminSendChatForm');
const adminBackToClientsBtn = document.getElementById('adminBackToClientsBtn');
const adminChatSearchInput = document.getElementById('adminChatSearchInput');

export function stopAdminChatListeners() {
    if (unsubscribeAdminRecentChats) {
        unsubscribeAdminRecentChats();
        unsubscribeAdminRecentChats = null;
    }
    if (unsubscribeActiveAdminThread) {
        unsubscribeActiveAdminThread();
        unsubscribeActiveAdminThread = null;
    }
}
window.stopAdminChatListeners = stopAdminChatListeners;

// ==========================================
// === 1. إدارة بورصة الأسعار اليومية (إدارة) ===
// ==========================================
async function loadAdminMarketPrices() {
    const list = document.getElementById('adminMarketPricesList');
    if (!list) return;
    list.innerHTML = 'جاري التحميل...';

    try {
        const snap = await getDocs(query(collection(db, "market_prices"), limit(50)));
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        setMarketPricesCache(items);
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
// === 2. إدارة شهادات الجودة والتحاليل المعملية ===
// ==========================================
async function loadAdminQualityCerts() {
    const list = document.getElementById('adminQualityCertsList');
    if (!list) return;
    list.innerHTML = 'جاري التحميل...';

    try {
        const snap = await getDocs(query(collection(db, "quality_certs"), limit(50)));
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        setQualityCertsCache(items);
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
// === 3. بوابة السائق الميداني (GPS والملاحة وإغلاق التسليم) ===
// ==========================================
let driverAssignedVehicles = [];

export async function loadDriverPortal() {
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
window.loadDriverPortal = loadDriverPortal;

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
// === 4. المحاسبة وكشف حساب الآجل والمديونيات (تحكم وتعديل كامل) ===
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
// === 5. نظام الشات الإداري المباشر (chat_threads) ===
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

export function stopAdminUnreadChatsListener() {
    if (unsubscribeAdminUnreadCount) {
        unsubscribeAdminUnreadCount();
        unsubscribeAdminUnreadCount = null;
    }
    updateAdminUnreadBadge(0);
}
window.stopAdminUnreadChatsListener = stopAdminUnreadChatsListener;

export function listenAdminUnreadChatsCount() {
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
// === 6. إدارة المنتجات والأقسام ===
// ==========================================
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

export async function loadAdminProductsList() {
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
}
window.loadAdminProductsList = loadAdminProductsList;

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

export async function loadCategoriesForAdmin() {
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
}
window.loadCategoriesForAdmin = loadCategoriesForAdmin;

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

// ==========================================
// === 7. إدارة الأسطول والسيارات والخريطة ===
// ==========================================
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

// ==========================================
// === 8. التبويبات الإدارية، الطلبات، الرتب، الإشعارات، وخريطة الأسطول ===
// ==========================================
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

function getUserRoleArabicLabel(role) {
    const map = {
        admin: 'مدير',
        assistant_manager: 'مساعد مدير',
        accountant: 'محاسب',
        employee: 'موظف',
        driver: 'سائق',
        customer: 'عميل'
    };
    return map[role] || role || 'عميل';
}

function getUserRoleSelectId(email) {
    return `roleSelect_${encodeURIComponent(email).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function ensureAdminUsersSearchUI() {
    const list = document.getElementById('adminUsersList');
    if (!list || document.getElementById('adminUsersSearchWrapper')) return;

    const searchWrapper = document.createElement('div');
    searchWrapper.id = 'adminUsersSearchWrapper';
    searchWrapper.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; background:#fff; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color);';
    searchWrapper.innerHTML = `
        <div style="flex:1; min-width:200px;">
            <input type="text" id="adminUsersSearchInput" placeholder="ابحث بالاسم، البريد، رقم الهاتف، أو الرتبة..." style="width:100%; padding:8px 12px; border-radius:8px; border:1px solid #cbd5e1; font-size:0.9rem;">
        </div>
        <select id="adminUsersRoleFilter" style="padding:8px 10px; border-radius:8px; border:1px solid #cbd5e1; background:#f8faf9; font-weight:700; font-size:0.86rem;">
            <option value="all">جميع الرتب</option>
            <option value="admin">مدير (Admin)</option>
            <option value="assistant_manager">مساعد مدير</option>
            <option value="accountant">محاسب</option>
            <option value="employee">موظف</option>
            <option value="driver">سائق</option>
            <option value="customer">عميل</option>
        </select>
        <span id="adminUsersCountBadge" style="background:#173627; color:#d4af37; padding:5px 10px; border-radius:8px; font-size:0.8rem; font-weight:800;">0 حساب</span>
    `;

    list.insertAdjacentElement('beforebegin', searchWrapper);
    document.getElementById('adminUsersSearchInput')?.addEventListener('input', renderAdminUsersList);
    document.getElementById('adminUsersRoleFilter')?.addEventListener('change', renderAdminUsersList);
}

function renderAdminUsersList() {
    const list = document.getElementById('adminUsersList');
    if (!list) return;

    const term = (document.getElementById('adminUsersSearchInput')?.value || '').trim().toLowerCase();
    const roleFilter = document.getElementById('adminUsersRoleFilter')?.value || 'all';
    const countBadge = document.getElementById('adminUsersCountBadge');

    const filtered = adminUsersCache.filter(u => {
        const userRole = u.role || u.rol || u.col || 'customer';
        if (roleFilter !== 'all' && userRole !== roleFilter) return false;
        if (!term) return true;

        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const roleEn = userRole.toLowerCase();
        const roleAr = getUserRoleArabicLabel(userRole).toLowerCase();

        return name.includes(term) || email.includes(term) || phone.includes(term) || roleEn.includes(term) || roleAr.includes(term);
    });

    if (countBadge) {
        countBadge.textContent = `${filtered.length} من ${adminUsersCache.length}`;
    }

    if (filtered.length === 0) {
        list.innerHTML = '<p style="color:#888; text-align:center; padding:16px;">لا توجد حسابات مطابقة لنتيجة البحث.</p>';
        return;
    }

    list.innerHTML = filtered.map(u => {
        const email = u.email;
        const safeEmail = escapeHtml(email);
        const encodedEmail = encodeURIComponent(email);
        const userRole = u.role || u.rol || u.col || 'customer';
        const selectId = getUserRoleSelectId(email);
        const isProtectedAccount = email === 'haretg@gmail.com' || (currentUser && email === currentUser.email);

        const deleteBtnHtml = isProtectedAccount
            ? `<span style="background:#f1f5f9; color:#64748b; padding:6px 10px; border-radius:6px; font-size:0.78rem; font-weight:700;" title="حساب محمي"><i class="fa-solid fa-shield-halved"></i> محمي</span>`
            : `<button type="button" onclick="deleteUserAccount(decodeURIComponent('${encodedEmail}'))" style="background:#dc2626; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;"><i class="fa-solid fa-trash"></i> حذف</button>`;

        return `
            <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>الاسم: ${escapeHtml(u.name || 'مستخدم')} | البريد: ${safeEmail} | الهاتف: <strong>${escapeHtml(u.phone || 'غير مسجل')}</strong> | الرتبة الحالية: <strong style="color:var(--accent);">${escapeHtml(userRole)}</strong></div>
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                    <select id="${selectId}" style="padding:6px; border-radius:6px; border:1px solid #ccc;">
                        <option value="admin" ${userRole === 'admin' ? 'selected' : ''}>مدير</option>
                        <option value="assistant_manager" ${userRole === 'assistant_manager' ? 'selected' : ''}>مساعد مدير</option>
                        <option value="accountant" ${userRole === 'accountant' ? 'selected' : ''}>محاسب</option>
                        <option value="employee" ${userRole === 'employee' ? 'selected' : ''}>موظف</option>
                        <option value="driver" ${userRole === 'driver' ? 'selected' : ''}>سائق</option>
                        <option value="customer" ${userRole === 'customer' ? 'selected' : ''}>عميل</option>
                    </select>
                    <button type="button" onclick="changeUserRole(decodeURIComponent('${encodedEmail}'))" style="background:#234d39; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">تحديث الرتبة</button>
                    ${deleteBtnHtml}
                </div>
            </div>`;
    }).join('');
}

async function loadAllUsers() {
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    if (!isAdminRole(currentUserRole)) {
        list.innerHTML = '<p style="color:#dc2626; font-weight:bold;">عذراً، عرض وتعديل الرتب والصلاحيات متاح للمدير العام (Admin) فقط.</p>';
        return;
    }

    ensureAdminUsersSearchUI();
    list.innerHTML = '<p style="color:#888; text-align:center; padding:12px;">جاري تحميل الحسابات...</p>';

    try {
        const snapshot = await getDocs(query(collection(db, "users"), limit(300)));
        adminUsersCache = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            adminUsersCache.push({ email: docSnap.id, ...data });
        });
        renderAdminUsersList();
    } catch (e) {
        list.innerHTML = '<p style="color:#dc2626;">خطأ في تحميل الحسابات: ' + escapeHtml(e.message) + '</p>';
    }
}

window.changeUserRole = async function(email) {
    if (!isAdminRole(currentUserRole)) {
        alert('عذراً، تعديل الرتب والصلاحيات مخصص للمدير العام (Admin) فقط.');
        return;
    }
    const selectId = getUserRoleSelectId(email);
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;
    const newRole = selectEl.value;
    try {
        await updateDoc(doc(db, "users", email), { 
            role: newRole,
            rol: newRole,
            col: newRole 
        });
        const cachedUser = adminUsersCache.find(u => u.email === email);
        if (cachedUser) {
            cachedUser.role = newRole;
            cachedUser.rol = newRole;
            cachedUser.col = newRole;
        }
        alert('تم تحديث رتبة وصلاحية المستخدم بنجاح!');
        renderAdminUsersList();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

window.deleteUserAccount = async function(email) {
    if (!isAdminRole(currentUserRole)) {
        alert('عذراً، حذف الحسابات مخصص للمدير العام (Admin) فقط.');
        return;
    }
    if (email === 'haretg@gmail.com' || (currentUser && email === currentUser.email)) {
        alert('لا يمكن حذف حساب المدير الرئيسي أو حسابك الحالي!');
        return;
    }

    const target = adminUsersCache.find(u => u.email === email);
    const displayName = target?.name ? `${target.name} (${email})` : email;
    if (!confirm(`هل أنت متأكد من حذف حساب "${displayName}" نهائياً؟`)) return;

    try {
        await deleteDoc(doc(db, "users", email));
        adminUsersCache = adminUsersCache.filter(u => u.email !== email);
        alert('تم حذف حساب المستخدم بنجاح!');
        renderAdminUsersList();
    } catch (e) {
        alert('خطأ أثناء حذف الحساب: ' + e.message);
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
    if (adminMap) adminMap.invalidateSize();
});
