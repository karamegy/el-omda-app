// بيانات المنيو الأساسية مع صور تفصيلية للمشويات
const defaultProducts = [
    { id: 1, name: "صينية العمدة الكبرى", category: "trays", price: 2750, desc: "فرخة شيش + نص طرب + كيلو كفتة + نص كباب + نص سجق + 4 حمام + أرز + نص ممبار + 2 لتر بيبيسي", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500" },
    { id: 2, name: "صينية الصحاب", category: "trays", price: 830, desc: "نص فرخة شيش + نص طرب + ربع سجق + طبق محشي مشكل + ربع ممبار + ورق عنب + 2 سمبوسة + أرز", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500" },
    { id: 3, name: "صينية العروسة", category: "trays", price: 2000, desc: "4 حمام + فرخة شيش + فرخة شواية + كيلو كفتة + طاجن ورق عنب بالكوارع + أرز", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500" },
    { id: 4, name: "كباب ضاني (كيلو)", category: "grills", price: 1200, desc: "لحم ضاني بلدي طازج مشوي على الفحم الحطب", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500" },
    { id: 5, name: "طرب ضاني (كيلو)", category: "grills", price: 480, desc: "أجمل طرب ضاني محشي بالطعم الخرافي", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500" },
    { id: 6, name: "كفتة ضاني (كيلو)", category: "grills", price: 500, desc: "كفتة ضاني متبلة على طريقة العمدة الخاصة", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500" },
    { id: 7, name: "كفتة كندوز (كيلو)", category: "grills", price: 320, desc: "كفتة بلدي كندوز مشوية بإتقان", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500" },
    { id: 8, name: "ريش ضاني (كيلو)", category: "grills", price: 1300, desc: "ريش ضاني ممتازة للعزومات", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500" },
    { id: 9, name: "وجبة النعنشة", category: "meals", price: 130, desc: "ربع فراخ + سيخ كفتة + أرز + سلطة + طحينة", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500" },
    { id: 10, name: "وجبة اللقلقانة", category: "meals", price: 80, desc: "سيخ كفتة + أرز + ملوخية + سلطة + عيش", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500" },
    { id: 11, name: "وجبة السعادة", category: "meals", price: 310, desc: "ربع فراخ + 1 حمام + ثمن طرب", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500" },
    { id: 12, name: "وجبة الكرم", category: "meals", price: 160, desc: "ربع فراخ + كفتة + أرز + خضار سادة + عيش", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500" },
    { id: 13, name: "حمام محشي أرز", category: "tagines", price: 180, desc: "حمام بلدي محشي أرز بالخلطة الممتازة", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500" },
    { id: 14, name: "ورق عنب بالكوارع", category: "tagines", price: 150, desc: "طاجن ورق عنب بالكوارع اللذيذة", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500" },
    { id: 15, name: "ورقة لحمة", category: "appetizers", price: 100, desc: "ورقة لحمة بالبصل والفلفل على الفحم", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500" },
    { id: 16, name: "طبق ممبار فاخر", category: "appetizers", price: 80, desc: "ممبار محشي ومحمر باللون الذهبي المقرمش", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500" }
];

let menuProducts = JSON.parse(localStorage.getItem('omda_custom_products') || JSON.stringify(defaultProducts));

let cart = [];
let currentCustomer = null;
let favorites = JSON.parse(localStorage.getItem('omda_favorites') || '[]');
let activeDiscount = 0;

window.addEventListener('DOMContentLoaded', () => {
    loadSavedTicker();
});

function loadSavedTicker() {
    const savedTicker = localStorage.getItem('omda_ticker_text');
    if(savedTicker) {
        document.getElementById('main-ticker-text').innerText = savedTicker;
    }
}

function updateTickerText() {
    const newText = document.getElementById('admin-ticker-input').value.trim();
    if(!newText) {
        alert('من فضلك اكتب نص الإعلان أولاً!');
        return;
    }
    localStorage.setItem('omda_ticker_text', newText);
    document.getElementById('main-ticker-text').innerText = newText;
    alert('تم تحديث شريط الإعلانات المتحرك بنجاح يا أسطى كرم! 🚀');
    document.getElementById('admin-ticker-input').value = '';
}

// تبديل التبويبات
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    
    const btnMap = { 'menu': 0, 'custom-tray': 1, 'offers': 2, 'cart': 3, 'reservation': 4, 'favorites': 5, 'customer': 6, 'admin': 7 };
    const buttons = document.querySelectorAll('.nav-btn');
    if (buttons[btnMap[tabId]]) {
        buttons[btnMap[tabId]].classList.add('active');
    }

    if(tabId === 'admin') {
        checkAdminSession();
    } else if(tabId === 'favorites') {
        renderFavorites();
    } else if(tabId === 'offers') {
        renderOffers();
    } else if(tabId === 'customer' && currentCustomer) {
        loadCustomerDashboard();
    }
}

// عرض المنيو مع صور الأطباق
function renderMenu(filter = 'all') {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    const filtered = filter === 'all' ? menuProducts : menuProducts.filter(p => p.category === filter);

    filtered.forEach(product => {
        const isFav = favorites.includes(product.id);
        const prodImg = product.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
        grid.innerHTML += `
            <div class="menu-card">
                <img src="${prodImg}" alt="${product.name}" class="menu-img">
                <div class="menu-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3>${product.name}</h3>
                        <button onclick="toggleFavorite(${product.id})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: ${isFav ? '#dc2626' : '#a8a29e'};">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                    </div>
                    <p>${product.desc}</p>
                    <div class="price">${product.price} جنيه</div>
                </div>
                <button onclick="addToCart(${product.id})"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>
            </div>
        `;
    });
}

function renderOffers() {
    const grid = document.getElementById('offers-grid');
    grid.innerHTML = '';
    const offers = menuProducts.filter(p => p.category === 'trays');

    offers.forEach(product => {
        const isFav = favorites.includes(product.id);
        const prodImg = product.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500';
        grid.innerHTML += `
            <div class="menu-card" style="border: 2px solid #d97706;">
                <img src="${prodImg}" alt="${product.name}" class="menu-img">
                <div class="menu-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3 style="color: #991b1b;">👑 ${product.name}</h3>
                        <button onclick="toggleFavorite(${product.id})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: ${isFav ? '#dc2626' : '#a8a29e'};">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                    </div>
                    <p>${product.desc}</p>
                    <div class="price">${product.price} جنيه</div>
                </div>
                <button onclick="addToCart(${product.id})"><i class="fa-solid fa-cart-plus"></i> أضف الصينية للسلة 🔥</button>
            </div>
        `;
    });
}

function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    renderMenu(cat);
}

// ميزة "صمم صينيتك بنفسك"
function addCustomTrayToCart() {
    const sizePrice = parseFloat(document.getElementById('custom-size').value);
    const sizeText = document.getElementById('custom-size').options[document.getElementById('custom-size').selectedIndex].text;
    const meatType = document.getElementById('custom-meat').value;
    const notes = document.getElementById('custom-notes').value.trim();

    let extrasTotal = 0;
    let extrasDesc = [];

    if(document.getElementById('ext-mombar').checked) {
        extrasTotal += 80;
        extrasDesc.push('ممبار');
    }
    if(document.getElementById('ext-mahshi').checked) {
        extrasTotal += 60;
        extrasDesc.push('محشي');
    }
    if(document.getElementById('ext-pepsi').checked) {
        extrasTotal += 50;
        extrasDesc.push('بيبيسي');
    }

    let totalPrice = sizePrice + extrasTotal;
    let customName = `👑 صينية مخصصة (${sizeText.split(' ')[0]})`;
    let customDesc = `المحتوى: ${meatType} ${extrasDesc.length ? '+ إضافات: ' + extrasDesc.join(', ') : ''} ${notes ? '| ملاحظات: ' + notes : ''}`;

    const customTrayProd = {
        id: Date.now(),
        name: customName,
        price: totalPrice,
        desc: customDesc,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"
    };

    cart.push({ ...customTrayProd, qty: 1 });
    updateCartUI();
    alert(`تم تصميم صينيتك الخاصة وإضافتها للسلة بنجاح يا أسطى! 🚀`);
    switchTab('cart');
}

// إضافة منتج جديد مع الصورة من قبل الأدمن
function addNewProduct() {
    const name = document.getElementById('new-prod-name').value.trim();
    const category = document.getElementById('new-prod-cat').value;
    const price = parseFloat(document.getElementById('new-prod-price').value);
    const image = document.getElementById('new-prod-img').value.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
    const desc = document.getElementById('new-prod-desc').value.trim();

    if(!name || isNaN(price) || !desc) {
        alert('من فضلك ادخل اسم المنتج، السعر، والوصف بشكل صحيح!');
        return;
    }

    const newProd = {
        id: Date.now(),
        name,
        category,
        price,
        image,
        desc
    };

    menuProducts.push(newProd);
    localStorage.setItem('omda_custom_products', JSON.stringify(menuProducts));

    alert(`تم إضافة المنتج (${name}) بنجاح إلى المنيو الرئيسي وسيظهر للعملاء بالصورة فوراً! 👑`);
    
    document.getElementById('new-prod-name').value = '';
    document.getElementById('new-prod-price').value = '';
    document.getElementById('new-prod-img').value = '';
    document.getElementById('new-prod-desc').value = '';

    renderMenu();
}

// إدارة المفضلة
function toggleFavorite(productId) {
    const index = favorites.indexOf(productId);
    if(index > -1) {
        favorites.splice(index, 1);
        alert('تم إزالة المنتج من المفضلة.');
    } else {
        favorites.push(productId);
        alert('تم إضافة المنتج إلى المفضلة ❤️');
    }
    localStorage.setItem('omda_favorites', JSON.stringify(favorites));
    renderMenu();
    if(document.getElementById('tab-offers').classList.contains('active')) renderOffers();
    if(document.getElementById('tab-favorites').classList.contains('active')) renderFavorites();
}

function renderFavorites() {
    const grid = document.getElementById('favorites-grid');
    grid.innerHTML = '';
    const favProducts = menuProducts.filter(p => favorites.includes(p.id));

    if(favProducts.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8a29e; padding: 20px;">لا توجد أطباق في قائمة المفضلة حالياً.</p>';
        return;
    }

    favProducts.forEach(product => {
        const prodImg = product.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
        grid.innerHTML += `
            <div class="menu-card">
                <img src="${prodImg}" alt="${product.name}" class="menu-img">
                <div class="menu-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3>${product.name}</h3>
                        <button onclick="toggleFavorite(${product.id})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: #dc2626;">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                    <p>${product.desc}</p>
                    <div class="price">${product.price} جنيه</div>
                </div>
                <button onclick="addToCart(${product.id})"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>
            </div>
        `;
    });
}

// إضافة للسلة
function addToCart(productId) {
    const prod = menuProducts.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...prod, qty: 1 });
    }

    updateCartUI();
    alert(`تم إضافة (${prod.name}) إلى السلة بنجاح! 🛒`);
}

// تحديث السلة مع عرض صورة المنتج بجانب الاسم
function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    const list = document.getElementById('cart-items-list');
    list.innerHTML = '';

    if(cart.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #78716c; padding: 20px;">سلة المبيعات فارغة حالياً.</p>';
        document.getElementById('cart-total').innerText = '0';
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
        const itemImg = item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=100';
        list.innerHTML += `
            <div class="cart-item-row">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <img src="${itemImg}" alt="${item.name}" class="cart-item-img">
                    <div>
                        <strong style="color: #292524; font-size: 1.05rem;">${item.name}</strong><br>
                        <span style="color: #78716c; font-size: 0.85rem;">السعر: ${item.price} ج | العدد: ${item.qty}</span>
                    </div>
                </div>
                <div style="text-align: left;">
                    <strong style="color: var(--accent-red); font-size: 1.1rem; display: block; margin-bottom: 5px;">${item.price * item.qty} ج</strong>
                    <button onclick="removeFromCart(${item.id})" class="btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    let total = subtotal - (subtotal * activeDiscount);
    document.getElementById('cart-total').innerText = total;
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

// تطبيق البرومو كود
function applyPromoCode() {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    const note = document.getElementById('discount-note');
    if(code === 'OMDA2026') {
        activeDiscount = 0.10;
        note.innerText = ' (تم تطبيق خصم البرومو كود 10% 🔥)';
        alert('مبروك! تم تطبيق كود الخصم 10% بنجاح.');
        updateCartUI();
    } else {
        activeDiscount = 0;
        note.innerText = '';
        alert('عذراً، البرومو كود غير صحيح أو منتهي الصلاحية.');
        updateCartUI();
    }
}

// إرسال الطلب وحساب نقاط الولاء
function submitOrder() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();

    if(!name || !phone || !address) {
        alert('من فضلك أدخل الاسم ورقم الهاتف وعنوان التوصيل كاملاً!');
        return;
    }

    if(cart.length === 0) {
        alert('سلة المبيعات فارغة!');
        return;
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = subtotal - (subtotal * activeDiscount);
    
    const newOrder = {
        id: 'OMDA-' + Math.floor(100000 + Math.random() * 900000),
        name,
        phone,
        address,
        items: [...cart],
        total,
        status: 'pending',
        date: new Date().toLocaleString('ar-EG')
    };

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    allOrders.unshift(newOrder);
    localStorage.setItem('omda_orders', JSON.stringify(allOrders));

    let earnedPoints = Math.floor(total / 10);
    let pointsDB = JSON.parse(localStorage.getItem('omda_points') || '{}');
    pointsDB[phone] = (pointsDB[phone] || 0) + earnedPoints;
    localStorage.setItem('omda_points', JSON.stringify(pointsDB));

    alert(`تم إرسال طلبك بنجاح يا أسطى ${name}! رقم طلبك: ${newOrder.id}\nكسبت ${earnedPoints} نقطة ولاء جديدة في حسابك! ⭐`);
    cart = [];
    activeDiscount = 0;
    updateCartUI();
    
    currentCustomer = { name, phone };
    localStorage.setItem('omda_current_cust', JSON.stringify(currentCustomer));
    switchTab('customer');
    loadCustomerDashboard();
}

// الطلب السريع عبر واتساب
function sendWhatsAppOrder() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();

    if(!name || !phone || !address) {
        alert('من فضلك أدخل الاسم ورقم الهاتف وعنوان التوصيل قبل الطلب عبر واتساب!');
        return;
    }

    if(cart.length === 0) {
        alert('سلة المبيعات فارغة!');
        return;
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = subtotal - (subtotal * activeDiscount);
    let itemsText = cart.map(i => `- ${i.name} (عدد: ${i.qty}) بسعر ${i.price * i.qty} ج`).join('%0A');

    let msg = `*طلب جديد من تطبيق مشويات العمدة* 👑%0A%0A` +
              `👤 *الاسم:* ${name}%0A` +
              `📞 *الهاتف:* ${phone}%0A` +
              `📍 *العنوان:* ${address}%0A%0A` +
              `🛒 *الأصناف:*%0A${itemsText}%0A%0A` +
              `💰 *الإجمالي بعد الخصم:* ${total} جنيه`;

    let waUrl = `https://wa.me/201144730305?text=${msg}`;
    window.open(waUrl, '_blank');
}

// حجز الطاولات والعزائم
function submitReservation() {
    const name = document.getElementById('res-name').value.trim();
    const phone = document.getElementById('res-phone').value.trim();
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    const guests = document.getElementById('res-guests').value;
    const notes = document.getElementById('res-notes').value.trim();

    if(!name || !phone || !date || !time || !guests) {
        alert('من فضلك املأ كافة بيانات الحجز الأساسية!');
        return;
    }

    const newRes = {
        id: 'RES-' + Math.floor(1000 + Math.random() * 9000),
        name,
        phone,
        date,
        time,
        guests,
        notes,
        status: 'pending',
        createdAt: new Date().toLocaleString('ar-EG')
    };

    let allRes = JSON.parse(localStorage.getItem('omda_reservations') || '[]');
    allRes.unshift(newRes);
    localStorage.setItem('omda_reservations', JSON.stringify(allRes));

    alert(`تم تسجيل حجز الطاولة بنجاح يا أسطى ${name}! سنتواصل معك قريباً.`);
    document.getElementById('res-name').value = '';
    document.getElementById('res-phone').value = '';
    document.getElementById('res-date').value = '';
    document.getElementById('res-time').value = '';
    document.getElementById('res-guests').value = '';
    document.getElementById('res-notes').value = '';
    switchTab('menu');
}

// تسجيل دخول الزبون وتتبع الشحنة والتقييمات
function customerLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    if(!phone) {
        alert('أدخل رقم الهاتف من فضلك');
        return;
    }

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    const userOrder = allOrders.find(o => o.phone === phone);

    if(!userOrder) {
        alert('لا توجد طلبات مسجلة بهذا الرقم!');
        return;
    }

    currentCustomer = { name: userOrder.name, phone: userOrder.phone };
    localStorage.setItem('omda_current_cust', JSON.stringify(currentCustomer));
    loadCustomerDashboard();
}

function loadCustomerDashboard() {
    document.getElementById('cust-login-box').classList.add('hidden');
    document.getElementById('customer-dashboard').classList.remove('hidden');
    document.getElementById('cust-display-name').innerText = currentCustomer.name;
    document.getElementById('cust-display-phone').innerText = currentCustomer.phone;

    let pointsDB = JSON.parse(localStorage.getItem('omda_points') || '{}');
    let userPoints = pointsDB[currentCustomer.phone] || 0;
    document.getElementById('cust-points').innerText = userPoints;

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    const myOrders = allOrders.filter(o => o.phone === currentCustomer.phone);

    const list = document.getElementById('customer-orders-list');
    list.innerHTML = '';

    let reviewsDB = JSON.parse(localStorage.getItem('omda_reviews') || '{}');

    myOrders.forEach(order => {
        let orderReview = reviewsDB[order.id];
        let reviewHtml = '';
        if(order.status === 'done') {
            if(orderReview) {
                reviewHtml = `<div style="margin-top: 10px; background: #dcfce7; padding: 8px; border-radius: 6px; color: #166534;">⭐ تقييمك: ${orderReview.rating}/5 - "${orderReview.comment}"</div>`;
            } else {
                reviewHtml = `
                    <div style="margin-top: 10px; background: #fef3c7; padding: 10px; border-radius: 8px;">
                        <p style="font-size:0.85rem; font-weight:bold; margin-bottom:5px;">قيم تجربتك مع مشويات العمدة:</p>
                        <select id="rating-${order.id}" style="padding: 6px; margin-bottom: 5px; width: 100%; border-radius: 6px;">
                            <option value="5">⭐⭐⭐⭐⭐ ممتاز جداً</option>
                            <option value="4">⭐⭐⭐⭐ جيد جداً</option>
                            <option value="3">⭐⭐⭐ مقبول</option>
                        </select>
                        <input type="text" id="review-${order.id}" placeholder="اكتب تعليقك هنا..." style="padding: 6px; width: 100%; margin-bottom: 5px; border-radius: 6px; border:1px solid #d6d3d1;">
                        <button onclick="submitReview('${order.id}')" class="btn-primary btn-sm" style="padding: 6px 12px; font-size:0.85rem;">إرسال التقييم ⭐</button>
                    </div>
                `;
            }
        }

        list.innerHTML += `
            <div class="order-card" style="margin-bottom: 20px;">
                <p><strong>رقم الطلب:</strong> ${order.id}</p>
                <p><strong>التاريخ:</strong> ${order.date}</p>
                <p><strong>العنوان:</strong> ${order.address}</p>
                <p><strong>الإجمالي:</strong> ${order.total} جنيه</p>
                
                <div style="margin: 15px 0; background: #f5f5f4; padding: 10px; border-radius: 8px;">
                    <p style="font-size: 0.9rem; font-weight: bold; margin-bottom: 8px; color: #78350f;">⏱️ حالة الطلب والتوصيل الحي:</p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; text-align: center; gap: 5px;">
                        <div style="flex:1; padding: 5px; background: ${order.status==='pending'?'#fef08a':'#bbf7d0'}; border-radius:4px;">1. قيد المراجعة ⏳</div>
                        <div style="flex:1; padding: 5px; background: ${order.status==='cooking'?'#fed7aa':(order.status==='delivery'||order.status==='done'?'#bbf7d0':'#e7e5e4')}; border-radius:4px;">2. ع الفحم 🔥</div>
                        <div style="flex:1; padding: 5px; background: ${order.status==='delivery'?'#bae6fd':(order.status==='done'?'#bbf7d0':'#e7e5e4')}; border-radius:4px;">3. مع الدليفري 🛵</div>
                        <div style="flex:1; padding: 5px; background: ${order.status==='done'?'#16a34a':'#e7e5e4'}; color:${order.status==='done'?'#fff':'#000'}; border-radius:4px;">4. وصل ✅</div>
                    </div>
                </div>

                ${reviewHtml}
                <button onclick='showReceipt(${JSON.stringify(order)})' class="btn-secondary btn-sm" style="margin-top: 10px;"><i class="fa-solid fa-receipt"></i> عرض الفاتورة الرقمية 🧾</button>
            </div>
        `;
    });
}

function submitReview(orderId) {
    const rating = document.getElementById(`rating-${orderId}`).value;
    const comment = document.getElementById(`review-${orderId}`).value.trim() || 'بدون تعليق';

    let reviewsDB = JSON.parse(localStorage.getItem('omda_reviews') || '{}');
    reviewsDB[orderId] = { rating, comment };
    localStorage.setItem('omda_reviews', JSON.stringify(reviewsDB));

    alert('شكراً لتقييمك! رأيك يهمني ويسعدنا دائماً خدمة أهالينا. ❤️');
    loadCustomerDashboard();
}

function showReceipt(order) {
    let itemsStr = order.items.map(i => `${i.name} (x${i.qty}) - ${i.price * i.qty} ج`).join('\n');
    let receiptText = `👑 كبابجي ومشويات العمدة 👑\n` +
                      `---------------------------\n` +
                      `رقم الطلب: ${order.id}\n` +
                      `العميل: ${order.name}\n` +
                      `الهاتف: ${order.phone}\n` +
                      `العنوان: ${order.address}\n` +
                      `التاريخ: ${order.date}\n` +
                      `---------------------------\n` +
                      `الأصناف:\n${itemsStr}\n` +
                      `---------------------------\n` +
                      `الإجمالي الكلي: ${order.total} جنيه\n` +
                      `شكراً لاختيارك مشويات العمدة! ❤️`;
    
    navigator.clipboard.writeText(receiptText);
    alert('📄 تم نسخ تفاصيل الفاتورة الرقمية إلى الحافظة بنجاح!\n\n' + receiptText);
}

function customerLogout() {
    localStorage.removeItem('omda_current_cust');
    currentCustomer = null;
    document.getElementById('customer-dashboard').classList.add('hidden');
    document.getElementById('cust-login-box').classList.remove('hidden');
}

// لوحة تحكم الأدمن والخزنة والمبيعات اليومية
function adminLogin() {
    const pass = document.getElementById('admin-pass').value;
    if(pass === '1234') { 
        localStorage.setItem('omda_admin_logged', 'true');
        loadAdminDashboard();
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

function checkAdminSession() {
    if(localStorage.getItem('omda_admin_logged') === 'true') {
        loadAdminDashboard();
    }
}

function loadAdminDashboard() {
    document.getElementById('admin-login-box').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');

    // حساب الخزنة والمبيعات
    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    let totalSales = allOrders.reduce((sum, o) => sum + o.total, 0);

    let expenses = JSON.parse(localStorage.getItem('omda_expenses') || '[]');
    let totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    document.getElementById('vault-total-sales').innerText = totalSales + ' جنيه';
    document.getElementById('vault-total-expenses').innerText = totalExpenses + ' جنيه';

    const expList = document.getElementById('expenses-list');
    expList.innerHTML = '<strong>سجل المصروفات والنثريات:</strong>';
    if(expenses.length === 0) {
        expList.innerHTML += '<p style="color:#78716c; font-size:0.85rem;">لا توجد مصروفات مسجلة اليوم.</p>';
    } else {
        expenses.forEach((ex, idx) => {
            expList.innerHTML += `<div style="background:#fff; padding:6px; margin:4px 0; border-radius:4px; display:flex; justify-content:between;"><span>${ex.reason}</span> <strong>${ex.amount} ج</strong></div>`;
        });
    }

    const ordersList = document.getElementById('admin-orders-list');
    ordersList.innerHTML = '';

    if(allOrders.length === 0) {
        ordersList.innerHTML = '<p>لا توجد طلبات توصيل جديدة حتى الآن.</p>';
    } else {
        allOrders.forEach((order, index) => {
            ordersList.innerHTML += `
                <div class="order-card">
                    <p><strong>العميل:</strong> ${order.name} (${order.phone})</p>
                    <p><strong>العنوان:</strong> ${order.address}</p>
                    <p><strong>الطلب:</strong> ${order.items.map(i => i.name + ' (x' + i.qty + ')').join(', ')}</p>
                    <p><strong>الإجمالي:</strong> ${order.total} جنيه | <strong>التاريخ:</strong> ${order.date}</p>
                    <div style="margin-top: 10px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <label>حالة الشحنة:</label>
                        <select onchange="updateOrderStatus(${index}, this.value)">
                            <option value="pending" ${order.status==='pending'?'selected':''}>قيد المراجعة</option>
                            <option value="cooking" ${order.status==='cooking'?'selected':''}>جاري التجهيز والشوي 🔥</option>
                            <option value="delivery" ${order.status==='delivery'?'selected':''}>خرج مع الدليفري 🛵</option>
                            <option value="done" ${order.status==='done'?'selected':''}>تم التوصيل ✅</option>
                        </select>
                    </div>
                </div>
            `;
        });
    }

    let allRes = JSON.parse(localStorage.getItem('omda_reservations') || '[]');
    const resList = document.getElementById('admin-reservations-list');
    resList.innerHTML = '';

    if(allRes.length === 0) {
        resList.innerHTML = '<p>لا توجد حجوزات طاولات أو عزائم مسجلة حالياً.</p>';
    } else {
        allRes.forEach((res, index) => {
            resList.innerHTML += `
                <div class="order-card" style="border-right: 4px solid var(--secondary-color);">
                    <p><strong>حاجز الطاولة:</strong> ${res.name} (${res.phone})</p>
                    <p><strong>التاريخ والوقت:</strong> ${res.date} الساعة ${res.time} | <strong>الأفراد:</strong> ${res.guests}</p>
                    <p><strong>الملاحظات:</strong> ${res.notes || 'بدون ملاحظات'}</p>
                    <p><strong>حالة الحجز:</strong> <span class="status-badge ${res.status==='confirmed'?'status-done':'status-pending'}">${res.status==='confirmed'?'مؤكد ✅':'قيد المتابعة ⏳'}</span></p>
                    <button onclick="confirmReservation(${index})" class="btn-secondary btn-sm" style="margin-top: 8px;">تأكيد الحجز</button>
                </div>
            `;
        });
    }
}

// إضافة مصروف للخزنة
function addExpense() {
    const reason = document.getElementById('expense-reason').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);

    if(!reason || isNaN(amount)) {
        alert('أدخل سبب المصروف والمبلغ بشكل صحيح!');
        return;
    }

    let expenses = JSON.parse(localStorage.getItem('omda_expenses') || '[]');
    expenses.unshift({ reason, amount, date: new Date().toLocaleDateString('ar-EG') });
    localStorage.setItem('omda_expenses', JSON.stringify(expenses));

    alert('تم تسجيل المصروف في الخزنة بنجاح 💸');
    document.getElementById('expense-reason').value = '';
    document.getElementById('expense-amount').value = '';
    loadAdminDashboard();
}

// إنشاء أوردر جديد من لوحة الأدمن والمحاسب
function adminCreateOrder() {
    const name = document.getElementById('admin-ord-name').value.trim();
    const phone = document.getElementById('admin-ord-phone').value.trim();
    const address = document.getElementById('admin-ord-address').value.trim();
    const itemsText = document.getElementById('admin-ord-items').value.trim();
    const total = parseFloat(document.getElementById('admin-ord-total').value);

    if(!name || !phone || !address || !itemsText || isNaN(total)) {
        alert('من فضلك املأ كافة بيانات الطلب بدقة!');
        return;
    }

    const newOrder = {
        id: 'OMDA-' + Math.floor(100000 + Math.random() * 900000),
        name,
        phone,
        address,
        items: [{ name: itemsText, price: total, qty: 1 }],
        total,
        status: 'pending',
        date: new Date().toLocaleString('ar-EG')
    };

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    allOrders.unshift(newOrder);
    localStorage.setItem('omda_orders', JSON.stringify(allOrders));

    let earnedPoints = Math.floor(total / 10);
    let pointsDB = JSON.parse(localStorage.getItem('omda_points') || '{}');
    pointsDB[phone] = (pointsDB[phone] || 0) + earnedPoints;
    localStorage.setItem('omda_points', JSON.stringify(pointsDB));

    alert(`تم إنشاء وتسجيل الطلب للعميل ${name} بنجاح!`);
    
    document.getElementById('admin-ord-name').value = '';
    document.getElementById('admin-ord-phone').value = '';
    document.getElementById('admin-ord-address').value = '';
    document.getElementById('admin-ord-items').value = '';
    document.getElementById('admin-ord-total').value = '';

    loadAdminDashboard();
}

function updateOrderStatus(index, newStatus) {
    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    allOrders[index].status = newStatus;
    localStorage.setItem('omda_orders', JSON.stringify(allOrders));
    loadAdminDashboard();
}

function confirmReservation(index) {
    let allRes = JSON.parse(localStorage.getItem('omda_reservations') || '[]');
    allRes[index].status = 'confirmed';
    localStorage.setItem('omda_reservations', JSON.stringify(allRes));
    loadAdminDashboard();
}

function adminLogout() {
    localStorage.removeItem('omda_admin_logged');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('admin-login-box').classList.remove('hidden');
}

// تهيئة أولية عند فتح الصفحة
window.onload = function() {
    renderMenu();
    updateCartUI();
    const savedCust = localStorage.getItem('omda_current_cust');
    if(savedCust) {
        currentCustomer = JSON.parse(savedCust);
    }
};

// تسجيل Service Worker لعمل التطبيق كـ PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
