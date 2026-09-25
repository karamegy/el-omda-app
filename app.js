// بيانات المنيو الخاصة بمشويات العمدة المستخرجة بدقة من المنيو الرسمي
const menuProducts = [
    { id: 1, name: "صينية العمدة الكبرى", category: "trays", price: 2750, desc: "فرخة شيش + نص طرب + كيلو كفتة + نص كباب + نص سجق + 4 حمام + أرز + نص ممبار + 2 لتر بيبيسي" },
    { id: 2, name: "صينية الصحاب", category: "trays", price: 830, desc: "نص فرخة شيش + نص طرب + ربع سجق + طبق محشي مشكل + ربع ممبار + ورق عنب + 2 سمبوسة + أرز" },
    { id: 3, name: "صينية العروسة", category: "trays", price: 2000, desc: "4 حمام + فرخة شيش + فرخة شواية + كيلو كفتة + طاجن ورق عنب بالكوارع + أرز" },
    { id: 4, name: "كباب ضاني (كيلو)", category: "grills", price: 1200, desc: "لحم ضاني بلدي طازج مشوي على الفحم الحطب" },
    { id: 5, name: "طرب ضاني (كيلو)", category: "grills", price: 480, desc: "أجمل طرب ضاني محشي بالطعم الخرافي" },
    { id: 6, name: "كفتة ضاني (كيلو)", category: "grills", price: 500, desc: "كفتة ضاني متبلة على طريقة العمدة الخاصة" },
    { id: 7, name: "كفتة كندوز (كيلو)", category: "grills", price: 320, desc: "كفتة بلدي كندوز مشوية بإتقان" },
    { id: 8, name: "ريش ضاني (كيلو)", category: "grills", price: 1300, desc: "ريش ضاني ممتازة للعزومات" },
    { id: 9, name: "وجبة النعنشة", category: "meals", price: 130, desc: "ربع فراخ + سيخ كفتة + أرز + سلطة + طحينة" },
    { id: 10, name: "وجبة اللقلقانة", category: "meals", price: 80, desc: "سيخ كفتة + أرز + ملوخية + سلطة + عيش" },
    { id: 11, name: "وجبة السعادة", category: "meals", price: 310, desc: "ربع فراخ + 1 حمام + ثمن طرب" },
    { id: 12, name: "وجبة الكرم", category: "meals", price: 160, desc: "ربع فراخ + كفتة + أرز + خضار سادة + عيش" },
    { id: 13, name: "حمام محشي أرز", category: "tagines", price: 180, desc: "حمام بلدي محشي أرز بالخلطة الممتازة" },
    { id: 14, name: "ورق عنب بالكوارع", category: "tagines", price: 150, desc: "طاجن ورق عنب بالكوارع اللذيذة" },
    { id: 15, name: "ورقة لحمة", category: "appetizers", price: 100, desc: "ورقة لحمة بالبصل والفلفل على الفحم" },
    { id: 16, name: "طبق ممبار فاخر", category: "appetizers", price: 80, desc: "ممبار محشي ومحمر باللون الذهبي المقرمش" }
];

let cart = [];
let currentCustomer = null;

// تبديل التبويبات
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabId === 'admin') {
        checkAdminSession();
    }
}

// عرض المنيو
function renderMenu(filter = 'all') {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    const filtered = filter === 'all' ? menuProducts : menuProducts.filter(p => p.category === filter);

    filtered.forEach(product => {
        grid.innerHTML += `
            <div class="menu-card">
                <div class="menu-card-body">
                    <h3>${product.name}</h3>
                    <p>${product.desc}</p>
                    <div class="price">${product.price} جنيه</div>
                </div>
                <button onclick="addToCart(${product.id})"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>
            </div>
        `;
    });
}

