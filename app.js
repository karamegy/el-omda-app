// بيانات المنيو الأساسية مع صور تفصيلية للمشويات
const defaultProducts = [
    { id: 1, name: "صينية العمدة الكبرى", category: "trays", price: 2750, desc: "فرخة شيش + نص طرب + كيلو كفتة + نص كباب + نص سجق + 4 حمام + أرز + نص ممبار + 2 لتر بيبيسي", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500", mediaType: 'image' },
    { id: 2, name: "صينية الصحاب", category: "trays", price: 830, desc: "نص فرخة شيش + نص طرب + ربع سجق + طبق محشي مشكل + ربع ممبار + ورق عنب + 2 سمبوسة + أرز", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", mediaType: 'image' },
    { id: 3, name: "صينية العروسة", category: "trays", price: 2000, desc: "4 حمام + فرخة شيش + فرخة شواية + كيلو كفتة + طاجن ورق عنب بالكوارع + أرز", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500", mediaType: 'image' },
    { id: 4, name: "كباب ضاني (كيلو)", category: "grills", price: 1200, desc: "لحم ضاني بلدي طازج مشوي على الفحم الحطب", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500", mediaType: 'image' },
    { id: 5, name: "طرب ضاني (كيلو)", category: "grills", price: 480, desc: "أجمل طرب ضاني محشي بالطعم الخرافي", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500", mediaType: 'image' },
    { id: 6, name: "كفتة ضاني (كيلو)", category: "grills", price: 500, desc: "كفتة ضاني متبلة على طريقة العمدة الخاصة", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500", mediaType: 'image' },
    { id: 7, name: "كفتة كندوز (كيلو)", category: "grills", price: 320, desc: "كفتة بلدي كندوز مشوية بإتقان", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", mediaType: 'image' },
    { id: 8, name: "ريش ضاني (كيلو)", category: "grills", price: 1300, desc: "ريش ضاني ممتازة للعزومات", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500", mediaType: 'image' },
    { id: 9, name: "وجبة النعنشة", category: "meals", price: 130, desc: "ربع فراخ + سيخ كفتة + أرز + سلطة + طحينة", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500", mediaType: 'image' },
    { id: 10, name: "وجبة اللقلقانة", category: "meals", price: 80, desc: "سيخ كفتة + أرز + ملوخية + سلطة + عيش", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", mediaType: 'image' },
    { id: 11, name: "وجبة السعادة", category: "meals", price: 310, desc: "ربع فراخ + 1 حمام + ثمن طرب", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500", mediaType: 'image' },
    { id: 12, name: "وجبة الكرم", category: "meals", price: 160, desc: "ربع فراخ + كفتة + أرز + خضار سادة + عيش", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500", mediaType: 'image' },
    { id: 13, name: "حمام محشي أرز", category: "tagines", price: 180, desc: "حمام بلدي محشي أرز بالخلطة الممتازة", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500", mediaType: 'image' },
    { id: 14, name: "ورق عنب بالكوارع", category: "tagines", price: 150, desc: "طاجن ورق عنب بالكوارع اللذيذة", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", mediaType: 'image' },
    { id: 15, name: "ورقة لحمة", category: "appetizers", price: 100, desc: "ورقة لحمة بالبصل والفلفل على الفحم", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500", mediaType: 'image' },
    { id: 16, name: "طبق ممبار فاخر", category: "appetizers", price: 80, desc: "ممبار محشي ومحمر باللون الذهبي المقرمش", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500", mediaType: 'image' }
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
        const tickerEl = document.getElementById('main-ticker-text');
        if(tickerEl) tickerEl.innerText = savedTicker;
    }
}

function updateTickerText() {
    const inputEl = document.getElementById('admin-ticker-input');
    if(!inputEl) return;
    const newText = inputEl.value.trim();
    if(!newText) {
        alert('من فضلك اكتب نص الإعلان أولاً!');
        return;
    }
    localStorage.setItem('omda_ticker_text', newText);
    const tickerEl = document.getElementById('main-ticker-text');
    if(tickerEl) tickerEl.innerText = newText;
    alert('تم تحديث شريط الإعلانات المتحرك بنجاح يا أسطى كرم! 🚀');
    inputEl.value = '';
}

// تبديل التبويبات (للصفحة الرئيسية)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    if(targetTab) targetTab.classList.add('active');
    
    const btnMap = { 'menu': 0, 'custom-tray': 1, 'offers': 2, 'cart': 3, 'reservation': 4, 'favorites': 5, 'customer': 6 };
    const buttons = document.querySelectorAll('.nav-btn');
    if (buttons[btnMap[tabId]]) {
        buttons[btnMap[tabId]].classList.add('active');
    }

    if(tabId === 'favorites') {
        renderFavorites();
    } else if(tabId === 'offers') {
        renderOffers();
    } else if(tabId === 'customer' && currentCustomer) {
        loadCustomerDashboard();
    }
}

// عرض المنيو مع توجيه الصورة والنص لصفحة المنتج المستقلة (product.html)
function renderMenu(filter = 'all') {
    const grid = document.getElementById('menu-grid');
    if(!grid) return;
    grid.innerHTML = '';

    const filtered = filter === 'all' ? menuProducts : menuProducts.filter(p => p.category === filter);

    filtered.forEach(product => {
        const isFav = favorites.includes(product.id);
        const mediaSrc = product.media || product.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
        const isVid = product.mediaType === 'video' || (typeof mediaSrc === 'string' && (mediaSrc.startsWith('data:video') || mediaSrc.endsWith('.mp4')));

        let mediaHtml = isVid 
            ? `<video src="${mediaSrc}" class="menu-img" muted style="object-fit:cover; pointer-events: none;"></video>`
            : `<img src="${mediaSrc}" alt="${product.name}" class="menu-img">`;

        grid.innerHTML += `
            <div class="menu-card">
                <div onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">
                    ${mediaHtml}
                </div>
                <div class="menu-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3 onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color='#292524'">${product.name}</h3>
                        <button onclick="toggleFavorite(${product.id})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: ${isFav ? '#dc2626' : '#a8a29e'};">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                    </div>
                    <p onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">${product.desc}</p>
                    <div class="price">${product.price} جنيه</div>
                </div>
                <button onclick="addToCart(${product.id})"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>
            </div>
        `;
    });
}

function renderOffers() {
    const grid = document.getElementById('offers-grid');
    if(!grid) return;
    grid.innerHTML = '';
    const offers = menuProducts.filter(p => p.category === 'trays');

    offers.forEach(product => {
        const isFav = favorites.includes(product.id);
        const mediaSrc = product.media || product.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500';
        const isVid = product.mediaType === 'video' || (typeof mediaSrc === 'string' && (mediaSrc.startsWith('data:video') || mediaSrc.endsWith('.mp4')));

        let mediaHtml = isVid 
            ? `<video src="${mediaSrc}" class="menu-img" muted style="object-fit:cover; pointer-events: none;"></video>`
            : `<img src="${mediaSrc}" alt="${product.name}" class="menu-img">`;

        grid.innerHTML += `
            <div class="menu-card" style="border: 2px solid #d97706;">
                <div onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">
                    ${mediaHtml}
                </div>
                <div class="menu-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3 onclick="window.location.href='product.html?id=${product.id}'" style="color: #991b1b; cursor: pointer;">👑 ${product.name}</h3>
                        <button onclick="toggleFavorite(${product.id})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: ${isFav ? '#dc2626' : '#a8a29e'};">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                    </div>
                    <p onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">${product.desc}</p>
                    <div class="price">${product.price} جنيه</div>
                </div>
                <button onclick="addToCart(${product.id})"><i class="fa-solid fa-cart-plus"></i> أضف الصينية للسلة 🔥</button>
            </div>
        `;
    });
}

function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    renderMenu(cat);
}

// ميزة "صمم صينيتك بنفسك"
function addCustomTrayToCart() {
    const sizeSelect = document.getElementById('custom-size');
    const meatSelect = document.getElementById('custom-meat');
    const notesInput = document.getElementById('custom-notes');
    if(!sizeSelect || !meatSelect) return;

    const sizePrice = parseFloat(sizeSelect.value);
    const sizeText = sizeSelect.options[sizeSelect.selectedIndex].text;
    const meatType = meatSelect.value;
    const notes = notesInput ? notesInput.value.trim() : '';

    let extrasTotal = 0;
    let extrasDesc = [];

    const mombar = document.getElementById('ext-mombar');
    const mahshi = document.getElementById('ext-mahshi');
    const pepsi = document.getElementById('ext-pepsi');

    if(mombar && mombar.checked) { extrasTotal += 80; extrasDesc.push('ممبار'); }
    if(mahshi && mahshi.checked) { extrasTotal += 60; extrasDesc.push('محشي'); }
    if(pepsi && pepsi.checked) { extrasTotal += 50; extrasDesc.push('بيبيسي'); }

    let totalPrice = sizePrice + extrasTotal;
    let customName = `👑 صينية مخصصة (${sizeText.split(' ')[0]})`;
    let customDesc = `المحتوى: ${meatType} ${extrasDesc.length ? '+ إضافات: ' + extrasDesc.join(', ') : ''} ${notes ? '| ملاحظات: ' + notes : ''}`;

    const customTrayProd = {
        id: Date.now(),
        name: customName,
        price: totalPrice,
        desc: customDesc,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500",
        mediaType: 'image'
    };

    cart.push({ ...customTrayProd, qty: 1 });
    updateCartUI();
    alert(`تم تصميم صينيتك الخاصة وإضافتها للسلة بنجاح يا أسطى! 🚀`);
    switchTab('cart');
}

// إضافة منتج جديد مع دعم رفع صورة أو فيديو من الجهاز
function addNewProductWithMedia() {
    const name = document.getElementById('new-prod-name').value.trim();
    const category = document.getElementById('new-prod-cat').value;
    const price = parseFloat(document.getElementById('new-prod-price').value);
    const fileInput = document.getElementById('new-prod-file');
    const desc = document.getElementById('new-prod-desc').value.trim();

    if(!name || isNaN(price) || !desc) {
        alert('من فضلك ادخل اسم المنتج، السعر، والوصف بشكل صحيح!');
        return;
    }

    if(fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const mediaData = e.target.result;
            const isVideo = file.type.startsWith('video');

            const newProd = {
                id: Date.now(),
                name,
                category,
                price,
                media: mediaData,
                mediaType: isVideo ? 'video' : 'image',
                desc
            };

            saveAndAddNewProduct(newProd);
        };
        reader.readAsDataURL(file);
    } else {
        const newProd = {
            id: Date.now(),
            name,
            category,
            price,
            media: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
            mediaType: 'image',
            desc
        };
        saveAndAddNewProduct(newProd);
    }
}

function saveAndAddNewProduct(prod) {
    menuProducts.push(prod);
    localStorage.setItem('omda_custom_products', JSON.stringify(menuProducts));
    alert(`تم إضافة المنتج (${prod.name}) بنجاح إلى المنيو مع الوسائط! 👑`);
    
    document.getElementById('new-prod-name').value = '';
    document.getElementById('new-prod-price').value = '';
    document.getElementById('new-prod-file').value = '';
    document.getElementById('new-prod-desc').value = '';

    if(typeof loadAdminDashboard === 'function') loadAdminDashboard();
}

// حذف صنف من المنيو بواسطة الأدمن
function adminDeleteProduct(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الصنف نهائياً من المنيو؟')) return;
    menuProducts = menuProducts.filter(p => p.id !== id);
    localStorage.setItem('omda_custom_products', JSON.stringify(menuProducts));
    loadAdminDashboard();
    alert('تم حذف الصنف بنجاح من المنيو.');
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
    const offersTab = document.getElementById('tab-offers');
    const favTab = document.getElementById('tab-favorites');
    if(offersTab && offersTab.classList.contains('active')) renderOffers();
    if(favTab && favTab.classList.contains('active')) renderFavorites();
}

function renderFavorites() {
    const grid = document.getElementById('favorites-grid');
    if(!grid) return;
    grid.innerHTML = '';
    const favProducts = menuProducts.filter(p => favorites.includes(p.id));

    if(favProducts.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8a29e; padding: 20px;">لا توجد أطباق في قائمة المفضلة حالياً.</p>';
        return;
    }

    favProducts.forEach(product => {
        const mediaSrc = product.media || product.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
        const isVid = product.mediaType === 'video' || (typeof mediaSrc === 'string' && mediaSrc.startsWith('data:video'));
        let mediaHtml = isVid ? `<video src="${mediaSrc}" class="menu-img" muted style="object-fit:cover; pointer-events: none;"></video>` : `<img src="${mediaSrc}" alt="${product.name}" class="menu-img">`;

        grid.innerHTML += `
            <div class="menu-card">
                <div onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">
                    ${mediaHtml}
                </div>
                <div class="menu-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3 onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">${product.name}</h3>
                        <button onclick="toggleFavorite(${product.id})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: #dc2626;">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                    <p onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">${product.desc}</p>
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
    if(!prod) return;
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...prod, qty: 1 });
    }

    updateCartUI();
    alert(`تم إضافة (${prod.name}) إلى السلة بنجاح! 🛒`);
}

// تحديث السلة
function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    
    const list = document.getElementById('cart-items-list');
    if(!list) return;
    list.innerHTML = '';

    if(cart.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #78716c; padding: 20px;">سلة المبيعات فارغة حالياً.</p>';
        const totalEl = document.getElementById('cart-total');
        if(totalEl) totalEl.innerText = '0';
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
        const itemImg = item.media || item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=100';
        list.innerHTML += `
            <div class="cart-item-row">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <img src="${itemImg}" alt="${item.name}" class="cart-item-img" style="object-fit:cover;">
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
    const totalEl = document.getElementById('cart-total');
    if(totalEl) totalEl.innerText = total;
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

// تطبيق البرومو كود
function applyPromoCode() {
    const inputEl = document.getElementById('promo-input');
    if(!inputEl) return;
    const code = inputEl.value.trim().toUpperCase();
    const note = document.getElementById('discount-note');
    if(code === 'OMDA2026') {
        activeDiscount = 0.10;
        if(note) note.innerText = ' (تم تطبيق خصم البرومو كود 10% 🔥)';
        alert('مبروك! تم تطبيق كود الخصم 10% بنجاح.');
        updateCartUI();
    } else {
        activeDiscount = 0;
        if(note) note.innerText = '';
        alert('عذراً، البرومو كود غير صحيح أو منتهي الصلاحية.');
        updateCartUI();
    }
}

// إرسال الطلب وحساب نقاط الولاء
function submitOrder() {
    const nameEl = document.getElementById('order-name');
    const phoneEl = document.getElementById('order-phone');
    const addressEl = document.getElementById('order-address');
    if(!nameEl || !phoneEl || !addressEl) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const address = addressEl.value.trim();

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
    const nameEl = document.getElementById('order-name');
    const phoneEl = document.getElementById('order-phone');
    const addressEl = document.getElementById('order-address');
    if(!nameEl || !phoneEl || !addressEl) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const address = addressEl.value.trim();

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
    const nameEl = document.getElementById('res-name');
    const phoneEl = document.getElementById('res-phone');
    const dateEl = document.getElementById('res-date');
    const timeEl = document.getElementById('res-time');
    const guestsEl = document.getElementById('res-guests');
    const notesEl = document.getElementById('res-notes');
    if(!nameEl || !phoneEl || !dateEl || !timeEl || !guestsEl) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const date = dateEl.value;
    const time = timeEl.value;
    const guests = guestsEl.value;
    const notes = notesEl ? notesEl.value.trim() : '';

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
    nameEl.value = '';
    phoneEl.value = '';
    dateEl.value = '';
    timeEl.value = '';
    guestsEl.value = '';
    if(notesEl) notesEl.value = '';
    switchTab('menu');
}

// تسجيل دخول الزبون وتتبع الشحنة والتقييمات
function customerLogin() {
    const phoneInput = document.getElementById('login-phone');
    if(!phoneInput) return;
    const phone = phoneInput.value.trim();
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
    const loginBox = document.getElementById('cust-login-box');
    const dashBox = document.getElementById('customer-dashboard');
    if(!loginBox || !dashBox) return;

    loginBox.classList.add('hidden');
    dashBox.classList.remove('hidden');
    
    const displayName = document.getElementById('cust-display-name');
    const displayPhone = document.getElementById('cust-display-phone');
    if(displayName) displayName.innerText = currentCustomer.name;
    if(displayPhone) displayPhone.innerText = currentCustomer.phone;

    let pointsDB = JSON.parse(localStorage.getItem('omda_points') || '{}');
    let userPoints = pointsDB[currentCustomer.phone] || 0;
    const pointsEl = document.getElementById('cust-points');
    if(pointsEl) pointsEl.innerText = userPoints;

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    const myOrders = allOrders.filter(o => o.phone === currentCustomer.phone);

    const list = document.getElementById('customer-orders-list');
    if(!list) return;
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
    const ratingEl = document.getElementById(`rating-${orderId}`);
    const reviewEl = document.getElementById(`review-${orderId}`);
    if(!ratingEl || !reviewEl) return;

    const rating = ratingEl.value;
    const comment = reviewEl.value.trim() || 'بدون تعليق';

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
    const dashBox = document.getElementById('customer-dashboard');
    const loginBox = document.getElementById('cust-login-box');
    if(dashBox) dashBox.classList.add('hidden');
    if(loginBox) loginBox.classList.remove('hidden');
}

// ----------------- إدارة تسجيل دخول وطاقم الإدارة -----------------

function adminLogin() {
    const idInput = document.getElementById('admin-login-id').value.trim();
    const passInput = document.getElementById('admin-pass').value.trim();

    if(!idInput || !passInput) {
        alert('من فضلك أدخل البريد الإلكتروني (أو الهاتف) مع كلمة المرور!');
        return;
    }

    let masterPass = localStorage.getItem('omda_master_password') || '1234';

    // حساب المدير الافتراضي
    if((idInput === 'admin@omda.com' || idInput === '01144730305' || idInput === 'مدير') && passInput === masterPass) {
        const masterUser = { name: 'المدير العام', email: 'admin@omda.com', role: 'admin' };
        localStorage.setItem('omda_logged_user', JSON.stringify(masterUser));
        loadAdminDashboard();
        return;
    }

    // البحث في الحسابات المضافة للموظفين والمحاسبين
    let staffList = JSON.parse(localStorage.getItem('omda_staff_list') || '[]');
    let foundStaff = staffList.find(s => (s.email === idInput || s.phone === idInput) && s.password === passInput);

    if(foundStaff) {
        localStorage.setItem('omda_logged_user', JSON.stringify(foundStaff));
        loadAdminDashboard();
        alert(`أهلاً بك يا ${foundStaff.name}! تم تسجيل دخولك بنجاح.`);
    } else {
        alert('بيانات الدخول غير صحيحة! تأكد من البريد/الهاتف وكلمة المرور.');
    }
}

function createNewStaff() {
    const name = document.getElementById('staff-name').value.trim();
    const email = document.getElementById('staff-email').value.trim();
    const phone = document.getElementById('staff-phone').value.trim();
    const password = document.getElementById('staff-pass').value.trim();
    const role = document.getElementById('staff-role').value;

    if(!name || !email || !phone || !password) {
        alert('من فضلك املأ كافة بيانات الموظف أو المحاسب بدقة!');
        return;
    }

    let staffList = JSON.parse(localStorage.getItem('omda_staff_list') || '[]');
    
    // التحقق من عدم تكرار الإيميل أو الهاتف
    if(staffList.some(s => s.email === email || s.phone === phone)) {
        alert('هذا البريد أو الهاتف مسجل مسبقاً لموظف آخر!');
        return;
    }

    const newStaff = { id: Date.now(), name, email, phone, password, role };
    staffList.push(newStaff);
    localStorage.setItem('omda_staff_list', JSON.stringify(staffList));

    alert(`تم إنشاء حساب (${name}) بنجاح! يمكنه الآن تسجيل الدخول.`);
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-email').value = '';
    document.getElementById('staff-phone').value = '';
    document.getElementById('staff-pass').value = '';

    loadStaffList();
}

function loadStaffList() {
    const container = document.getElementById('staff-list-container');
    if(!container) return;
    container.innerHTML = '<strong>قائمة الموظفين والمحاسبين المسجلين:</strong>';

    let staffList = JSON.parse(localStorage.getItem('omda_staff_list') || '[]');
    if(staffList.length === 0) {
        container.innerHTML += '<p style="color:#78716c; font-size:0.85rem;">لا توجد حسابات موظفين إضافية مسجلة حالياً.</p>';
        return;
    }

    staffList.forEach((staff, index) => {
        let roleName = staff.role === 'accountant' ? 'محاسب' : (staff.role === 'staff' ? 'موظف' : 'مدير فرع');
        container.innerHTML += `
            <div style="background:#fff; padding:8px; margin:5px 0; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid #d6d3d1;">
                <div>
                    <strong>${staff.name}</strong> (${roleName})<br>
                    <span style="font-size:0.8rem; color:#57534e;">الإيميل: ${staff.email} | الهاتف: ${staff.phone}</span>
                </div>
                <button onclick="deleteStaff(${index})" class="btn-danger btn-sm" style="padding:4px 8px; font-size:0.8rem;">حذف</button>
            </div>
        `;
    });
}

function deleteStaff(index) {
    if(!confirm('هل أنت متأكد من حذف حساب هذا الموظف؟')) return;
    let staffList = JSON.parse(localStorage.getItem('omda_staff_list') || '[]');
    staffList.splice(index, 1);
    localStorage.setItem('omda_staff_list', JSON.stringify(staffList));
    loadStaffList();
    alert('تم حذف الحساب بنجاح.');
}

function changeMyPassword() {
    const currentPass = document.getElementById('current-pass-input').value.trim();
    const newPass = document.getElementById('new-pass-input').value.trim();
    const confirmPass = document.getElementById('confirm-pass-input').value.trim();

    if(!currentPass || !newPass || !confirmPass) {
        alert('من فضلك املأ كافة حقول كلمة المرور!');
        return;
    }

    if(newPass !== confirmPass) {
        alert('كلمة المرور الجديدة غير مطابقة لتأكيد كلمة المرور!');
        return;
    }

    let loggedUser = JSON.parse(localStorage.getItem('omda_logged_user') || '{}');

    if(loggedUser.role === 'admin' || loggedUser.email === 'admin@omda.com') {
        let masterPass = localStorage.getItem('omda_master_password') || '1234';
        if(currentPass !== masterPass) {
            alert('كلمة المرور الحالية غير صحيحة!');
            return;
        }
        localStorage.setItem('omda_master_password', newPass);
        alert('تم تغيير كلمة المرور الخاصة بالمدير الماستر بنجاح 🔒');
    } else {
        let staffList = JSON.parse(localStorage.getItem('omda_staff_list') || '[]');
        let staffIndex = staffList.findIndex(s => s.email === loggedUser.email);
        
        if(staffIndex > -1) {
            if(staffList[staffIndex].password !== currentPass) {
                alert('كلمة المرور الحالية غير صحيحة!');
                return;
            }
            staffList[staffIndex].password = newPass;
            localStorage.setItem('omda_staff_list', JSON.stringify(staffList));
            alert('تم تغيير كلمة المرور الخاصة بحسابك بنجاح 🔒');
        } else {
            alert('حدث خطأ أثناء تحديد المستخدم!');
            return;
        }
    }

    document.getElementById('current-pass-input').value = '';
    document.getElementById('new-pass-input').value = '';
    document.getElementById('confirm-pass-input').value = '';
}

function loadAdminDashboard() {
    const loginBox = document.getElementById('admin-login-box');
    const dashBox = document.getElementById('admin-dashboard');
    if(!loginBox || !dashBox) return;

    loginBox.classList.add('hidden');
    dashBox.classList.remove('hidden');

    let loggedUser = JSON.parse(localStorage.getItem('omda_logged_user') || '{}');
    const nameEl = document.getElementById('logged-user-name');
    const roleEl = document.getElementById('logged-user-role');
    const staffSection = document.getElementById('staff-management-section');

    if(nameEl) nameEl.innerText = loggedUser.name || 'مدير النظام';
    if(roleEl) roleEl.innerText = 'الصلاحية: ' + (loggedUser.role === 'admin' ? 'مدير ماستر (Master Admin)' : (loggedUser.role === 'accountant' ? 'محاسب' : 'موظف'));

    if(loggedUser.email !== 'admin@omda.com' && loggedUser.role !== 'admin') {
        if(staffSection) staffSection.style.display = 'none';
    } else {
        if(staffSection) staffSection.style.display = 'block';
        loadStaffList();
    }

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    let totalSales = allOrders.reduce((sum, o) => sum + o.total, 0);

    let expenses = JSON.parse(localStorage.getItem('omda_expenses') || '[]');
    let totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    let netProfit = totalSales - totalExpenses;

    const salesEl = document.getElementById('vault-total-sales');
    const expEl = document.getElementById('vault-total-expenses');
    const profitEl = document.getElementById('vault-net-profit');

    if(salesEl) salesEl.innerText = totalSales + ' جنيه';
    if(expEl) expEl.innerText = totalExpenses + ' جنيه';
    if(profitEl) {
        profitEl.innerText = netProfit + ' جنيه';
        profitEl.style.color = netProfit >= 0 ? '#166534' : '#dc2626';
    }

    const expList = document.getElementById('expenses-list');
    if(expList) {
        expList.innerHTML = '<strong>سجل المصروفات والنثريات:</strong>';
        if(expenses.length === 0) {
            expList.innerHTML += '<p style="color:#78716c; font-size:0.85rem;">لا توجد مصروفات مسجلة اليوم.</p>';
        } else {
            expenses.forEach((ex) => {
                expList.innerHTML += `<div style="background:#fff; padding:6px; margin:4px 0; border-radius:4px; display:flex; justify-content:space-between;"><span>${ex.reason}</span> <strong>${ex.amount} ج</strong></div>`;
            });
        }
    }

    const adminMenuList = document.getElementById('admin-menu-items-list');
    if(adminMenuList) {
        adminMenuList.innerHTML = '';
        if(menuProducts.length === 0) {
            adminMenuList.innerHTML = '<p style="color: #78716c;">لا توجد أصناف مسجلة في المنيو.</p>';
        } else {
            menuProducts.forEach(prod => {
                adminMenuList.innerHTML += `
                    <div style="background: #fff; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e7e5e4;">
                        <div>
                            <strong>${prod.name}</strong> (${prod.price} جنيه) - <span style="font-size:0.8rem; color:#78716c;">${prod.category}</span>
                        </div>
                        <button onclick="adminDeleteProduct(${prod.id})" class="btn-danger btn-sm" style="padding: 4px 10px; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                `;
            });
        }
    }

    const ordersList = document.getElementById('admin-orders-list');
    if(ordersList) {
        ordersList.innerHTML = '';
        if(allOrders.length === 0) {
            ordersList.innerHTML = '<p>لا توجد طلبات توصيل جديدة حتى الآن.</p>';
        } else {
            allOrders.forEach((order, index) => {
                ordersList.innerHTML += `
                    <div class="order-card">
                        <p><strong>رقم الطلب:</strong> ${order.id} | <strong>العميل:</strong> ${order.name} (${order.phone})</p>
                        <p><strong>العنوان:</strong> ${order.address}</p>
                        <p><strong>الطلب:</strong> ${order.items.map(i => i.name + ' (x' + i.qty + ')').join(', ')}</p>
                        <p><strong>الإجمالي:</strong> ${order.total} جنيه | <strong>التاريخ:</strong> ${order.date}</p>
                        <div style="margin-top: 10px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; justify-content: space-between;">
                            <div>
                                <label style="font-size:0.9rem; font-weight:bold;">حالة الشحنة:</label>
                                <select onchange="updateOrderStatus(${index}, this.value)" style="padding:6px; border-radius:6px;">
                                    <option value="pending" ${order.status==='pending'?'selected':''}>قيد المراجعة</option>
                                    <option value="cooking" ${order.status==='cooking'?'selected':''}>جاري التجهيز والشوي 🔥</option>
                                    <option value="delivery" ${order.status==='delivery'?'selected':''}>خرج مع الدليفري 🛵</option>
                                    <option value="done" ${order.status==='done'?'selected':''}>تم التوصيل ✅</option>
                                </select>
                            </div>
                            <button onclick="adminDeleteOrder(${index})" class="btn-danger btn-sm" style="padding: 6px 12px; font-size:0.85rem;"><i class="fa-solid fa-trash"></i> حذف الطلب</button>
                        </div>
                    </div>
                `;
            });
        }
    }

    let allRes = JSON.parse(localStorage.getItem('omda_reservations') || '[]');
    const resList = document.getElementById('admin-reservations-list');
    if(resList) {
        resList.innerHTML = '';
        if(allRes.length === 0) {
            resList.innerHTML = '<p>لا توجد حجوزات طاولات أو عزائم مسجلة حالياً.</p>';
        } else {
            allRes.forEach((res, index) => {
                resList.innerHTML += `
                    <div class="order-card" style="border-right: 4px solid var(--secondary-color);">
                        <p><strong>رقم الحجز:</strong> ${res.id} | <strong>حاجز الطاولة:</strong> ${res.name} (${res.phone})</p>
                        <p><strong>التاريخ والوقت:</strong> ${res.date} الساعة ${res.time} | <strong>الأفراد:</strong> ${res.guests}</p>
                        <p><strong>الملاحظات:</strong> ${res.notes || 'بدون ملاحظات'}</p>
                        <p><strong>حالة الحجز:</strong> <span class="status-badge ${res.status==='confirmed'?'status-done':'status-pending'}">${res.status==='confirmed'?'مؤكد ✅':'قيد المتابعة ⏳'}</span></p>
                        <div style="margin-top: 10px; display: flex; gap: 10px;">
                            <button onclick="confirmReservation(${index})" class="btn-secondary btn-sm" style="padding: 6px 12px; font-size:0.85rem;">تأكيد الحجز</button>
                            <button onclick="adminDeleteReservation(${index})" class="btn-danger btn-sm" style="padding: 6px 12px; font-size:0.85rem;"><i class="fa-solid fa-trash"></i> حذف الحجز</button>
                        </div>
                    </div>
                `;
            });
        }
    }
}

// إضافة مصروف للخزنة
function addExpense() {
    const reasonEl = document.getElementById('expense-reason');
    const amountEl = document.getElementById('expense-amount');
    if(!reasonEl || !amountEl) return;

    const reason = reasonEl.value.trim();
    const amount = parseFloat(amountEl.value);

    if(!reason || isNaN(amount)) {
        alert('أدخل سبب المصروف والمبلغ بشكل صحيح!');
        return;
    }

    let expenses = JSON.parse(localStorage.getItem('omda_expenses') || '[]');
    expenses.unshift({ reason, amount, date: new Date().toLocaleDateString('ar-EG') });
    localStorage.setItem('omda_expenses', JSON.stringify(expenses));

    alert('تم تسجيل المصروف في الخزنة بنجاح 💸');
    reasonEl.value = '';
    amountEl.value = '';
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

function adminDeleteOrder(index) {
    if(!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    allOrders.splice(index, 1);
    localStorage.setItem('omda_orders', JSON.stringify(allOrders));
    loadAdminDashboard();
    alert('تم حذف الطلب بنجاح.');
}

function confirmReservation(index) {
    let allRes = JSON.parse(localStorage.getItem('omda_reservations') || '[]');
    allRes[index].status = 'confirmed';
    localStorage.setItem('omda_reservations', JSON.stringify(allRes));
    loadAdminDashboard();
}

function adminDeleteReservation(index) {
    if(!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return;
    let allRes = JSON.parse(localStorage.getItem('omda_reservations') || '[]');
    allRes.splice(index, 1);
    localStorage.setItem('omda_reservations', JSON.stringify(allRes));
    loadAdminDashboard();
    alert('تم حذف الحجز بنجاح.');
}

function adminLogout() {
    localStorage.removeItem('omda_logged_user');
    window.location.href = 'admin.html';
}

window.onload = function() {
    renderMenu();
    updateCartUI();
    const savedCust = localStorage.getItem('omda_current_cust');
    if(savedCust) {
        currentCustomer = JSON.parse(savedCust);
    }
};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
