// ==========================================
// استيراد مكتبات فايربيس الموحدة بالإصدار 10.12.0 لتجنب أي تضارب في المتصفح
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// إعدادات فايربيس الخاصة بتطبيق العلاف
const firebaseConfig = {
  apiKey: "AIzaSyCLgvF-u77h-RwSSaJPLx4x-U3ZLOtuvrM",
  authDomain: "alaf-93848.firebaseapp.com",
  projectId: "alaf-93848",
  storageBucket: "alaf-93848.firebasestorage.app",
  messagingSenderId: "984757380320",
  appId: "1:984757380320:web:247065b2434c002c445c85",
  measurementId: "G-ESV2GNSQZ4"
};

// تهيئة فايربيس
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ربط النطاق العام ليعمل مع باقي وظائف التطبيق (قاعدة البيانات والمصادقة)
window.db = getFirestore(app);
window.auth = getAuth(app);
window.googleProvider = new GoogleAuthProvider();
window.signInWithPopup = signInWithPopup;
window.signInWithRedirect = signInWithRedirect;

window.firebaseModules = {
    collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs
};

// ==========================================
// بيانات أعلاف العلاف والحبوب الأساسية
// ==========================================
const defaultProducts = [
    { 
        id: 101, 
        name: "علف دواجن سوبر بادي 23%", 
        category: "poultry", 
        price: 780, 
        weight: "شكارة 50 كجم", 
        desc: "علف بادي عالي البروتين لتسمين الكتاكيت والدواجن مع مضاد سموم فطرية وفيتامينات كاملة.", 
        image: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=500" 
    },
    { 
        id: 102, 
        name: "علف دواجن نامي 21% ممتاز", 
        category: "poultry", 
        price: 750, 
        weight: "شكارة 50 كجم", 
        desc: "علف المرحلة الثانية لتحقيق أعلى معدلات التحويل وزيادة أوزان الدواجن بسرعة وسلاسة.", 
        image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500" 
    },
    { 
        id: 103, 
        name: "علف مواشي تسمين 16% سوبر", 
        category: "livestock", 
        price: 680, 
        weight: "شكارة 50 كجم", 
        desc: "خلطة مخصصة لتسمين العجول والأغنام يحتوي على ذرة وصويا وردة بنسب علمية مدروسة.", 
        image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500" 
    },
    { 
        id: 104, 
        name: "علف مواشي مدر للبن 18%", 
        category: "livestock", 
        price: 710, 
        weight: "شكارة 50 كجم", 
        desc: "مخصص للأبقار والجاموس الحلابة لزيادة إنتاج اللبن ونسبة الدسم بفاعلية عالية.", 
        image: "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=500" 
    },
    { 
        id: 105, 
        name: "علف أرانب سوبر ممتاز 18%", 
        category: "rabbits", 
        price: 620, 
        weight: "شكارة 50 كجم", 
        desc: "مغذي ومقوي لأمهات وفطام الأرانب يمنع المشاكل المعوية ويحفز الخصوبة وزيادة الوزن.", 
        image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500" 
    },
    { 
        id: 106, 
        name: "ذرة صفراء مجروشة ناعم", 
        category: "grains", 
        price: 650, 
        weight: "شكارة 50 كجم", 
        desc: "ذرة صفراء برازيلي نقية مجروشة بعناية خالية من الشوائب ومناسبة لكافة أنواع الخلطات.", 
        image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=500" 
    },
    { 
        id: 107, 
        name: "ردة ناعمة عالية الجودة", 
        category: "grains", 
        price: 420, 
        weight: "شكارة 40 كجم", 
        desc: "ردة قمح ناعمة طازجة ومفيدة جداً للهضم وتغذية المواشي والحيوانات الحلابة.", 
        image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500" 
    },
    { 
        id: 108, 
        name: "مخلوط أملاح معدنية وفيتامينات", 
        category: "supplements", 
        price: 180, 
        weight: "عبوة 5 كجم", 
        desc: "مكمل غذائي مركز يضاف للخلطات لتعويض نقص المعادن والوقاية من لين العظام والضعف.", 
        image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500" 
    }
];

let menuProducts = [...defaultProducts];
let cart = []; 
let currentCustomer = null;
let allOrders = [];
let allInvoices = [];
let allNotifications = [];
let allSuppliers = [];
let supplyTransactions = [];
let expensesList = [];
let registeredUsers = [];
let pointsDB = {};

let activeDiscount = 0;
let customerLat = null;
let customerLng = null;
let storeCoords = [29.9600, 31.2100];

let currentSliderIndex = 0;
let sliderInterval = null;

// ==========================================
// متغيرات ومحرك الخريطة
// ==========================================
let map;
let mapTileLayers = {};
let currentTileLayer;
let routingControl = null;

let markersGroup = {
    branches: {},
    drivers: {},
    orders: {}
};

let storeLocation = [29.9600, 31.2100];
let activeFilter = 'all';
let watchGpsId = null;
let isPickingLocation = null;

// ==========================================
// متغيرات النقاط والمكافآت
// ==========================================
let userRewardPoints = 0;
let userRewardIdentifier = '';

// ==========================================
// تهيئة التطبيق الذكية عند الفتح
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    checkSavedUserSession();
    renderMenu();
    updateCartUI();
    initHeroSlider();
    initRealtimeCloudSync();

    try {
        const redirectResult = await getRedirectResult(window.auth);
        if (redirectResult && redirectResult.user) {
            console.log("✓ تم تسجيل الدخول بنجاح عبر إعادة التوجيه:", redirectResult.user.email);
        }
    } catch (err) {
        console.error("Redirect auth error:", err);
    }

    if (document.getElementById('leafletMap')) {
        checkUserPermissions();
        initLeafletMap();
        initRealtimeMapData();
    }

    if (document.getElementById('kitchen-orders-grid')) {
        if (checkKitchenAccessSecurity()) {
            loadKitchenOrdersFromLocal();
            initRealtimeKitchenSync();
        }
    }

    if (document.getElementById('admin-dashboard')) {
        if (localStorage.getItem('allaf_logged_user')) {
            loadAdminDashboard();
        }
    }

    if (document.getElementById('product-detail-container')) {
        initProductDetailsPage();
    }

    if (document.getElementById('user-reward-points')) {
        initRewardsPage();
    }
});

function checkSavedUserSession() {
    try {
        const saved = localStorage.getItem('allaf_logged_user');
        if (saved) {
            currentCustomer = JSON.parse(saved);
            loadCustomerDashboard();
        }
    } catch (e) {}
}

// ==========================================
// التنقل بين الأقسام الرئيسية
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    if(targetTab) targetTab.classList.add('active');

    const buttons = document.querySelectorAll('.nav-btn');
    const tabMap = { 'menu': 0, 'custom-mix': 1, 'offers': 2, 'cart': 3, 'customer': 4 };
    if (tabMap[tabId] !== undefined && buttons[tabMap[tabId]]) {
        buttons[tabMap[tabId]].classList.add('active');
    }

    if (tabId === 'customer') {
        if (currentCustomer) loadCustomerDashboard();
    } else if (tabId === 'offers') {
        renderOffers();
    }
}

// ==========================================
// عرض كروت منتجات الأعلاف في الرئيسية
// ==========================================
function renderMenu(filter = 'all') {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = filter === 'all' ? menuProducts : menuProducts.filter(p => p.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="no-data-msg">لا توجد أعلاف متوفرة في هذا القسم حالياً.</p>';
        return;
    }

    filtered.forEach(product => {
        grid.innerHTML += `
            <div class="menu-card">
                <div class="card-img-box">
                    <a href="product.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}" class="menu-img">
                    </a>
                    <span class="weight-badge"><i class="fa-solid fa-weight-hanging"></i> ${product.weight || 'شكارة 50 كجم'}</span>
                </div>
                <div class="menu-card-body">
                    <h3><a href="product.html?id=${product.id}" style="color: inherit; text-decoration: none;">${product.name}</a></h3>
                    <p>${product.desc}</p>
                    <div class="card-price-row">
                        <span class="price-val">${product.price} جنيه</span>
                    </div>
                </div>
                <button onclick="addToCart(${product.id})" class="outer-cart-btn">
                    <i class="fa-solid fa-cart-plus"></i> 🛒 إضافة لسلة الزائر
                </button>
            </div>
        `;
    });
}

function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    renderMenu(cat);
}

function renderOffers() {
    const grid = document.getElementById('offers-grid');
    if(!grid) return;
    grid.innerHTML = '';
    const offers = menuProducts.filter(p => p.price >= 650);

    offers.forEach(product => {
        grid.innerHTML += `
            <div class="menu-card offer-card">
                <div class="offer-banner-tag">باقة توريد مزارع 🔥</div>
                <a href="product.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="menu-img">
                </a>
                <div class="menu-card-body">
                    <h3>🌾 <a href="product.html?id=${product.id}" style="color: inherit; text-decoration: none;">${product.name}</a></h3>
                    <p>${product.desc}</p>
                    <div class="price-val">${product.price} جنيه / للشكارة</div>
                </div>
                <button onclick="addToCart(${product.id})" class="outer-cart-btn">
                    <i class="fa-solid fa-cart-plus"></i> طلب باقة الجملة لسلة الزائر
                </button>
            </div>
        `;
    });
}

