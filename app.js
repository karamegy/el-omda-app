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
        desc: "مخصص للأبقار والجاموس الأبقار الحلابة لزيادة إنتاج اللبن ونسبة الدسم بفاعلية عالية.", 
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
        desc: "ردة قمح ناعمة طازجة ومفيدة جداً للهضم وتغذية المواشي والمواشي الحلابة.", 
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
let registeredUsers = [];
let pointsDB = {};

let activeDiscount = 0;
let customerLat = null;
let customerLng = null;
let storeCoords = [29.9600, 31.2100];

let currentSliderIndex = 0;
let sliderInterval = null;

// ==========================================
// متناغيرات ومحرك الخريطة
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
// تهيئة التطبيق الذكية عند الفتح
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    checkSavedUserSession();
    renderMenu();
    updateCartUI();
    initHeroSlider();
    initRealtimeCloudSync();

    // 1. تشغيل الخريطة تلقائياً إذا كانت صفحة الخريطة مفتوحة
    if (document.getElementById('leafletMap')) {
        checkUserPermissions();
        initLeafletMap();
        initRealtimeMapData();
    }

    // 2. تشغيل لوحة التجهيز (KDS) تلقائياً إذا كانت الشاشة مفتوحة
    if (document.getElementById('kitchen-orders-grid')) {
        if (checkKitchenAccessSecurity()) {
            loadKitchenOrdersFromLocal();
            initRealtimeKitchenSync();
        }
    }
});

function checkSavedUserSession() {
    try {
        const saved = localStorage.getItem('allaf_logged_user') || 
                      localStorage.getItem('fleet_logged_user') || 
                      localStorage.getItem('fleet_session_user') || 
                      localStorage.getItem('fleet_current_cust');
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
                    <img src="${product.image}" alt="${product.name}" class="menu-img">
                    <span class="weight-badge"><i class="fa-solid fa-weight-hanging"></i> ${product.weight || 'شكارة 50 كجم'}</span>
                </div>
                <div class="menu-card-body">
                    <h3>${product.name}</h3>
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
                <img src="${product.image}" alt="${product.name}" class="menu-img">
                <div class="menu-card-body">
                    <h3>🌾 ${product.name}</h3>
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
        });

        onSnapshot(collection(window.db, "invoices"), (snapshot) => {
            allInvoices = [];
            snapshot.forEach(doc => allInvoices.push(doc.data()));
            if (currentCustomer) {
                renderCustomerInvoices();
                renderCustomerStatement();
            }
        });

        onSnapshot(collection(window.db, "notifications"), (snapshot) => {
            allNotifications = [];
            snapshot.forEach(doc => allNotifications.push(doc.data()));
            if (currentCustomer) renderCustomerNotifications();
        });

        onSnapshot(collection(window.db, "products"), (snapshot) => {
            let cloudProds = [];
            snapshot.forEach(doc => cloudProds.push(doc.data()));
            if (cloudProds.length > 0) {
                menuProducts = [...defaultProducts, ...cloudProds];
            }
            renderMenu();
        });
    } else {
        setTimeout(initRealtimeCloudSync, 1000);
    }
}

// ==========================================
// وظائف الخريطة والتتبع الحي (Map.html)
// ==========================================
function checkUserPermissions() {
    const savedUserStr = localStorage.getItem('allaf_logged_user') || 
                         localStorage.getItem('fleet_logged_user') || 
                         localStorage.getItem('fleet_session_user') || 
                         localStorage.getItem('fleet_current_cust') || '{}';
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
    const isMaster = (email === 'haretg@gmail.com' || email === 'admin@fleet.com' || phone.includes('01144730305'));

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
        let localOrders = JSON.parse(localStorage.getItem('fleet_orders') || '[]');
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

    let localOrders = JSON.parse(localStorage.getItem('fleet_orders') || '[]');
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

    let allOrders = JSON.parse(localStorage.getItem('fleet_orders') || '[]');
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
            toggleBtn.innerText = "بدء بث الموقع الحي 🛰️";
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
    if(st === 'delivery') return 'مع الطيار 🛵';
    if(st === 'done') return 'تم التسليم ✅';
    return st || 'نشط';
}

// ==========================================
// وظائف لوحة تجهيز الطلبات والشحنات (KDS)
// ==========================================
function checkKitchenAccessSecurity() {
    const savedUserStr = localStorage.getItem('allaf_logged_user') || 
                         localStorage.getItem('fleet_logged_user') || 
                         localStorage.getItem('fleet_session_user') || 
                         localStorage.getItem('fleet_current_cust') || '{}';
    
    let loggedUser = {};
    try { loggedUser = JSON.parse(savedUserStr); } catch(e){}

    const role = (loggedUser.role || '').toLowerCase();
    const email = (loggedUser.email || '').toLowerCase();
    const phone = loggedUser.phone || '';

    const isMaster = (email === 'haretg@gmail.com' || email === 'admin@fleet.com' || phone.includes('01144730305'));
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
    let allOrders = JSON.parse(localStorage.getItem('fleet_orders') || localStorage.getItem('omda_orders') || '[]');
    renderKitchenGrid(allOrders);
}

function initRealtimeKitchenSync() {
    if (window.db && window.firebaseModules) {
        const { collection, onSnapshot } = window.firebaseModules;
        onSnapshot(collection(window.db, "orders"), (snapshot) => {
            let cloudOrders = [];
            snapshot.forEach(docSnap => cloudOrders.push(docSnap.data()));
            if (cloudOrders.length > 0) {
                localStorage.setItem('fleet_orders', JSON.stringify(cloudOrders));
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
    let allOrders = JSON.parse(localStorage.getItem('fleet_orders') || localStorage.getItem('omda_orders') || '[]');
    
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
                localStorage.setItem('fleet_orders', JSON.stringify(allOrders));
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
    let allOrders = JSON.parse(localStorage.getItem('fleet_orders') || localStorage.getItem('omda_orders') || '[]');
    let order = allOrders.find(o => String(o.id) === String(orderId));
    
    if(order) {
        order.status = newStatus;
        localStorage.setItem('fleet_orders', JSON.stringify(allOrders));
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
