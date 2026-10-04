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
let storeCoords = [29.980, 31.130];

let currentSliderIndex = 0;
let sliderInterval = null;

// ==========================================
// تهيئة التطبيق عند الفتح
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    checkSavedUserSession();
    renderMenu();
    updateCartUI();
    initHeroSlider();
    initRealtimeCloudSync();
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

    // طلب تسجيل الدخول إن لم يكن العميل مسجلاً
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

    // حساب نقاط الولاء
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

    // عرض قسم الطلبات كافتراضي
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
        let itemsHtml = order.items.map(i => `• ${i.name} (x${i.qty})`).join('<br>');
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
                    <p class="balance-due">⚠️️ <strong>المتبقي:</strong> ${inv.totalAmount - inv.paidAmount} جنيه</p>
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

// ==========================================
// نوافذ التنبيهات
// ==========================================
function openAuthPrompt() {
    const modal = document.getElementById('authPromptModal');
    if (modal) modal.classList.remove('hidden');
}

function closeAuthPrompt() {
    const modal = document.getElementById('authPromptModal');
    if (modal) modal.classList.add('hidden');
}

function loginByPhoneQuick() {
    const phoneInput = document.getElementById('quick-phone-input');
    if (!phoneInput) return;
    const phone = phoneInput.value.trim();

    if (!phone || phone.length < 10) {
        alert('أدخل رقم هاتف صحيح من 10 أرقام على الأقل!');
        return;
    }

    const userObj = {
        name: 'عميل العلاف (' + phone.slice(-4) + ')',
        email: phone + '@allaf.com',
        phone: phone,
        role: 'customer',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
    };

    currentCustomer = userObj;
    localStorage.setItem('allaf_logged_user', JSON.stringify(userObj));
    loadCustomerDashboard();
    alert(`أهلاً بك يا ${userObj.name}! تم تسجيل الدخول بنجاح.`);
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

function nextSliderItem() {
    currentSliderIndex = (currentSliderIndex + 1) % menuProducts.length;
    updateSliderContent();
}

function prevSliderItem() {
    currentSliderIndex = (currentSliderIndex - 1 + menuProducts.length) % menuProducts.length;
    updateSliderContent();
}

function sliderAddToCart() {
    const prod = menuProducts[currentSliderIndex];
    if (prod) addToCart(prod.id);
}

function fetchCustomerGpsLocation() {
    const statusEl = document.getElementById('customer-gps-status');
    if (!navigator.geolocation) {
        alert("متصفحك لا يدعم GPS.");
        return;
    }
    if(statusEl) statusEl.innerText = "⏳ جاري تحديد موقع المزرعة عبر الأقمار الصناعية...";

    navigator.geolocation.getCurrentPosition(pos => {
        customerLat = pos.coords.latitude;
        customerLng = pos.coords.longitude;
        if(statusEl) statusEl.innerText = `✓ تم تثبيت موقع المزرعة بنجاح! (${customerLat.toFixed(4)}, ${customerLng.toFixed(4)})`;
    }, () => {
        if(statusEl) statusEl.innerText = "❌ تعذر جلب الموقع. يرجى تفعيل الـ GPS.";
    });
}

// ==========================================
// M مزامنة البيانات مع Firebase Firestore
// ==========================================
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