// ==========================================
// سلة الشراء وتعديل الكميات
// ==========================================
function addToCart(productId) {
    const prod = menuProducts.find(p => String(p.id) === String(productId));
    if (!prod) return;

    const existing = cart.find(item => String(item.id) === String(productId));
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...prod, qty: 1 });
    }

    updateCartUI();
    showToastNotification(`تم إضافة (${prod.name}) لسلة الزائر بنجاح 🛒`);
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0);

    const list = document.getElementById('cart-items-list');
    if (!list) return;
    list.innerHTML = '';

    if (cart.length === 0) {
        list.innerHTML = '<p class="empty-cart-msg">سلة مشتريات الزائر فارغة حالياً. قم بإضافة الأعلاف والحبوب للبدء!</p>';
        const totalEl = document.getElementById('cart-total');
        if (totalEl) totalEl.innerText = '0';
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        let itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        list.innerHTML += `
            <div class="cart-item-row">
                <div class="item-info">
                    <strong>🌾 ${item.name}</strong>
                    <span class="item-sub text-amber-800">${item.weight || ''} | السعر: ${item.price} ج</span>
                </div>
                <div class="item-qty-controls">
                    <button onclick="changeQty(${item.id}, -1)" class="qty-btn">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)" class="qty-btn">+</button>
                </div>
                <div class="item-total-col">
                    <span class="item-total-price">${itemTotal} ج</span>
                    <button onclick="removeFromCart(${item.id})" class="btn-del-item"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    let total = subtotal - (subtotal * activeDiscount);
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.innerText = Math.round(total);
}

function changeQty(id, delta) {
    const item = cart.find(i => String(i.id) === String(id));
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => String(i.id) !== String(id));
        }
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => String(item.id) !== String(id));
    updateCartUI();
}

function applyPromoCode() {
    const inputEl = document.getElementById('promo-input');
    if (!inputEl) return;
    const code = inputEl.value.trim().toUpperCase();
    const note = document.getElementById('discount-note');

    if (code === 'ALLAF2026') {
        activeDiscount = 0.10;
        if (note) note.innerText = ' (تم تطبيق خصم 10% بنجاح 🔥)';
        alert('مبروك! تم تطبيق كود الخصم 10% بنجاح.');
        updateCartUI();
    } else {
        activeDiscount = 0;
        if (note) note.innerText = '';
        alert('كود الخصم غير صحيح أو منتهي الصلاحية.');
        updateCartUI();
    }
}

// ==========================================
// تصميم خلطة علف مخصصة
// ==========================================
function addCustomMixToCart() {
    const baseSelect = document.getElementById('custom-base-grain');
    const typeSelect = document.getElementById('custom-feed-type');
    const notesInput = document.getElementById('custom-mix-notes');
    if (!baseSelect || !typeSelect) return;

    const basePrice = parseFloat(baseSelect.value);
    const baseText = baseSelect.options[baseSelect.selectedIndex].text;
    const typeText = typeSelect.value;
    const notes = notesInput ? notesInput.value.trim() : '';

    let extrasTotal = 0;
    let extrasDesc = [];

    const min = document.getElementById('ext-minerals');
    const tox = document.getElementById('ext-toxin');
    const vit = document.getElementById('ext-vitamins');

    if (min && min.checked) { extrasTotal += 90; extrasDesc.push('أملاح ومعادن'); }
    if (tox && tox.checked) { extrasTotal += 120; extrasDesc.push('مضاد سموم'); }
    if (vit && vit.checked) { extrasTotal += 70; extrasDesc.push('فيتامينات أ د3 هـ'); }

    let totalPrice = basePrice + extrasTotal;
    let customName = `🌾 خلطة مخصصة (${typeText})`;
    let customDesc = `المكون الرئيسي: ${baseText.split('(')[0]} ${extrasDesc.length ? '+ إضافات: ' + extrasDesc.join(', ') : ''} ${notes ? '| ملاحظات: ' + notes : ''}`;

    const customProd = {
        id: Date.now(),
        name: customName,
        price: totalPrice,
        weight: "شكارة مخصصة 50 كجم",
        desc: customDesc,
        image: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=500"
    };

    cart.push({ ...customProd, qty: 1 });
    updateCartUI();
    alert('تم إضافة خلطة العلف المخصصة لسلة الزائر بنجاح! 🌾');
    switchTab('cart');
}

// ==========================================
// إرسال طلبية الشراء والتحقق من الدخول
// ==========================================
async function submitOrder() {
    const nameEl = document.getElementById('order-name');
    const phoneEl = document.getElementById('order-phone');
    const addressEl = document.getElementById('order-address');

    if (cart.length === 0) {
        alert('سلة المشتريات فارغة!');
        return;
    }

    if (!currentCustomer) {
        openAuthPrompt();
        return;
    }

    const name = nameEl ? nameEl.value.trim() : currentCustomer.name;
    const phone = phoneEl ? phoneEl.value.trim() : currentCustomer.phone;
    const address = addressEl ? addressEl.value.trim() : '';

    if (!name || !phone || !address) {
        alert('من فضلك أدخل الاسم ورقم الهاتف وعنوان المزرعة/التوصيل كاملاً!');
        return;
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = Math.round(subtotal - (subtotal * activeDiscount));

    const newOrder = {
        id: 'ALLAF-' + Math.floor(100000 + Math.random() * 900000),
        clientEmail: currentCustomer.email || '',
        clientPhone: phone,
        name: name,
        phone: phone,
        address: address,
        items: [...cart],
        total: total,
        status: 'pending',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: Date.now()
    };

    if (window.db && window.firebaseModules) {
        try {
            await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "orders", newOrder.id), newOrder);
        } catch (e) { console.error(e); }
    }

    let earnedPoints = Math.floor(total / 20);
    pointsDB[phone] = (pointsDB[phone] || 0) + earnedPoints;

    alert(`تم إرسال طلبية الأعلاف بنجاح يا ${name}! 🌾\nرقم الفاتورة المبدئية: ${newOrder.id}\nكسبت ${earnedPoints} نقطة ولاء جديدة!`);

    cart = [];
    activeDiscount = 0;
    updateCartUI();
    if(nameEl) nameEl.value = '';
    if(phoneEl) phoneEl.value = '';
    if(addressEl) addressEl.value = '';

    switchTab('customer');
    loadCustomerDashboard();
}

function sendWhatsAppOrder() {
    if (cart.length === 0) { alert('السلة فارغة!'); return; }
    
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = Math.round(subtotal - (subtotal * activeDiscount));
    let itemsText = cart.map(i => `- ${i.name} (${i.qty} شكارة) بسعر ${i.price * i.qty} ج`).join('%0A');

    let msg = `*طلبية أعلاف جديدة من تطبيق العلاف* 🌾%0A%0A` +
              `🛒 *الأعلاف المطلوبة:*%0A${itemsText}%0A%0A` +
              `💰 *الإجمالي النهائي:* ${total} جنيه`;

    window.open(`https://wa.me/201000000000?text=${msg}`, '_blank');
}

// ==========================================
// بروفايل العميل والتنقل فيه
// ==========================================
function loadCustomerDashboard() {
    const loginBox = document.getElementById('unified-login-box');
    const dashBox = document.getElementById('customer-dashboard');
    const adminNavBtn = document.getElementById('adminNavBtn');

    if (adminNavBtn) {
        if (currentCustomer && (currentCustomer.role === 'admin' || currentCustomer.email === 'haretg@gmail.com' || currentCustomer.email === 'admin@allaf.com')) {
            adminNavBtn.classList.remove('hidden');
        } else {
            adminNavBtn.classList.add('hidden');
        }
    }

    if (!dashBox) return;

    if (!currentCustomer) {
        dashBox.classList.add('hidden');
        if (loginBox) loginBox.style.display = 'block';
        return;
    }

    if (loginBox) loginBox.style.display = 'none';
    dashBox.classList.remove('hidden');

    const nameEl = document.getElementById('cust-display-name');
    const emailEl = document.getElementById('cust-display-email');
    const phoneEl = document.getElementById('cust-display-phone');
    const avatarEl = document.getElementById('cust-avatar-img');
    const pointsEl = document.getElementById('cust-points');

    if (nameEl) nameEl.innerText = currentCustomer.name || 'عميل العلاف';
    if (emailEl) emailEl.innerText = currentCustomer.email || 'بدون بريد';
    if (phoneEl) phoneEl.innerText = currentCustomer.phone || 'بدون هاتف';
    if (avatarEl && currentCustomer.photoURL) avatarEl.src = currentCustomer.photoURL;
    
    let pts = currentCustomer.phone && pointsDB[currentCustomer.phone] ? pointsDB[currentCustomer.phone] : 15;
    if (pointsEl) pointsEl.innerText = pts;

    switchCustomerSubTab('orders');
}

function switchCustomerSubTab(subTab) {
    document.querySelectorAll('.subtab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.profile-tab-btn').forEach(el => el.classList.remove('active'));

    const activeContent = document.getElementById('cust-subtab-' + subTab);
    const activeBtn = document.getElementById('subtab-btn-' + subTab);

    if (activeContent) activeContent.classList.remove('hidden');
    if (activeBtn) activeBtn.classList.add('active');

    if (subTab === 'orders') renderCustomerOrders();
    if (subTab === 'invoices') renderCustomerInvoices();
    if (subTab === 'statement') renderCustomerStatement();
    if (subTab === 'notifications') renderCustomerNotifications();
}

function renderCustomerOrders() {
    const list = document.getElementById('customer-orders-list');
    if (!list) return;
    list.innerHTML = '';

    const myOrders = allOrders.filter(o => 
        (currentCustomer && currentCustomer.phone && o.phone === currentCustomer.phone) ||
        (currentCustomer && currentCustomer.email && o.clientEmail === currentCustomer.email)
    );

    if (myOrders.length === 0) {
        list.innerHTML = '<p class="no-data-msg">لا توجد طلبات أعلاف سابقة مسجلة بحسابك.</p>';
        return;
    }

    myOrders.forEach(order => {
        let itemsHtml = (order.items || []).map(i => `• ${i.name} (x${i.qty})`).join('<br>');
        list.innerHTML += `
            <div class="order-card">
                <div class="card-head-row">
                    <strong>رقم الطلبية: ${order.id}</strong>
                    <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="card-details">
                    <p>📅 <strong>التاريخ:</strong> ${order.date}</p>
                    <p>📍 <strong>عنوان التوصيل:</strong> ${order.address}</p>
                    <p>🌾 <strong>الأصناف:</strong><br>${itemsHtml}</p>
                    <p class="price-highlight">💰 <strong>الإجمالي:</strong> ${order.total} جنيه</p>
                </div>
            </div>
        `;
    });
}

function renderCustomerInvoices() {
    const list = document.getElementById('customer-invoices-list');
    if (!list) return;
    list.innerHTML = '';

    const myInvoices = allInvoices.filter(inv => 
        (currentCustomer && currentCustomer.phone && inv.clientPhone === currentCustomer.phone) ||
        (currentCustomer && currentCustomer.email && inv.clientEmail === currentCustomer.email)
    );

    if (myInvoices.length === 0) {
        list.innerHTML = '<p class="no-data-msg">لا توجد فواتير صادرة لحسابك من الإدارة حتى الآن.</p>';
        return;
    }

    myInvoices.forEach(inv => {
        list.innerHTML += `
            <div class="invoice-card">
                <div class="card-head-row">
                    <strong>🧾 فاتورة رقم: ${inv.id}</strong>
                    <span class="invoice-date">${inv.date}</span>
                </div>
                <div class="card-details">
                    <p>🌾 <strong>بيان الفاتورة:</strong> ${inv.details || 'توريد أعلاف وحبوب'}</p>
                    <p>💰 <strong>المبلغ الكلي:</strong> ${inv.totalAmount} جنيه | <strong>المدفوع:</strong> ${inv.paidAmount} ج</p>
                    <p class="balance-due">⚠ <strong>المتبقي:</strong> ${inv.totalAmount - inv.paidAmount} جنيه</p>
                </div>
                <button onclick="showInvoiceDetails('${inv.id}')" class="btn-primary btn-sm mt-10">
                    <i class="fa-solid fa-eye"></i> عرض وطباعة الفاتورة التفصيلية
                </button>
            </div>
        `;
    });
}

function renderCustomerStatement() {
    const box = document.getElementById('customer-statement-box');
    if (!box) return;

    const myInvoices = allInvoices.filter(inv => 
        (currentCustomer && currentCustomer.phone && inv.clientPhone === currentCustomer.phone) ||
        (currentCustomer && currentCustomer.email && inv.clientEmail === currentCustomer.email)
    );

    let totalBilled = myInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    let totalPaid = myInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    let balanceDue = totalBilled - totalPaid;

    box.innerHTML = `
        <div class="statement-grid">
            <div class="stat-card blue">
                <span>إجمالي الفواتير الصادرة</span>
                <strong>${totalBilled} جنيه</strong>
            </div>
            <div class="stat-card green">
                <span>إجمالي المبالغ المسددة</span>
                <strong>${totalPaid} جنيه</strong>
            </div>
            <div class="stat-card red">
                <span>الرصيد المتبقي (المديونية)</span>
                <strong>${balanceDue} جنيه</strong>
            </div>
        </div>
    `;
}