function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    renderMenu(cat);
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

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    const list = document.getElementById('cart-items-list');
    list.innerHTML = '';

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        list.innerHTML += `
            <div class="cart-item-row">
                <div>
                    <strong>${item.name}</strong> (${item.price} ج) x ${item.qty}
                </div>
                <div>
                    <strong>${item.price * item.qty} ج</strong>
                    <button onclick="removeFromCart(${item.id})" class="btn-secondary btn-sm"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    document.getElementById('cart-total').innerText = total;
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

// إرسال الطلب
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

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const newOrder = {
        id: 'OMDA-' + Math.floor(100000 + Math.random() * 900000),
        name,
        phone,
        address,
        items: [...cart],
        total,
        status: 'pending', // pending, cooking, delivery, done
        date: new Date().toLocaleString('ar-EG')
    };

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    allOrders.unshift(newOrder);
    localStorage.setItem('omda_orders', JSON.stringify(allOrders));

    alert(`تم إرسال طلبك بنجاح يا أسطى ${name}! رقم طلبك هو: ${newOrder.id}`);
    cart = [];
    updateCartUI();
    
    // تسجيل الدخول التلقائي للزبون ونقله لتويعاته
    currentCustomer = { name, phone };
    localStorage.setItem('omda_current_cust', JSON.stringify(currentCustomer));
    switchTab('customer');
    loadCustomerDashboard();
}

// بوابة الزبون وتتبع الشحنة
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

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    const myOrders = allOrders.filter(o => o.phone === currentCustomer.phone);

    const list = document.getElementById('customer-orders-list');
    list.innerHTML = '';

    myOrders.forEach(order => {
        let statusText = '';
        let badgeClass = '';
        if(order.status === 'pending') { statusText = '⏳ قيد المراجعة'; badgeClass = 'status-pending'; }
        else if(order.status === 'cooking') { statusText = '🔥 جاري الشوي والتجهيز'; badgeClass = 'status-cooking'; }
        else if(order.status === 'delivery') { statusText = '🛵 الشحنة خرجت مع الدليفري'; badgeClass = 'status-delivery'; }
        else if(order.status === 'done') { statusText = '✅ تم التوصيل بالهناء والشفاء'; badgeClass = 'status-done'; }

        list.innerHTML += `
            <div class="order-card">
                <p><strong>رقم الطلب:</strong> ${order.id}</p>
                <p><strong>التاريخ:</strong> ${order.date}</p>
                <p><strong>العنوان:</strong> ${order.address}</p>
                <p><strong>الإجمالي:</strong> ${order.total} جنيه</p>
                <p><strong>حالة الطلب والدليفري:</strong> <span class="status-badge ${badgeClass}">${statusText}</span></p>
            </div>
        `;
    });
}

function customerLogout() {
    localStorage.removeItem('omda_current_cust');
    currentCustomer = null;
    document.getElementById('customer-dashboard').classList.add('hidden');
    document.getElementById('cust-login-box').classList.remove('hidden');
}

// لوحة تحكم الأدمن الماستر
function adminLogin() {
    const pass = document.getElementById('admin-pass').value;
    if(pass === '1234') { // كلمة مرور الماستر يمكن تغييرها
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

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    const list = document.getElementById('admin-orders-list');
    list.innerHTML = '';

    if(allOrders.length === 0) {
        list.innerHTML = '<p>لا توجد طلبات جديدة حتى الآن.</p>';
        return;
    }

    allOrders.forEach((order, index) => {
        list.innerHTML += `
            <div class="order-card">
                <p><strong>العميل:</strong> ${order.name} (${order.phone})</p>
                <p><strong>العنوان:</strong> ${order.address}</p>
                <p><strong>الطلب:</strong> ${order.items.map(i => i.name + ' (x' + i.qty + ')').join(', ')}</p>
                <p><strong>الإجمالي:</strong> ${order.total} جنيه | <strong>التاريخ:</strong> ${order.date}</p>
                <div style="margin-top: 10px; display:flex; gap:10px; align-items:center;">
                    <label>تغيير حالة الشحنة:</label>
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

function updateOrderStatus(index, newStatus) {
    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    allOrders[index].status = newStatus;
    localStorage.setItem('omda_orders', JSON.stringify(allOrders));
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
    const savedCust = localStorage.getItem('omda_current_cust');
    if(savedCust) {
        currentCustomer = JSON.parse(savedCust);
    }
};

// تسجيل Service Worker ليعمل التطبيق كـ PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
