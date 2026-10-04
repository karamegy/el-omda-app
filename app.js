// Import Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLgvF-u77h-RwSSaJPLx4x-U3ZLOtuvrM",
  authDomain: "alaf-93848.firebaseapp.com",
  projectId: "alaf-93848",
  storageBucket: "alaf-93848.firebasestorage.app",
  messagingSenderId: "984757380320",
  appId: "1:984757380320:web:247065b2434c002c445c85",
  measurementId: "G-ESV2GNSQZ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let cart = [];

// DOM Elements
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.querySelector('.close-auth-modal');
const loginForm = document.getElementById('loginForm');
const adminBtn = document.getElementById('adminBtn');
const profileBtn = document.getElementById('profileBtn');
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeModal = document.querySelector('.close-modal');
const productsGrid = document.getElementById('productsGrid');
const addProductForm = document.getElementById('addProductForm');
const checkoutBtn = document.getElementById('checkoutBtn');

// التحكم في التنقل بين الأقسام
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadProducts(e.target.dataset.cat);
    });
});

// فتح وإغلاق النوافذ المنبثقة
authBtn.addEventListener('click', () => {
    if (currentUser) {
        signOut(auth).then(() => { location.reload(); });
    } else {
        authModal.style.display = 'flex';
    }
});
closeAuthModal.addEventListener('click', () => authModal.style.display = 'none');
cartBtn.addEventListener('click', () => { cartModal.style.display = 'flex'; updateCartUI(); });
closeModal.addEventListener('click', () => cartModal.style.display = 'none');

profileBtn.addEventListener('click', () => {
    switchSection('profileSection');
    loadUserProfile();
});

adminBtn.addEventListener('click', () => {
    switchSection('adminSection');
    loadAdminData();
});

function switchSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

// مراقبة حالة المستخدم وصلاحيات المدير
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authBtn.textContent = 'تسجيل الخروج';
        authModal.style.display = 'none';
        
        // التحقق من صلاحيات المدير من قاعدة البيانات Firestore
        const userDocRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().col === "admin") {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        currentUser = null;
        authBtn.textContent = 'تسجيل الدخول';
        adminBtn.style.display = 'none';
    }
});

// تسجيل الدخول
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('تم تسجيل الدخول بنجاح');
    } catch (error) {
        alert('خطأ في البيانات: ' + error.message);
    }
});

// تحميل المنتجات
async function loadProducts(category = 'all') {
    productsGrid.innerHTML = '<p>جاري تحميل المنتجات...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        productsGrid.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const prod = docSnap.data();
            if (category === 'all' || prod.category === category) {
                productsGrid.innerHTML += `
                    <div class="product-card">
                        <img src="${prod.image}" alt="${prod.name}">
                        <div class="product-info">
                            <h3>${prod.name}</h3>
                            <p class="product-price">${prod.price} ر.س</p>
                            <button class="btn-primary" onclick='addToCart(${JSON.stringify({id: docSnap.id, ...prod})})'>أضف للسلة</button>
                        </div>
                    </div>
                `;
            }
        });
    } catch (e) {
        // بيانات تجريبية في حال عدم وجود منتجات مسبقة في قاعدة البيانات
        productsGrid.innerHTML = `
            <div class="product-card">
                <img src="https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=500&q=80" alt="علاف مركز">
                <div class="product-info">
                    <h3>علاف تسمين عالي البروتين (50 كجم)</h3>
                    <p class="product-price">250 ر.س</p>
                    <button class="btn-primary" onclick="alert('تمت الإضافة للسلة')">أضف للسلة</button>
                </div>
            </div>
            <div class="product-card">
                <img src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=500&q=80" alt="حبوب الذرة">
                <div class="product-info">
                    <h3>ذرة صفراء مستوردة صافية (50 كجم)</h3>
                    <p class="product-price">180 ر.س</p>
                    <button class="btn-primary" onclick="alert('تمت الإضافة للسلة')">أضف للسلة</button>
                </div>
            </div>
        `;
    }
}

// إضافة للسلة
window.addToCart = function(product) {
    cart.push(product);
    alert('تمت إضافة المنتج إلى السلة بنجاح');
};