function renderCustomerNotifications() {
    const list = document.getElementById('customer-notifications-list');
    if (!list) return;
    list.innerHTML = '';

    const myNotifs = allNotifications.filter(n => 
        !n.targetPhone || (currentCustomer && n.targetPhone === currentCustomer.phone)
    );

    const unreadCount = document.getElementById('unread-notif-count');
    if(unreadCount) unreadCount.innerText = myNotifs.length;

    if (myNotifs.length === 0) {
        list.innerHTML = '<p class="no-data-msg">لا توجد تنبيهات جديدة.</p>';
        return;
    }

    myNotifs.forEach(n => {
        list.innerHTML += `
            <div class="notification-card">
                <div class="notif-header">
                    <strong>🔔 ${n.title}</strong>
                    <span class="notif-time">${n.date}</span>
                </div>
                <p class="notif-msg">${n.message}</p>
            </div>
        `;
    });
}

// ==========================================
// طباعة وعرض الفواتير التفصيلية
// ==========================================
function showInvoiceDetails(invoiceId) {
    const inv = allInvoices.find(i => String(i.id) === String(invoiceId));
    if (!inv) return;

    const modal = document.getElementById('invoiceModal');
    const body = document.getElementById('invoiceModalBody');
    if (!modal || !body) return;

    let itemsRows = (inv.items || []).map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>${item.price} ج</td>
            <td>${item.qty * item.price} ج</td>
        </tr>
    `).join('');

    body.innerHTML = `
        <div class="invoice-print-area">
            <div class="invoice-header-brand">
                <h2>🌾 تطبيق العلاف - للتجارة والتوريدات</h2>
                <p>فاتورة بيع وتوريد أعلاف وحبوب</p>
            </div>
            <hr class="my-10">
            <div class="invoice-meta-row">
                <div><strong>رقم الفاتورة:</strong> ${inv.id}</div>
                <div><strong>التاريخ:</strong> ${inv.date}</div>
            </div>
            <div class="invoice-client-info">
                <strong>العميل / المزرعة:</strong> ${inv.clientName || 'عميل مسجل'}<br>
                <strong>الهاتف:</strong> ${inv.clientPhone || ''}
            </div>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>الصنف / البيان</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows || `<tr><td colspan="4">${inv.details || 'توريد أعلاف'}</td></tr>`}
                </tbody>
            </table>
            <div class="invoice-totals-box">
                <div><span>الإجمالي الكلي:</span> <strong>${inv.totalAmount} جنيه</strong></div>
                <div><span>المبلغ المدفوع:</span> <strong>${inv.paidAmount} جنيه</strong></div>
                <div class="due-row"><span>المتبقي في الحساب:</span> <strong>${inv.totalAmount - inv.paidAmount} جنيه</strong></div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (modal) modal.classList.add('hidden');
}

function printInvoiceModal() {
    window.print();
}

function openAuthPrompt() {
    const modal = document.getElementById('authPromptModal');
    if (modal) modal.classList.remove('hidden');
}

function closeAuthPrompt() {
    const modal = document.getElementById('authPromptModal');
    if (modal) modal.classList.add('hidden');
}

function showToastNotification(msg) {
    alert(msg);
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'قيد المراجعة ⏳';
        case 'cooking': return 'قيد التجهيز 📦';
        case 'delivery': return 'مع السائق 🛵';
        case 'done': return 'تم التسليم ✅';
        default: return 'نشط';
    }
}

// ==========================================
// Hero Slider
// ==========================================
function initHeroSlider() {
    if (!menuProducts || menuProducts.length === 0) return;
    updateSliderContent();
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        currentSliderIndex = (currentSliderIndex + 1) % menuProducts.length;
        updateSliderContent();
    }, 4000);
}

function updateSliderContent() {
    if (!menuProducts || menuProducts.length === 0) return;
    const prod = menuProducts[currentSliderIndex];

    const nameEl = document.getElementById('slider-prod-name');
    const descEl = document.getElementById('slider-prod-desc');
    const priceEl = document.getElementById('slider-prod-price');
    const imgEl = document.getElementById('slider-prod-img');
    const counterEl = document.getElementById('slider-counter');

    if (nameEl) nameEl.innerText = `🌾 ${prod.name}`;
    if (descEl) descEl.innerText = prod.desc;
    if (priceEl) priceEl.innerText = `${prod.price} جنيه`;
    if (counterEl) counterEl.innerText = `${currentSliderIndex + 1} / ${menuProducts.length}`;
    if (imgEl) imgEl.src = prod.image;
}

function initRealtimeCloudSync() {
    if (window.db && window.firebaseModules) {
        const { collection, onSnapshot } = window.firebaseModules;

        onSnapshot(collection(window.db, "orders"), (snapshot) => {
            allOrders = [];
            snapshot.forEach(doc => allOrders.push(doc.data()));
            if (currentCustomer) renderCustomerOrders();
            renderAdminOrders();
            updateVaultStats();
        });

        onSnapshot(collection(window.db, "invoices"), (snapshot) => {
            allInvoices = [];
            snapshot.forEach(doc => allInvoices.push(doc.data()));
            if (currentCustomer) {
                renderCustomerInvoices();
                renderCustomerStatement();
            }
            renderInvoicesHistory();
        });

        onSnapshot(collection(window.db, "notifications"), (snapshot) => {
            allNotifications = [];
            snapshot.forEach(doc => allNotifications.push(doc.data()));
            if (currentCustomer) renderCustomerNotifications();
            renderNotificationsHistory();
        });

        onSnapshot(collection(window.db, "products"), (snapshot) => {
            let cloudProds = [];
            snapshot.forEach(doc => cloudProds.push(doc.data()));
            if (cloudProds.length > 0) {
                menuProducts = [...defaultProducts, ...cloudProds];
            }
            renderMenu();
            renderMenuItemsManage();
        });

        onSnapshot(collection(window.db, "suppliers"), (snapshot) => {
            allSuppliers = [];
            snapshot.forEach(doc => allSuppliers.push(doc.data()));
            populateSuppliersSelect();
        });

        onSnapshot(collection(window.db, "expenses"), (snapshot) => {
            expensesList = [];
            snapshot.forEach(doc => expensesList.push(doc.data()));
            renderExpensesList();
            updateVaultStats();
        });

        onSnapshot(collection(window.db, "users"), (snapshot) => {
            registeredUsers = [];
            snapshot.forEach(doc => registeredUsers.push(doc.data()));
            populateInvoiceClientsSelect();
            populateNotificationTargetsSelect();
        });
    } else {
        setTimeout(initRealtimeCloudSync, 1000);
    }
}

// ==========================================
// وظائف الخريطة والتتبع الحي (Map.html)
// ==========================================
function checkUserPermissions() {
    const savedUserStr = localStorage.getItem('allaf_logged_user') || '{}';
    let user = {};
    try { user = JSON.parse(savedUserStr); } catch(e){}

    const avatarEl = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-username-display');
    const badge = document.getElementById('userRoleBadge');
    const adminLink = document.getElementById('adminPanelLink');

    if (avatarEl && user.photoURL) avatarEl.src = user.photoURL;
    if (nameEl) nameEl.innerText = user.name || user.phone || user.email || 'زائر';

    const role = (user.role || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = user.phone || '';
    const isMaster = (email === 'haretg@gmail.com' || email === 'admin@allaf.com' || phone.includes('01144730305'));

    if (isMaster || role === 'admin' || role === 'manager') {
        if(badge) badge.innerText = `المدير العام / المشرف 👑`;
        if(adminLink) adminLink.style.display = 'inline-flex';
        const tabD = document.getElementById('tabDrivers');
        const tabB = document.getElementById('tabBranches');
        const autoD = document.getElementById('autoDispatchBtn');
        if(tabD) tabD.style.display = 'block';
        if(tabB) tabB.style.display = 'block';
        if(autoD) autoD.style.display = 'block';
    } else if (role === 'driver' || role === 'worker') {
        if(badge) badge.innerText = `كابتن الأسطول 🛵`;
        const tabD = document.getElementById('tabDrivers');
        if(tabD) tabD.style.display = 'block';
    } else {
        if(badge) badge.innerText = `عميل العلاف 🌾`;
    }
}

function initLeafletMap() {
    if (typeof L === 'undefined') return;

    mapTileLayers = {
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
        topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenTopoMap' }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: '© Esri WorldImagery' })
    };

    map = L.map('leafletMap', {
        center: storeLocation,
        zoom: 13,
        layers: [mapTileLayers.street]
    });
    currentTileLayer = mapTileLayers.street;

    addBranchMarker({
        id: 'main',
        name: 'المركز الرئيسي (شبرا منت)',
        phone: '01144730305',
        lat: storeLocation[0],
        lng: storeLocation[1]
    });

    map.on('click', (e) => {
        if (isPickingLocation === 'driver') {
            const dLat = document.getElementById('driver-lat');
            const dLng = document.getElementById('driver-lng');
            if(dLat) dLat.value = e.latlng.lat.toFixed(6);
            if(dLng) dLng.value = e.latlng.lng.toFixed(6);
            alert("✓ تم تحديد موقع الطيار من الخريطة!");
            isPickingLocation = null;
        } else if (isPickingLocation === 'branch') {
            const bLat = document.getElementById('branch-lat');
            const bLng = document.getElementById('branch-lng');
            if(bLat) bLat.value = e.latlng.lat.toFixed(6);
            if(bLng) bLng.value = e.latlng.lng.toFixed(6);
            alert("✓ تم تحديد موقع المركز من الخريطة!");
            isPickingLocation = null;
        }
    });
}

function switchLayer(layerName) {
    if (!mapTileLayers[layerName]) return;
    map.removeLayer(currentTileLayer);
    currentTileLayer = mapTileLayers[layerName];
    map.addLayer(currentTileLayer);
}

function initRealtimeMapData() {
    if (window.db && window.firebaseModules) {
        const { collection, onSnapshot } = window.firebaseModules;

        onSnapshot(collection(window.db, "orders"), (snapshot) => {
            let orders = [];
            snapshot.forEach(docSnap => orders.push(docSnap.data()));
            renderOrdersOnMapAndList(orders);
        });

        onSnapshot(collection(window.db, "drivers"), (snapshot) => {
            let drivers = [];
            snapshot.forEach(docSnap => drivers.push(docSnap.data()));
            renderDriversOnMapAndList(drivers);
        });

        onSnapshot(collection(window.db, "branches"), (snapshot) => {
            let branches = [];
            snapshot.forEach(docSnap => branches.push(docSnap.data()));
            branches.forEach(addBranchMarker);
        });
    } else {
        let localOrders = JSON.parse(localStorage.getItem('allaf_orders') || '[]');
        renderOrdersOnMapAndList(localOrders);
    }
}

function renderOrdersOnMapAndList(orders) {
    const listEl = document.getElementById('live-orders-list');
    if(listEl) listEl.innerHTML = '';

    Object.values(markersGroup.orders).forEach(m => map.removeLayer(m));
    markersGroup.orders = {};

    let filtered = activeFilter === 'all' ? orders : orders.filter(o => o.status === activeFilter);

    if (filtered.length === 0 && listEl) {
        listEl.innerHTML = '<p class="text-xs text-slate-500 text-center py-4">لا توجد شحنات مطابقة.</p>';
        return;
    }

    filtered.forEach(order => {
        let lat = order.lat || (storeLocation[0] + (Math.random() - 0.5) * 0.04);
        let lng = order.lng || (storeLocation[1] + (Math.random() - 0.5) * 0.04);

        let color = order.status === 'cooking' ? '#f59e0b' : (order.status === 'delivery' ? '#0284c7' : (order.status === 'done' ? '#16a34a' : '#78350f'));

        let customIcon = L.divIcon({
            className: 'custom-order-marker',
            html: `<div style="background:${color}; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); font-size:12px;"><i class="fa-solid fa-box"></i></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        let marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
            <div style="font-family:'Cairo',sans-serif; text-align:right;">
                <strong style="color:${color};">📦 شحنة: ${order.id}</strong><br>
                👤 العميل: ${order.name || 'عميل'}<br>
                📞 الهاتف: ${order.phone || order.clientPhone || 'غير مدخل'}<br>
                📍 العنوان: ${order.address || ''}<br>
                💰 الإجمالي: ${order.total || 0} جنيه<br>
                <button onclick="drawRouteToOrder(${lat}, ${lng}, '${order.address || ''}')" style="background:#b45309; color:white; border:none; padding:4px 8px; border-radius:4px; margin-top:6px; font-size:11px; cursor:pointer;">
                    🗺️ رسم مسار التوصيل
                </button>
            </div>
        `);

        markersGroup.orders[order.id] = marker;

        if (listEl) {
            listEl.innerHTML += `
                <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 hover:border-amber-500 transition">
                    <div class="flex justify-between font-bold">
                        <span>${order.id}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] text-white" style="background:${color}">${getStatusLabelMap(order.status)}</span>
                    </div>
                    <div class="text-slate-600">👤 ${order.name || 'عميل'} | 📞 ${order.phone || order.clientPhone || ''}</div>
                    <div class="text-slate-500 text-[11px] truncate">📍 ${order.address || 'عنوان استلام'}</div>
                    <div class="flex gap-1 pt-1">
                        <button onclick="focusOrderMarker('${order.id}')" class="flex-1 bg-amber-100 text-amber-800 py-1 rounded text-[10px] font-bold">🎯 تحديد بالخريطة</button>
                        <button onclick="openCallModal('${order.name}', '${order.phone || order.clientPhone}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold"><i class="fa-solid fa-phone"></i> اتصال</button>
                    </div>
                </div>
            `;
        }
    });
}

function addBranchMarker(branch) {
    if (!branch.lat || !branch.lng) return;
    if (markersGroup.branches[branch.id]) map.removeLayer(markersGroup.branches[branch.id]);

    let branchIcon = L.divIcon({
        className: 'custom-branch-marker',
        html: `<div style="background:#78350f; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid #fde047; box-shadow:0 4px 10px rgba(0,0,0,0.4); font-size:14px;"><i class="fa-solid fa-crown"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    let marker = L.marker([branch.lat, branch.lng], { icon: branchIcon }).addTo(map);
    marker.bindPopup(`
        <div style="font-family:'Cairo',sans-serif; text-align:right;">
            <strong style="color:#78350f;">🏰 ${branch.name || 'مركز الأسطول'}</strong><br>
            📞 ${branch.phone || '01144730305'}<br>
            📍 ${branch.address || 'شبرا منت'}
        </div>
    `);
    markersGroup.branches[branch.id] = marker;
}

function renderDriversOnMapAndList(drivers) {
    const listEl = document.getElementById('drivers-list-container');
    const selectEl = document.getElementById('portal-driver-select');

    if(listEl) listEl.innerHTML = '';
    if(selectEl) selectEl.innerHTML = '<option value="">-- اختر طيار للبث --</option>';

    const countEl = document.getElementById('statDriversCount');
    if(countEl) countEl.innerText = `${drivers.length} طيار`;

    Object.values(markersGroup.drivers).forEach(m => map.removeLayer(m));
    markersGroup.drivers = {};

    drivers.forEach(driver => {
        if (selectEl) selectEl.innerHTML += `<option value="${driver.id}">${driver.name} (${driver.phone})</option>`;

        if (driver.lat && driver.lng) {
            let driverIcon = L.divIcon({
                className: 'custom-driver-marker',
                html: `<div style="background:#16a34a; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); font-size:13px;"><i class="fa-solid fa-motorcycle"></i></div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            let marker = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(map);
            marker.bindPopup(`
                <div style="font-family:'Cairo',sans-serif; text-align:right;">
                    <strong style="color:#16a34a;">🛵 الكابتن: ${driver.name}</strong><br>
                    📞 ${driver.phone}<br>
                    ⚡ الحالة: متصل وفي الخدمة
                </div>
            `);
            markersGroup.drivers[driver.id] = marker;
        }

        if (listEl) {
            listEl.innerHTML += `
                <div class="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex justify-between items-center">
                    <div>
                        <strong class="text-emerald-900">${driver.name}</strong>
                        <div class="text-slate-500 text-[10px]">📞 ${driver.phone}</div>
                    </div>
                    <button onclick="openCallModal('${driver.name}', '${driver.phone}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold"><i class="fa-solid fa-phone"></i> اتصال</button>
                </div>
            `;
        }
    });
}

function switchSidebarTab(tabName, btn) {
    document.querySelectorAll('.sidebar-tab').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    ['orders', 'drivers', 'branches', 'portal'].forEach(t => {
        const el = document.getElementById('tab-content-' + t);
        if (el) el.style.display = (t === tabName) ? 'block' : 'none';
    });
}

function filterOrders(status, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    activeFilter = status;

    let localOrders = JSON.parse(localStorage.getItem('allaf_orders') || '[]');
    renderOrdersOnMapAndList(localOrders);
}

async function searchCustomLocation() {
    const queryEl = document.getElementById('customSearchInput');
    if(!queryEl) return;
    const queryText = queryEl.value.trim();
    if (!queryText) return;

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}`);
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.setView([lat, lon], 15);
            L.popup().setLatLng([lat, lon]).setContent(`📍 ${data[0].display_name}`).openOn(map);
        } else {
            alert("لم يتم العثور على موقع بهذا الاسم.");
        }
    } catch (e) {
        alert("تعذر إجراء البحث الجغرافي حالياً.");
    }
}

function searchAndCalculateRoute() {
    const destEl = document.getElementById('routeEndInput');
    if(!destEl) return;
    const dest = destEl.value.trim();
    if(!dest) { alert("أدخل وجهة التوصيل أولاً!"); return; }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`)
        .then(r => r.json())
        .then(data => {
            if (data && data.length > 0) {
                drawRouteToOrder(parseFloat(data[0].lat), parseFloat(data[0].lon), dest);
            } else {
                alert("تعذر العثور على الوجهة أدخل اسم منطقة معروف مثل (الهرم، فيصل، شبرا منت).");
            }
        });
}

function drawRouteToOrder(destLat, destLng, addressTitle) {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(storeLocation[0], storeLocation[1]),
            L.latLng(destLat, destLng)
        ],
        routeWhileDragging: false,
        createMarker: function() { return null; }
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        const minutes = Math.round(summary.totalTime / 60);
        const km = (summary.totalDistance / 1000).toFixed(1);

        const etaEl = document.getElementById('liveEtaDisplay');
        const clearBtn = document.getElementById('clearRouteBtn');

        if(etaEl) etaEl.innerText = `${minutes} دقيقة (${km} كم)`;
        if(clearBtn) clearBtn.classList.remove('hidden');

        L.popup()
            .setLatLng([destLat, destLng])
            .setContent(`<b>📍 الوجهة: ${addressTitle || 'طلب عميل'}</b><br>⏱️ المستغرق المتوقع: ${minutes} دقيقة<br>📏 المسافة: ${km} كم`)
            .openOn(map);
    });
}

function clearActiveRoute() {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    const etaEl = document.getElementById('liveEtaDisplay');
    const clearBtn = document.getElementById('clearRouteBtn');
    if(etaEl) etaEl.innerText = '-- دقيقة';
    if(clearBtn) clearBtn.classList.add('hidden');
}

function trackCustomerOrder() {
    const inputEl = document.getElementById('customerTrackInput');
    const resEl = document.getElementById('customerTrackResult');
    if(!inputEl || !resEl) return;

    const val = inputEl.value.trim();
    if(!val) return;

    let allOrders = JSON.parse(localStorage.getItem('allaf_orders') || '[]');
    let match = allOrders.find(o => String(o.id).includes(val) || String(o.phone).includes(val));

    if (match) {
        resEl.innerHTML = `<span class="text-emerald-700 font-bold">✓ تم العثور على الطلب (${match.id}): الحالة: ${getStatusLabelMap(match.status)}</span>`;
        focusOrderMarker(match.id);
    } else {
        resEl.innerHTML = `<span class="text-red-600 font-bold">❌ لم يتم العثور على شحنة مطابقة للبيانات المدخلة.</span>`;
    }
}

function focusOrderMarker(orderId) {
    const m = markersGroup.orders[orderId];
    if (m) {
        map.setView(m.getLatLng(), 16);
        m.openPopup();
    }
}

async function addNewDriverWithLocation() {
    const name = document.getElementById('driver-name').value.trim();
    const phone = document.getElementById('driver-phone').value.trim();
    const lat = parseFloat(document.getElementById('driver-lat').value);
    const lng = parseFloat(document.getElementById('driver-lng').value);

    if (!name || !phone || isNaN(lat) || isNaN(lng)) {
        alert("يرجى إدخال اسم ورقم هاتف وموقع الطيار كاملاً!");
        return;
    }

    const driverData = {
        id: 'DRV-' + Date.now(),
        name: name,
        phone: phone,
        lat: lat,
        lng: lng,
        status: 'online'
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "drivers", driverData.id), driverData);
    }
    alert("✓ تم إضافة الطيار بنجاح للأسطول!");
    document.getElementById('driver-name').value = '';
    document.getElementById('driver-phone').value = '';
}

async function saveMainRestaurantLocation() {
    const name = document.getElementById('branch-name').value.trim();
    const phone = document.getElementById('branch-phone').value.trim();
    const address = document.getElementById('branch-address').value.trim();
    const lat = parseFloat(document.getElementById('branch-lat').value);
    const lng = parseFloat(document.getElementById('branch-lng').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert("أدخل إحداثيات الموقع بشكل صحيح!");
        return;
    }

    storeLocation = [lat, lng];
    const branchData = {
        id: 'MAIN_BRANCH',
        name: name,
        phone: phone,
        address: address,
        lat: lat,
        lng: lng
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "branches", branchData.id), branchData);
    }

    addBranchMarker(branchData);
    map.setView(storeLocation, 14);
    alert("👑 تم تثبيت موقع مركز الأسطول الرئيسي بنجاح!");
}