function updateCartUI() {
    const list = document.getElementById('cartItemsList');
    const totalSpan = document.getElementById('cartTotalPrice');
    list.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += Number(item.price);
        list.innerHTML += `<p>${item.name} - ${item.price} ر.س</p>`;
    });
    totalSpan.textContent = total;
    document.getElementById('cartCount').textContent = cart.length;
}

// إتمام الشراء وإنشاء الفاتورة
checkoutBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert('الرجاء تسجيل الدخول أولاً لإتمام الطلب');
        authModal.style.display = 'flex';
        return;
    }
    try {
        await addDoc(collection(db, "orders"), {
            userEmail: currentUser.email,
            items: cart,
            total: cart.reduce((sum, item) => sum + Number(item.price), 0),
            status: 'قيد المراجعة والشحن',
            date: new Date().toISOString()
        });
        alert('تم إرسال الطلب بنجاح وإنشاء الفاتورة!');
        cart = [];
        cartModal.style.display = 'none';
    } catch (err) {
        alert('حدث خطأ أثناء إتمام الطلب: ' + err.message);
    }
});

// إضافة منتج جديد (للمدير)
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "products"), {
            name: document.getElementById('prodName').value,
            price: document.getElementById('prodPrice').value,
            category: document.getElementById('prodCategory').value,
            image: document.getElementById('prodImage').value
        });
        alert('تم إضافة المنتج بنجاح للقاعدة!');
        addProductForm.reset();
        loadProducts();
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
});

// تحميل بيانات بروفايل العميل
async function loadUserProfile() {
    if (!currentUser) return;
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    document.getElementById('userPhoneDisplay').textContent = currentUser.phoneNumber || 'غير مسجل';
    
    // جلب فواتير وشحنات العميل
    const q = query(collection(db, "orders"), where("userEmail", "==", currentUser.email));
    const querySnapshot = await getDocs(q);
    let invoicesHtml = '';
    let shipmentsHtml = '';
    
    querySnapshot.forEach((doc) => {
        const order = doc.data();
        invoicesHtml += `<div style="background:#fff; padding:10px; margin:5px 0; border:1px solid #ddd;">فاتورة رقم: ${doc.id} - المجموع: ${order.total} ر.س</div>`;
        shipmentsHtml += `<div style="background:#fff; padding:10px; margin:5px 0; border:1px solid #ddd;">حالة الشحنة: <span style="color:green">${order.status}</span></div>`;
    });
    
    document.getElementById('userInvoicesList').innerHTML = invoicesHtml || '<p>لا توجد فواتير سابقة</p>';
    document.getElementById('userShipmentsList').innerHTML = shipmentsHtml || '<p>لا توجد شحنات نشطة</p>';
}

// إدارة تبويبات لوحة التحكم
window.switchAdminTab = function(tabName) {
    document.querySelectorAll('.admin-tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
    if (tabName === 'products') {
        document.getElementById('adminProductsTab').style.display = 'block';
    } else if (tabName === 'orders') {
        document.getElementById('adminOrdersTab').style.display = 'block';
        loadAllOrders();
    } else if (tabName === 'users') {
        document.getElementById('adminUsersTab').style.display = 'block';
        loadAllUsers();
    }
}

async function loadAllOrders() {
    const list = document.getElementById('adminOrdersList');
    const snapshot = await getDocs(collection(db, "orders"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const o = docSnap.data();
        list.innerHTML += `<div style="background:#fff; padding:10px; margin:5px 0;">عميل: ${o.userEmail} | المجموع: ${o.total} ر.س | الحالة: ${o.status}</div>`;
    });
}

async function loadAllUsers() {
    const list = document.getElementById('adminUsersList');
    const snapshot = await getDocs(collection(db, "users"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const u = docSnap.data();
        list.innerHTML += `<div style="background:#fff; padding:10px; margin:5px 0;">الاسم: ${u.name || 'غير محدد'} | البريد: ${u.email} | الصلاحية: ${u.col}</div>`;
    });
}

// التشغيل الأولي
loadProducts();