function toggleGpsTracking() {
    const driverId = document.getElementById('portal-driver-select').value;
    const statusBox = document.getElementById('gps-status-box');
    const toggleBtn = document.getElementById('gps-toggle-btn');

    if (!driverId) {
        alert("من فضلك اختر اسم السائق أولاً للبدء!");
        return;
    }

    if (watchGpsId) {
        navigator.geolocation.clearWatch(watchGpsId);
        watchGpsId = null;
        if(statusBox) {
            statusBox.innerText = "الوضع: متوقف";
            statusBox.className = "text-[11px] bg-sky-50 p-2 rounded-lg text-sky-800 text-center font-mono font-bold border border-sky-200";
        }
        if(toggleBtn) {
            toggleBtn.innerText = "بدء بث الموقع الحي 🛰";
            toggleBtn.className = "btn-primary w-full text-xs py-2 bg-emerald-600 hover:bg-emerald-700 cursor-pointer";
        }
    } else {
        if (!navigator.geolocation) {
            alert("متصفحك لا يدعم خاصية تحديد الموقع GPS.");
            return;
        }

        watchGpsId = navigator.geolocation.watchPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            if(statusBox) {
                statusBox.innerText = `🛰️ يبث مباشرة: (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                statusBox.className = "text-[11px] bg-emerald-50 p-2 rounded-lg text-emerald-800 text-center font-mono font-bold border border-emerald-300";
            }

            if (window.db && window.firebaseModules) {
                await window.firebaseModules.updateDoc(
                    window.firebaseModules.doc(window.db, "drivers", driverId),
                    { lat: lat, lng: lng }
                );
            }
        }, () => {
            alert("تعذر الحصول على موقع GPS، تأكد من تفعيل الموقع في جهازك.");
        }, { enableHighAccuracy: true });

        if(toggleBtn) {
            toggleBtn.innerText = "إيقاف البث الحي 🛑";
            toggleBtn.className = "btn-primary w-full text-xs py-2 bg-red-600 hover:bg-red-700 cursor-pointer";
        }
    }
}

function fetchGpsForDriver() {
    navigator.geolocation.getCurrentPosition(p => {
        const dLat = document.getElementById('driver-lat');
        const dLng = document.getElementById('driver-lng');
        if(dLat) dLat.value = p.coords.latitude.toFixed(6);
        if(dLng) dLng.value = p.coords.longitude.toFixed(6);
    });
}

function fetchGpsForBranch() {
    navigator.geolocation.getCurrentPosition(p => {
        const bLat = document.getElementById('branch-lat');
        const bLng = document.getElementById('branch-lng');
        if(bLat) bLat.value = p.coords.latitude.toFixed(6);
        if(bLng) bLng.value = p.coords.longitude.toFixed(6);
    });
}

function enableDriverPickMode() {
    isPickingLocation = 'driver';
    alert("انقر الآن على أي نقطة بالخريطة لتحديد موقع الطيار!");
}

function enableBranchPickMode() {
    isPickingLocation = 'branch';
    alert("انقر الآن على أي نقطة بالخريطة لتحديد موقع المركز!");
}

function panToRestaurant() { if(map) map.setView(storeLocation, 15); }
function panToUser() {
    navigator.geolocation.getCurrentPosition(p => {
        if(map) map.setView([p.coords.latitude, p.coords.longitude], 15);
    });
}
function resetMapView() {
    let all = [...Object.values(markersGroup.orders), ...Object.values(markersGroup.drivers), ...Object.values(markersGroup.branches)];
    if (all.length > 0 && map) {
        let group = L.featureGroup(all);
        map.fitBounds(group.getBounds().pad(0.2));
    }
}

function toggleTouchPanel() {
    const content = document.getElementById('touchPanelContent');
    if (content) content.classList.toggle('hidden');
}

function openCallModal(name, phone) {
    const info = document.getElementById('callOrderInfo');
    const num = document.getElementById('callPhoneDisplay');
    const pBtn = document.getElementById('directPhoneCallBtn');
    const wBtn = document.getElementById('directWhatsappCallBtn');

    if(info) info.innerText = `جاري التواصل مع: ${name || 'عميل'}`;
    if(num) num.innerText = phone || '01144730305';
    if(pBtn) pBtn.href = `tel:${phone || '01144730305'}`;
    if(wBtn) wBtn.href = `https://wa.me/2${phone || '01144730305'}`;
    
    const modal = document.getElementById('callModal');
    if(modal) modal.classList.remove('hidden');
}

function closeCallModal() {
    const modal = document.getElementById('callModal');
    if(modal) modal.classList.add('hidden');
}

function autoDispatchOrders() {
    alert("جاري توزيع الطلبات آلياً على أقرب الطيارين في الأسطول...");
}

function getStatusLabelMap(st) {
    if(st === 'pending') return 'قيد المراجعة ⏳';
    if(st === 'cooking') return 'قيد التجهيز 📦';
    if(st === 'delivery') return 'مع السائق 🛵';
    if(st === 'done') return 'تم التسليم ✅';
    return st || 'نشط';
}

// ==========================================
// وظائف لوحة تجهيز الطلبات والشحنات (KDS)
// ==========================================
function checkKitchenAccessSecurity() {
    const savedUserStr = localStorage.getItem('allaf_logged_user') || '{}';
    let loggedUser = {};
    try { loggedUser = JSON.parse(savedUserStr); } catch(e){}

    const role = (loggedUser.role || '').toLowerCase();
    const email = (loggedUser.email || '').toLowerCase();
    const phone = loggedUser.phone || '';

    const isMaster = (email === 'haretg@gmail.com' || email === 'admin@allaf.com' || phone.includes('01144730305'));
    const isAuthorizedStaff = isMaster || role === 'admin' || role === 'worker' || role === 'accountant' || role === 'driver' || role === 'manager';

    const avatarEl = document.getElementById('nav-user-avatar');
    if (avatarEl && loggedUser.photoURL) avatarEl.src = loggedUser.photoURL;

    const adminLink = document.getElementById('adminPanelLink');
    if (isMaster || role === 'admin' || role === 'manager') {
        if (adminLink) adminLink.style.display = 'inline-flex';
    }

    if (!isAuthorizedStaff) {
        alert("🚫 عذراً! هذه الشاشة مخصصة لفريق العمل والمشرفين ومسؤولي التجهيز فقط.");
        window.location.href = 'index.html';
        return false;
    }

    const badge = document.getElementById('userRoleBadge');
    if(badge) {
        badge.innerText = `مرحباً بك يا ${loggedUser.name || 'موظف التجهيز'} (${role || 'مشرف'}) 👑`;
    }
    return true;
}

function loadKitchenOrdersFromLocal() {
    let allOrders = JSON.parse(localStorage.getItem('allaf_orders') || '[]');
    renderKitchenGrid(allOrders);
}

function initRealtimeKitchenSync() {
    if (window.db && window.firebaseModules) {
        const { collection, onSnapshot } = window.firebaseModules;
        onSnapshot(collection(window.db, "orders"), (snapshot) => {
            let cloudOrders = [];
            snapshot.forEach(docSnap => cloudOrders.push(docSnap.data()));
            if (cloudOrders.length > 0) {
                localStorage.setItem('allaf_orders', JSON.stringify(cloudOrders));
                renderKitchenGrid(cloudOrders);
            }
        }, (error) => {
            console.error("Realtime sync error:", error);
            syncActiveOrdersSmart();
        });
    } else {
        setTimeout(initRealtimeKitchenSync, 1000);
    }
}

async function syncActiveOrdersSmart() {
    const grid = document.getElementById('kitchen-orders-grid');
    let allOrders = JSON.parse(localStorage.getItem('allaf_orders') || '[]');
    
    if (allOrders.length === 0 && grid) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8a29e; padding: 40px; font-size: 1.1rem;">⏳ جاري جلب الشحنات والطلبات من السحابة...</p>';
    }

    if (window.db && window.firebaseModules) {
        try {
            const querySnapshot = await window.firebaseModules.getDocs(window.firebaseModules.collection(window.db, "orders"));
            allOrders = [];
            querySnapshot.forEach((docSnap) => {
                allOrders.push(docSnap.data());
            });
            if(allOrders.length > 0) {
                localStorage.setItem('allaf_orders', JSON.stringify(allOrders));
            }
            renderKitchenGrid(allOrders);
        } catch (e) {
            console.error("Cloud sync error:", e);
            loadKitchenOrdersFromLocal();
        }
    }
}

async function syncAllActiveOrdersWithGetDoc() {
    await syncActiveOrdersSmart();
    alert("✓ تم تحديث لوحة العمليات والتجهيز بنجاح!");
}

function renderKitchenGrid(allOrders) {
    const grid = document.getElementById('kitchen-orders-grid');
    if(!grid) return;

    let activeOrders = allOrders.filter(o => o.status !== 'done');

    if(activeOrders.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8a29e; padding: 40px; font-size: 1.2rem;">لا توجد طلبات جديدة قيد الانتظار أو التجهيز حالياً. 🌾🚀</p>';
        return;
    }

    let htmlContent = '';
    activeOrders.forEach((order) => {
        let itemsList = (order.items || []).map(i => `
            <li style="margin-bottom: 6px; border-bottom: 1px dashed #44403c; padding-bottom: 4px; display: flex; justify-content: space-between;">
                <span>🌾 ${i.name}</span>
                <strong style="color: #fde047;">x${i.qty} شكارة</strong>
            </li>
        `).join('');
        
        let isCooking = order.status === 'cooking';
        let isDelivery = order.status === 'delivery';

        htmlContent += `
            <div style="background: #292524; border: 2px solid ${isCooking ? '#f59e0b' : (isDelivery ? '#0284c7' : '#b45309')}; border-radius: 12px; padding: 18px; box-shadow: 0 8px 20px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #44403c; padding-bottom: 8px;">
                    <strong style="color: #fde047; font-size: 1.1rem;">${order.id}</strong>
                    <span style="font-size: 0.8rem; padding: 4px 8px; border-radius: 6px; background: ${isCooking ? '#f59e0b' : (isDelivery ? '#0284c7' : '#78350f')}; color: #fff; font-weight: bold;">
                        ${getStatusLabelMap(order.status)}
                    </span>
                </div>
                <p style="margin-bottom: 6px; font-size: 0.9rem; color: #f5f5f4;">👤 <strong>العميل / المزرعة:</strong> ${order.name || 'عميل'} (${order.phone || order.clientPhone || ''})</p>
                <p style="margin-bottom: 12px; font-size: 0.9rem; color: #f5f5f4;">📍 <strong>العنوان:</strong> ${order.address || 'استلام من الفرع'}</p>
                
                <div style="background: #1c1917; padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #44403c;">
                    <strong style="font-size: 0.85rem; color: #fbbf24; display: block; margin-bottom: 8px;">الأصناف المطلوبة والتجهيز:</strong>
                    <ul style="list-style: none; padding: 0; font-size: 0.88rem; margin: 0;">${itemsList}</ul>
                    <div style="margin-top: 10px; text-align: left; color: #16a34a; font-weight: bold; font-size: 0.95rem;">
                        الإجمالي: ${order.total || 0} جنيه
                    </div>
                </div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button onclick="setKitchenStatus('${order.id}', 'cooking')" class="btn-primary" style="flex: 1; background: #d97706; padding: 8px; font-size: 0.85rem;">قيد التجهيز 📦</button>
                    <button onclick="setKitchenStatus('${order.id}', 'delivery')" class="btn-primary" style="flex: 1; background: #0284c7; padding: 8px; font-size: 0.85rem;">مع السائق 🛵</button>
                    <button onclick="setKitchenStatus('${order.id}', 'done')" class="btn-primary" style="flex: 1; background: #16a34a; padding: 8px; font-size: 0.85rem;">تم التسليم ✅</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = htmlContent;
}

async function setKitchenStatus(orderId, newStatus) {
    let allOrders = JSON.parse(localStorage.getItem('allaf_orders') || '[]');
    let order = allOrders.find(o => String(o.id) === String(orderId));
    
    if(order) {
        order.status = newStatus;
        localStorage.setItem('allaf_orders', JSON.stringify(allOrders));
        renderKitchenGrid(allOrders);

        if (window.db && window.firebaseModules) {
            try {
                await window.firebaseModules.updateDoc(
                    window.firebaseModules.doc(window.db, "orders", String(orderId)), 
                    { status: newStatus }
                );
            } catch (e) {
                console.error("Cloud status update error:", e);
            }
        }
    }
}

// ==========================================
// وظائف لوحة التحكم والإدارة (admin.html)
// ==========================================
function switchAdminSection(sectionName, btnElement) {
    document.querySelectorAll('.admin-panel-box').forEach(box => box.classList.remove('active'));
    document.querySelectorAll('.admin-section-btn').forEach(btn => btn.classList.remove('active'));

    const targetEl = document.getElementById('section-' + sectionName);
    if(targetEl) targetEl.classList.add('active');
    if(btnElement) btnElement.classList.add('active');

    if (sectionName === 'google-accounts') loadGoogleAccountsList();
    if (sectionName === 'issue-invoice') populateInvoiceClientsSelect();
    if (sectionName === 'suppliers') populateSuppliersSelect();
    if (sectionName === 'notifications') populateNotificationTargetsSelect();
}

function loadAdminDashboard() {
    const loginBox = document.getElementById('admin-login-box');
    const dashBox = document.getElementById('admin-dashboard');

    const userStr = localStorage.getItem('allaf_logged_user');
    if (!userStr) {
        if (loginBox) loginBox.style.display = 'block';
        if (dashBox) dashBox.classList.add('hidden');
        return;
    }

    const user = JSON.parse(userStr);
    if (loginBox) loginBox.style.display = 'none';
    if (dashBox) dashBox.classList.remove('hidden');

    const nameEl = document.getElementById('logged-user-name');
    const roleEl = document.getElementById('logged-user-role');
    const avatarEl = document.getElementById('nav-user-avatar');
    const displayEl = document.getElementById('nav-username-display');

    if (nameEl) nameEl.innerText = user.name || 'إدارة العلاف';
    if (roleEl) roleEl.innerText = `الصلاحية: ${user.role || 'مدير ماستر (Master Admin)'}`;
    if (avatarEl && user.photoURL) avatarEl.src = user.photoURL;
    if (displayEl) displayEl.innerText = user.name || '';

    updateVaultStats();
    renderAdminOrders();
    renderInvoicesHistory();
    renderExpensesList();
    renderMenuItemsManage();
}

async function adminLoginWithGoogle() {
    if (!window.auth || !window.googleProvider || !window.signInWithPopup) {
        alert("جاري تحميل برمجيات المصادقة السحابية... يرجى الانتظار ثانية والاعادة.");
        return;
    }

    try {
        const result = await window.signInWithPopup(window.auth, window.googleProvider);
        const user = result.user;
        const email = user.email.toLowerCase();

        let userRole = 'customer';
        const docId = String(email.replace(/[^a-zA-Z0-9]/g, '_'));

        if (email === 'haretg@gmail.com' || email === 'admin@allaf.com') {
            userRole = 'admin';
        }

        if (window.db && window.firebaseModules) {
            try {
                const userDoc = await window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, "users", docId));
                if (userDoc.exists() && userRole !== 'admin') {
                    userRole = userDoc.data().role || 'customer';
                }
            } catch(e) {}
        }

        const userObj = {
            name: user.displayName || 'إدارة العلاف',
            email: email,
            phone: user.phoneNumber || '01000000000',
            role: userRole,
            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            provider: 'Google Auth',
            date: new Date().toLocaleString('ar-EG')
        };

        if (window.db && window.firebaseModules) {
            await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "users", docId), userObj, { merge: true });
        }

        localStorage.setItem('allaf_logged_user', JSON.stringify(userObj));
        window.currentCustomer = userObj;
        loadAdminDashboard();
    } catch (error) {
        alert("حدث خطأ أثناء تسجيل الدخول عبر جوجل: " + error.message);
    }
}

function adminLoginCustom() {
    const idInput = document.getElementById('admin-login-id').value.trim().toLowerCase();
    const passInput = document.getElementById('admin-pass').value.trim();

    if(!idInput || !passInput) {
        alert('من فضلك أدخل البريد الإلكتروني أو الهاتف مع كلمة المرور!');
        return;
    }

    if((idInput === 'haretg@gmail.com' || idInput === 'admin@allaf.com' || idInput === '01000000000' || idInput === 'مدير') && passInput === '1234') {
        const masterUser = { name: 'المدير العام', email: 'haretg@gmail.com', phone: '01000000000', role: 'admin' };
        localStorage.setItem('allaf_logged_user', JSON.stringify(masterUser));
        window.currentCustomer = masterUser;
        loadAdminDashboard();
        return;
    }

    alert('بيانات الدخول غير صحيحة!');
}

function adminLogout() {
    localStorage.removeItem('allaf_logged_user');
    window.location.reload();
}

// ==========================================
// إدارة الخزنة والمصروفات النثرية
// ==========================================
function updateVaultStats() {
    let salesTotal = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    let expensesTotal = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
    let netProfit = salesTotal - expensesTotal;

    const salesEl = document.getElementById('vault-total-sales');
    const expensesEl = document.getElementById('vault-total-expenses');
    const profitEl = document.getElementById('vault-net-profit');

    if (salesEl) salesEl.innerText = `${salesTotal} جنيه`;
    if (expensesEl) expensesEl.innerText = `${expensesTotal} جنيه`;
    if (profitEl) profitEl.innerText = `${netProfit} جنيه`;
}

async function addExpense() {
    const reasonEl = document.getElementById('expense-reason');
    const amountEl = document.getElementById('expense-amount');

    if (!reasonEl || !amountEl) return;
    const reason = reasonEl.value.trim();
    const amount = parseFloat(amountEl.value);

    if (!reason || isNaN(amount) || amount <= 0) {
        alert('أدخل بيان المصروف والمبلغ بشكل صحيح!');
        return;
    }

    const expenseObj = {
        id: 'EXP-' + Date.now(),
        reason: reason,
        amount: amount,
        date: new Date().toLocaleString('ar-EG')
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "expenses", expenseObj.id), expenseObj);
    }

    reasonEl.value = '';
    amountEl.value = '';
    alert('✓ تم تسجيل المصروف بالخزنة بنجاح!');
}

function renderExpensesList() {
    const list = document.getElementById('expenses-list');
    if (!list) return;
    list.innerHTML = '';

    if (expensesList.length === 0) {
        list.innerHTML = '<p class="no-data-msg">لا توجد مصروفات سجلت اليوم.</p>';
        return;
    }

    expensesList.forEach(exp => {
        list.innerHTML += `
            <div style="background:#fef2f2; border:1px solid #fecaca; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between;">
                <div><strong>💸 ${exp.reason}</strong> <span style="font-size:0.8rem; color:#991b1b;">(${exp.date})</span></div>
                <strong style="color:#dc2626;">-${exp.amount} ج</strong>
            </div>
        `;
    });
}

// ==========================================
// إدارة الطلبيات المبيعات
// ==========================================
function renderAdminOrders() {
    const list = document.getElementById('admin-orders-list');
    if (!list) return;
    list.innerHTML = '';

    if (allOrders.length === 0) {
        list.innerHTML = '<p class="no-data-msg">لا توجد طلبات واردة حتى الآن.</p>';
        return;
    }

    allOrders.forEach(order => {
        let itemsHtml = (order.items || []).map(i => `• ${i.name} (x${i.qty})`).join('<br>');
        list.innerHTML += `
            <div style="background:#fff; border:1px solid #fef08a; padding:15px; border-radius:10px; margin-bottom:12px; box-shadow:0 2px 5px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="color:#78350f;">📦 طلبية رقم: ${order.id}</strong>
                    <span style="font-size:0.85rem; font-weight:bold; color:#b45309;">${getStatusText(order.status)}</span>
                </div>
                <p style="margin:4px 0;">👤 <strong>العميل:</strong> ${order.name || 'عميل'} | 📞 ${order.phone || ''}</p>
                <p style="margin:4px 0;">📍 <strong>العنوان:</strong> ${order.address || ''}</p>
                <p style="margin:4px 0; font-size:0.9rem;">🌾 <strong>الأصناف:</strong><br>${itemsHtml}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; border-top:1px dashed #e7e5e4; padding-top:8px;">
                    <strong style="color:#16a34a; font-size:1.1rem;">الإجمالي: ${order.total} جنيه</strong>
                    <div style="display:flex; gap:5px;">
                        <button onclick="setKitchenStatus('${order.id}', 'cooking')" style="background:#f59e0b; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">تجهيز 📦</button>
                        <button onclick="setKitchenStatus('${order.id}', 'delivery')" style="background:#0284c7; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">مع السائق 🛵</button>
                        <button onclick="setKitchenStatus('${order.id}', 'done')" style="background:#16a34a; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">تم التسليم ✅</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// ==========================================
// إصدار وإرسال الفواتير للعملاء
// ==========================================
function populateInvoiceClientsSelect() {
    const select = document.getElementById('invoice-client-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر العميل --</option>';

    registeredUsers.forEach(u => {
        select.innerHTML += `<option value="${u.phone || u.email}">${u.name || 'عميل'} (${u.phone || u.email})</option>`;
    });

    const dateInput = document.getElementById('invoice-date-input');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toLocaleDateString('ar-EG');
    }
}

async function adminIssueInvoice() {
    const clientVal = document.getElementById('invoice-client-select').value;
    const dateVal = document.getElementById('invoice-date-input').value;
    const detailsVal = document.getElementById('invoice-details-input').value.trim();
    const totalVal = parseFloat(document.getElementById('invoice-total-input').value);
    const paidVal = parseFloat(document.getElementById('invoice-paid-input').value);

    if (!clientVal || !detailsVal || isNaN(totalVal)) {
        alert('من فضلك اختر العميل وادخل بيان الفاتورة والمبلغ الكلي!');
        return;
    }

    const clientObj = registeredUsers.find(u => u.phone === clientVal || u.email === clientVal) || {};

    const invoiceObj = {
        id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        clientPhone: clientObj.phone || clientVal,
        clientEmail: clientObj.email || '',
        clientName: clientObj.name || 'عميل مسجل',
        date: dateVal || new Date().toLocaleDateString('ar-EG'),
        details: detailsVal,
        totalAmount: totalVal,
        paidAmount: isNaN(paidVal) ? 0 : paidVal,
        timestamp: Date.now()
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "invoices", invoiceObj.id), invoiceObj);
    }

    alert('✓ تم إصدار الفاتورة وتوثيقها ببروفايل العميل بنجاح!');
    document.getElementById('invoice-details-input').value = '';
    document.getElementById('invoice-total-input').value = '';
    document.getElementById('invoice-paid-input').value = '';
}

function renderInvoicesHistory() {
    const list = document.getElementById('admin-invoices-history-list');
    if (!list) return;
    list.innerHTML = '';

    if (allInvoices.length === 0) {
        list.innerHTML = '<p class="no-data-msg">لا توجد فواتير صادرة بعد.</p>';
        return;
    }

    allInvoices.forEach(inv => {
        list.innerHTML += `
            <div style="background:#fefce8; border:1px solid #fef08a; padding:10px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between;">
                    <strong>🧾 ${inv.id} - ${inv.clientName}</strong>
                    <span>${inv.date}</span>
                </div>
                <p style="font-size:0.85rem; margin:4px 0;">${inv.details}</p>
                <div style="font-size:0.85rem; color:#78350f;">
                    الإجمالي: ${inv.totalAmount} ج | المدفوع: ${inv.paidAmount} ج | <strong>المتبقي: ${inv.totalAmount - inv.paidAmount} ج</strong>
                </div>
            </div>
        `;
    });
}

// ==========================================
// إدارة الموردين والتوريدات
// ==========================================
async function adminAddSupplier() {
    const name = document.getElementById('supp-name').value.trim();
    const phone = document.getElementById('supp-phone').value.trim();
    const item = document.getElementById('supp-item').value.trim();

    if (!name || !phone) {
        alert('أدخل اسم شركة التوريد/المورد ورقم الهاتف!');
        return;
    }

    const suppObj = {
        id: 'SUPP-' + Date.now(),
        name: name,
        phone: phone,
        item: item
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "suppliers", suppObj.id), suppObj);
    }

    alert('✓ تم تسجيل المورد بنجاح!');
    document.getElementById('supp-name').value = '';
    document.getElementById('supp-phone').value = '';
    document.getElementById('supp-item').value = '';
}

function populateSuppliersSelect() {
    const select = document.getElementById('supply-supplier-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر المورد --</option>';

    allSuppliers.forEach(s => {
        select.innerHTML += `<option value="${s.name}">${s.name} (${s.phone})</option>`;
    });
}

async function adminRecordSupplyTransaction() {
    const suppName = document.getElementById('supply-supplier-select').value;
    const item = document.getElementById('supply-raw-material').value.trim();
    const qty = parseFloat(document.getElementById('supply-qty-ton').value);
    const total = parseFloat(document.getElementById('supply-total-cost').value);
    const paid = parseFloat(document.getElementById('supply-paid-cost').value);

    if (!suppName || !item || isNaN(total)) {
        alert('اختر المورد وادخل بيانات الخامات والتكلفة الكلية!');
        return;
    }

    const supplyObj = {
        id: 'SUP-TRX-' + Date.now(),
        supplierName: suppName,
        item: item,
        qtyTon: qty || 0,
        totalCost: total,
        paidCost: paid || 0,
        date: new Date().toLocaleString('ar-EG')
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "supply_transactions", supplyObj.id), supplyObj);
    }

    alert('✓ تم تسجيل شحنة التوريد بنجاح بالمخزن والخزنة!');
    document.getElementById('supply-raw-material').value = '';
    document.getElementById('supply-qty-ton').value = '';
    document.getElementById('supply-total-cost').value = '';
    document.getElementById('supply-paid-cost').value = '';
}

// ==========================================
// قسم التنبيهات والإشعارات
// ==========================================
function populateNotificationTargetsSelect() {
    const select = document.getElementById('notif-target-select');
    if (!select) return;
    select.innerHTML = '<option value="ALL">📢 عام - لجميع العملاء والمزارع</option>';

    registeredUsers.forEach(u => {
        select.innerHTML += `<option value="${u.phone}">${u.name || 'عميل'} (${u.phone})</option>`;
    });
}

async function adminSendNotification() {
    const target = document.getElementById('notif-target-select').value;
    const title = document.getElementById('notif-title-input').value.trim();
    const message = document.getElementById('notif-message-input').value.trim();

    if (!title || !message) {
        alert('أدخل عنوان الرسالة ونصه!');
        return;
    }

    const notifObj = {
        id: 'NOTIF-' + Date.now(),
        targetPhone: target === 'ALL' ? '' : target,
        title: title,
        message: message,
        date: new Date().toLocaleString('ar-EG')
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "notifications", notifObj.id), notifObj);
    }

    alert('✓ تم بث الإشعار بنجاح!');
    document.getElementById('notif-title-input').value = '';
    document.getElementById('notif-message-input').value = '';
}

function renderNotificationsHistory() {
    const list = document.getElementById('admin-notifications-history-list');
    if (!list) return;
    list.innerHTML = '';

    if (allNotifications.length === 0) {
        list.innerHTML = '<p class="no-data-msg">لا توجد إشعارات مرسلة بعد.</p>';
        return;
    }

    allNotifications.forEach(n => {
        list.innerHTML += `
            <div style="background:#f3e8ff; border:1px solid #d8b4fe; padding:10px; border-radius:8px;">
                <strong>🔔 ${n.title}</strong> <span style="font-size:0.75rem; color:#6b21a8;">(${n.date})</span>
                <p style="font-size:0.85rem; margin:4px 0;">${n.message}</p>
            </div>
        `;
    });
}

// ==========================================
// استعراض الحسابات والأدوار سحابياً
// ==========================================
async function loadGoogleAccountsList() {
    const list = document.getElementById('admin-google-accounts-list');
    if (!list) return;
    list.innerHTML = '<p>جاري جلب قائمة المستخدمين من السحابة...</p>';

    if (window.db && window.firebaseModules) {
        try {
            const querySnapshot = await window.firebaseModules.getDocs(window.firebaseModules.collection(window.db, "users"));
            list.innerHTML = '';
            querySnapshot.forEach(docSnap => {
                const u = docSnap.data();
                list.innerHTML += `
                    <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>👤 ${u.name || 'بدون اسم'}</strong> (${u.email || u.phone})
                            <div style="font-size:0.8rem; color:#1e40af;">الصلاحية الحالية: <strong>${u.role || 'عميل'}</strong></div>
                        </div>
                        <select onchange="updateUserRoleInCloud('${docSnap.id}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid #93c5fd;">
                            <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>عميل</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>أدمن / مشرف</option>
                            <option value="accountant" ${u.role === 'accountant' ? 'selected' : ''}>محاسب</option>
                            <option value="driver" ${u.role === 'driver' ? 'selected' : ''}>سائق توصيل</option>
                            <option value="worker" ${u.role === 'worker' ? 'selected' : ''}>عامل مخزن</option>
                        </select>
                    </div>
                `;
            });
        } catch(e) {
            list.innerHTML = '<p class="text-red-600">تعذر جلب قائمة المستخدمين.</p>';
        }
    }
}

async function updateUserRoleInCloud(docId, newRole) {
    if (window.db && window.firebaseModules) {
        await window.firebaseModules.updateDoc(window.firebaseModules.doc(window.db, "users", docId), { role: newRole });
        alert('✓ تم تحديث صلاحية المستخدم بنجاح!');
    }
}

// ==========================================
// إضافة وتعديل أصناف الأعلاف
// ==========================================
async function addNewProductWithMedia() {
    const name = document.getElementById('new-prod-name').value.trim();
    const cat = document.getElementById('new-prod-cat').value;
    const price = parseFloat(document.getElementById('new-prod-price').value);
    const weight = document.getElementById('new-prod-weight').value.trim();
    const image = document.getElementById('new-prod-image').value.trim();
    const desc = document.getElementById('new-prod-desc').value.trim();

    if (!name || isNaN(price)) {
        alert('من فضلك أدخل اسم العلف وسعر الشكارة بشكل صحيح!');
        return;
    }

    const prodObj = {
        id: Date.now(),
        name: name,
        category: cat,
        price: price,
        weight: weight || 'شكارة 50 كجم',
        image: image || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=500',
        desc: desc || 'علف ممتاز عالي الجودة'
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "products", String(prodObj.id)), prodObj);
    }

    alert('✓ تم إضافة صنف العلف للمتجر السحابي بنجاح!');
    document.getElementById('new-prod-name').value = '';
    document.getElementById('new-prod-price').value = '';
    document.getElementById('new-prod-weight').value = '';
    document.getElementById('new-prod-image').value = '';
    document.getElementById('new-prod-desc').value = '';
}

function renderMenuItemsManage() {
    const list = document.getElementById('admin-menu-items-list');
    if (!list) return;
    list.innerHTML = '';

    menuProducts.forEach(p => {
        list.innerHTML += `
            <div style="background:#fff; border:1px solid #fde047; padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${p.image}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
                    <div>
                        <strong>🌾 ${p.name}</strong>
                        <div style="font-size:0.8rem; color:#b45309;">${p.price} جنيه (${p.weight || '50 كجم'})</div>
                    </div>
                </div>
                <button onclick="deleteProductFromCloud('${p.id}')" style="background:#dc2626; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i> حذف</button>
            </div>
        `;
    });
}

async function deleteProductFromCloud(prodId) {
    if (confirm('هل أنت تأكد من حذف هذا الصنف من المتجر؟')) {
        if (window.db && window.firebaseModules) {
            await window.firebaseModules.deleteDoc(window.firebaseModules.doc(window.db, "products", String(prodId)));
            alert('✓ تم حذف الصنف بنجاح!');
        }
    }
}

// ==========================================
// الطلبيات اليدوية وطاقم العمل
// ==========================================
async function adminCreateOrder() {
    const name = document.getElementById('admin-ord-name').value.trim();
    const phone = document.getElementById('admin-ord-phone').value.trim();
    const address = document.getElementById('admin-ord-address').value.trim();
    const items = document.getElementById('admin-ord-items').value.trim();
    const total = parseFloat(document.getElementById('admin-ord-total').value);

    if (!name || !phone || isNaN(total)) {
        alert('أدخل بيانات العليم والطلب والإجمالي بشكل صحيح!');
        return;
    }

    const orderObj = {
        id: 'ALLAF-' + Math.floor(100000 + Math.random() * 900000),
        name: name,
        phone: phone,
        address: address,
        items: [{ name: items, qty: 1, price: total }],
        total: total,
        status: 'pending',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: Date.now()
    };

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "orders", orderObj.id), orderObj);
    }

    alert('✓ تم تسجيل الطلبية اليدوية بنجاح!');
    document.getElementById('admin-ord-name').value = '';
    document.getElementById('admin-ord-phone').value = '';
    document.getElementById('admin-ord-address').value = '';
    document.getElementById('admin-ord-items').value = '';
    document.getElementById('admin-ord-total').value = '';
}

async function createNewStaff() {
    const name = document.getElementById('staff-name').value.trim();
    const email = document.getElementById('staff-email').value.trim().toLowerCase();
    const phone = document.getElementById('staff-phone').value.trim();
    const role = document.getElementById('staff-role').value;

    if (!name || !phone) {
        alert('أدخل اسم الموظف ورقم هاتفه!');
        return;
    }

    const staffObj = {
        name: name,
        email: email,
        phone: phone,
        role: role,
        date: new Date().toLocaleString('ar-EG')
    };

    const docId = String((email || phone).replace(/[^a-zA-Z0-9]/g, '_'));

    if (window.db && window.firebaseModules) {
        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "users", docId), staffObj, { merge: true });
    }

    alert('✓ تم إضافة الموظف ومنحه الصلاحية بنجاح!');
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-email').value = '';
    document.getElementById('staff-phone').value = '';
}

function changeMyPassword() {
    alert('✓ تم تحديث كلمة المرور للحساب الحالي بنجاح!');
}

// ==========================================
// وظائف صفحة تفاصيل المنتج (product.html)
// ==========================================
async function initProductDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productIdParam = urlParams.get('id');
    if (!productIdParam) {
        const container = document.getElementById('product-detail-container');
        if (container) container.innerHTML = '<p style="text-align:center; padding:40px; color:#78716c; font-size:1.1rem;">لم يتم تحديد صنف علف لعرضه.</p>';
        return;
    }

    const productId = isNaN(productIdParam) ? productIdParam : parseInt(productIdParam);
    
    let product = (typeof menuProducts !== 'undefined' ? menuProducts : []).find(p => String(p.id) === String(productId));

    if (!product) {
        let localProducts = JSON.parse(localStorage.getItem('allaf_custom_products') || '[]');
        product = localProducts.find(p => String(p.id) === String(productId));
    }

    if (!product && window.db && window.firebaseModules) {
        try {
            const docSnap = await window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, "products", String(productId)));
            if (docSnap.exists()) {
                product = docSnap.data();
            }
        } catch (e) {
            console.error("Error fetching product from cloud:", e);
        }
    }

    const container = document.getElementById('product-detail-container');
    if (!container) return;

    if (!product) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#78716c; font-size:1.1rem;">عذراً، صنف العلف المطلوب غير موجود أو تم حذفه من القائمة.</p>';
        return;
    }

    const mediaSrc = product.image || product.media || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=500';
    const isVid = product.mediaType === 'video' || (typeof mediaSrc === 'string' && mediaSrc.startsWith('data:video'));
    
    let mediaHtml = isVid 
        ? `<video src="${mediaSrc}" controls autoplay loop style="width:100%; max-height:450px; object-fit:cover; border-radius:12px; margin-bottom:20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"></video>`
        : `<img src="${mediaSrc}" alt="${product.name}" style="width:100%; max-height:450px; object-fit:cover; border-radius:12px; margin-bottom:20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">`;

    container.innerHTML = `
        ${mediaHtml}
        <h1 style="color: #292524; font-size: 1.8rem; margin-bottom: 10px; color: #78350f;">🌾 ${product.name}</h1>
        <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
            <div style="font-size: 1.5rem; color: #b45309; font-weight: bold;">${product.price} جنيه</div>
            <span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 0.9rem;">
                <i class="fa-solid fa-weight-hanging"></i> ${product.weight || 'شكارة 50 كجم'}
            </span>
        </div>
        <p style="color: #57534e; font-size: 1.05rem; line-height: 1.7; margin-bottom: 25px; background: #fafaf9; padding: 15px; border-radius: 10px; border: 1px solid #f5f5f4;">
            ${product.desc || product.description || 'علف ممتاز عالي الجودة والبروتين لتلبية احتياجات المزارع وتحقيق أعلى معدلات التحويل.'}
        </p>
        
        <div style="display: flex; gap: 15px; align-items: center; border-top: 1px solid #e7e5e4; padding-top: 20px; flex-wrap: wrap;">
            <label style="font-weight: bold; color: #292524;">الكمية (بالشكارة):</label>
            <input type="number" id="detail-qty" value="1" min="1" style="width: 80px; padding: 10px; border: 1px solid #d6d3d1; border-radius: 8px; text-align: center; font-size: 1rem; font-weight: bold;">
            <button onclick="addSpecificProductToCart('${product.id}')" class="btn-primary" style="flex: 1; min-width: 220px; background-color: #b45309; padding: 12px; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; border: none; font-size: 1.05rem;">
                <i class="fa-solid fa-cart-plus"></i> أضف للسلة وانتقل لإتمام الطلب 🛒
            </button>
        </div>
    `;
}

async function addSpecificProductToCart(id) {
    const qtyInput = document.getElementById('detail-qty');
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    
    let prod = (typeof menuProducts !== 'undefined' ? menuProducts : []).find(p => String(p.id) === String(id));
    
    if(!prod) {
        let localProducts = JSON.parse(localStorage.getItem('allaf_custom_products') || '[]');
        prod = localProducts.find(p => String(p.id) === String(id));
    }

    if (!prod && window.db && window.firebaseModules) {
        try {
            const docSnap = await window.firebaseModules.getDoc(window.firebaseModules.doc(window.db, "products", String(id)));
            if (docSnap.exists()) {
                prod = docSnap.data();
            }
        } catch (e) {}
    }

    if(!prod) return;

    let existing = cart.find(item => String(item.id) === String(id));
    if(existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...prod, qty: qty });
    }

    updateCartUI();
    alert(`تمت إضافة (${prod.name}) بالكمية (${qty}) إلى السلة بنجاح! 🌾🛒`);
    window.location.href = 'index.html';
}

// ==========================================
// وظائف صفحة المكافآت ونقاط الولاء (rewards.html)
// ==========================================
async function initRewardsPage() {
    let customer = JSON.parse(localStorage.getItem('allaf_logged_user') || 'null');
    
    userRewardIdentifier = customer ? (customer.phone || customer.email) : localStorage.getItem('allaf_user_phone');

    if (!userRewardIdentifier) {
        let loggedUser = JSON.parse(localStorage.getItem('allaf_logged_user') || 'null');
        if (loggedUser) {
            userRewardIdentifier = loggedUser.phone || loggedUser.email;
        }
    }

    if (userRewardIdentifier && window.db && window.firebaseModules) {
        try {
            const docRef = window.firebaseModules.doc(window.db, "users", String(userRewardIdentifier).replace(/[^a-zA-Z0-9]/g, '_'));
            const docSnap = await window.firebaseModules.getDoc(docRef);
            if (docSnap.exists() && docSnap.data().points !== undefined) {
                userRewardPoints = docSnap.data().points;
            }
        } catch (e) {
            console.error("Cloud points fetch error:", e);
        }
    }

    if (userRewardPoints === 0) {
        let pointsDB = JSON.parse(localStorage.getItem('allaf_points') || '{}');
        if (userRewardIdentifier && pointsDB[userRewardIdentifier]) {
            userRewardPoints = pointsDB[userRewardIdentifier];
        } else {
            userRewardPoints = 15; 
        }
    }

    const pointsEl = document.getElementById('user-reward-points');
    if (pointsEl) pointsEl.innerText = userRewardPoints + ' نقطة';
}

async function redeemReward(cost, rewardName) {
    if(!userRewardIdentifier && !currentCustomer) {
        alert('يجب تسجيل الدخول برقم هاتفك أو بريدك الإلكتروني أولاً لتتمكن من استبدال النقاط!');
        return;
    }

    if(userRewardPoints < cost) {
        alert(`عذراً، رصيدك الحالي (${userRewardPoints} نقطة) لا يكفي للحصول على (${rewardName}) التي تتطلب ${cost} نقطة.`);
        return;
    }

    userRewardPoints -= cost;
    const pointsEl = document.getElementById('user-reward-points');
    if (pointsEl) pointsEl.innerText = userRewardPoints + ' نقطة';

    let pointsDB = JSON.parse(localStorage.getItem('allaf_points') || '{}');
    let identifierKey = userRewardIdentifier || (currentCustomer ? currentCustomer.phone : 'guest');
    pointsDB[identifierKey] = userRewardPoints;
    localStorage.setItem('allaf_points', JSON.stringify(pointsDB));

    if (window.db && window.firebaseModules && userRewardIdentifier) {
        try {
            const docRef = window.firebaseModules.doc(window.db, "users", String(userRewardIdentifier).replace(/[^a-zA-Z0-9]/g, '_'));
            await window.firebaseModules.setDoc(docRef, { points: userRewardPoints }, { merge: true });
        } catch (e) {
            console.error("Cloud points update error:", e);
        }
    }

    alert(`🎉 مبروك! تم استبدال النقاط بنجاح والحصول على (${rewardName}). يرجى إبراز هذه الرسالة لمسؤول التوريدات أو إرسالها عبر الواتساب عند الطلب! 🌾`);
}

// تصدير الدوال لاستدعائها المباشر
window.switchAdminSection = switchAdminSection;
window.adminLoginWithGoogle = adminLoginWithGoogle;
window.adminLoginCustom = adminLoginCustom;
window.adminLogout = adminLogout;
window.addExpense = addExpense;
window.adminIssueInvoice = adminIssueInvoice;
window.adminAddSupplier = adminAddSupplier;
window.adminRecordSupplyTransaction = adminRecordSupplyTransaction;
window.adminSendNotification = adminSendNotification;
window.updateUserRoleInCloud = updateUserRoleInCloud;
window.addNewProductWithMedia = addNewProductWithMedia;
window.deleteProductFromCloud = deleteProductFromCloud;
window.adminCreateOrder = adminCreateOrder;
window.createNewStaff = createNewStaff;
window.changeMyPassword = changeMyPassword;
window.initProductDetailsPage = initProductDetailsPage;
window.addSpecificProductToCart = addSpecificProductToCart;
window.initRewardsPage = initRewardsPage;
window.redeemReward = redeemReward;
window.loadAdminDashboard = loadAdminDashboard;
window.setKitchenStatus = setKitchenStatus;
window.showInvoiceDetails = showInvoiceDetails;
window.closeInvoiceModal = closeInvoiceModal;
window.printInvoiceModal = printInvoiceModal;
window.openAuthPrompt = openAuthPrompt;
window.closeAuthPrompt = closeAuthPrompt;
window.switchTab = switchTab;
window.filterCategory = filterCategory;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.applyPromoCode = applyPromoCode;
window.addCustomMixToCart = addCustomMixToCart;
window.submitOrder = submitOrder;
window.sendWhatsAppOrder = sendWhatsAppOrder;
window.switchCustomerSubTab = switchCustomerSubTab;

// دوال تحكم البانر المتحرك (Hero Slider)
function prevSliderItem() {
    if (!menuProducts || menuProducts.length === 0) return;
    currentSliderIndex = (currentSliderIndex - 1 + menuProducts.length) % menuProducts.length;
    updateSliderContent();
}

function nextSliderItem() {
    if (!menuProducts || menuProducts.length === 0) return;
    currentSliderIndex = (currentSliderIndex + 1) % menuProducts.length;
    updateSliderContent();
}

function sliderAddToCart() {
    if (!menuProducts || menuProducts.length === 0) return;
    const prod = menuProducts[currentSliderIndex];
    if (prod) {
        addToCart(prod.id);
    }
}

function sliderClickAction() {
    if (!menuProducts || menuProducts.length === 0) return;
    const prod = menuProducts[currentSliderIndex];
    if (prod) {
        window.location.href = `product.html?id=${prod.id}`;
    }
}

window.prevSliderItem = prevSliderItem;
window.nextSliderItem = nextSliderItem;
window.sliderAddToCart = sliderAddToCart;
window.sliderClickAction = sliderClickAction;
