import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLgvF-u77h-RwSSaJPLx4x-U3ZLOtuvrM",
  authDomain: "alaf-93848.firebaseapp.com",
  projectId: "alaf-93848",
  storageBucket: "alaf-93848.firebasestorage.app",
  messagingSenderId: "984757380320",
  appId: "1:984757380320:web:247065b2434c002c445c85",
  measurementId: "G-ESV2GNSQZ4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let cart = [];
let allProductsCache = [];
let allCategoriesCache = [];
let userMap = null;
let adminMap = null;
let userMarker = null;
let selectedLat = 30.0444; 
let selectedLng = 31.2357;

// DOM Elements
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.querySelector('.close-auth-modal');
const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const adminBtn = document.getElementById('adminBtn');
const profileBtn = document.getElementById('profileBtn');
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeModal = document.querySelector('.close-modal');
const productsGrid = document.getElementById('productsGrid');
const addProductForm = document.getElementById('addProductForm');
const addCategoryForm = document.getElementById('addCategoryForm');
const checkoutBtn = document.getElementById('checkoutBtn');
const searchInput = document.getElementById('searchInput');
const saveLocationBtn = document.getElementById('saveLocationBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// البحث التفاعلي
searchInput.addEventListener('input', (e) => {
    const activeCat = document.querySelector('.cat-chip.active') ? document.querySelector('.cat-chip.active').dataset.cat : 'all';
    renderProducts(activeCat, e.target.value);
});

// فتح وإغلاق النوافذ
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
    setTimeout(() => { initUserMap(); }, 300);
});

adminBtn.addEventListener('click', () => {
    switchSection('adminSection');
    loadCategoriesForAdmin();
    loadAdminProductsList();
});

function switchSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

// تسجيل الدخول باستخدام حساب جوجل
googleLoginBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                email: user.email,
                name: user.displayName || 'عميل جوجل',
                phone: user.phoneNumber || '',
                col: user.email === "haretg@gmail.com" ? "admin" : "customer"
            });
        }
        alert('تم تسجيل الدخول بحساب جوجل بنجاح!');
        authModal.style.display = 'none';
    } catch (error) {
        alert('خطأ في تسجيل الدخول بجوجل: ' + error.message);
    }
});

// مراقبة حالة المستخدم وصلاحيات المدير المطلقة
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج';
        authModal.style.display = 'none';
        profileBtn.style.display = 'flex';
        
        if (user.email === "haretg@gmail.com") {
            adminBtn.style.display = 'flex';
        } else {
            try {
                const userDocRef = doc(db, "users", user.email);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().col === "admin") {
                    adminBtn.style.display = 'flex';
                } else {
                    adminBtn.style.display = 'none';
                }
            } catch (err) {
                adminBtn.style.display = 'none';
            }
        }
    } else {
        currentUser = null;
        authBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> تسجيل الدخول';
        adminBtn.style.display = 'none';
        profileBtn.style.display = 'none';
    }
});

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

// تحميل الأقسام ديناميكياً
async function loadCategories() {
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        allCategoriesCache = [];
        querySnapshot.forEach((docSnap) => {
            allCategoriesCache.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (allCategoriesCache.length === 0) {
            // أقسام افتراضية أولية إذا كانت القاعدة فارغة
            allCategoriesCache = [
                { id: 'concentrates', name: 'أعلاف مركزة', icon: 'fa-solid fa-boxes-stacked' },
                { id: 'grains', name: 'حبوب وبقوليات', icon: 'fa-solid fa-seedling' },
                { id: 'supplements', name: 'مكملات وفيتامينات', icon: 'fa-solid fa-pills' },
                { id: 'veterinary', name: 'أدوية بيطرية', icon: 'fa-solid fa-kit-medical' }
            ];
        }

        const catContainer = document.getElementById('categoriesContainer');
        catContainer.innerHTML = `<button class="cat-chip active" data-cat="all"><i class="fa-solid fa-border-all"></i> كل المنتجات</button>`;
        
        const prodCategorySelect = document.getElementById('prodCategory');
        if (prodCategorySelect) prodCategorySelect.innerHTML = '';

        allCategoriesCache.forEach(cat => {
            catContainer.innerHTML += `<button class="cat-chip" data-cat="${cat.id}"><i class="${cat.icon || 'fa-solid fa-wheat-awn'}"></i> ${cat.name}</button>`;
            if (prodCategorySelect) {
                prodCategorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            }
        });

        // ربط الأحداث للأقسام الجديدة
        document.querySelectorAll('.cat-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                renderProducts(e.currentTarget.dataset.cat, searchInput.value);
            });
        });

    } catch (e) {
        console.error("Error loading categories:", e);
    }
}

// تحميل المنتجات
async function loadProducts() {
    await loadCategories();
    productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">جاري تحميل المنتجات...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProductsCache = [];
        querySnapshot.forEach((docSnap) => {
            allProductsCache.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        if (allProductsCache.length === 0) {
            allProductsCache = [
                { id: '1', name: 'علاف تسمين عالي البروتين (50 كجم)', price: '250', category: 'concentrates', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=500&q=80' },
                { id: '2', name: 'ذرة صفراء مستوردة صافية (50 كجم)', price: '180', category: 'grains', image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=500&q=80' }
            ];
        }
        renderProducts('all', '');
    } catch (e) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">حدث خطأ أثناء تحميل المنتجات.</p>';
    }
}

function renderProducts(category, searchTerm) {
    productsGrid.innerHTML = '';
    const filtered = allProductsCache.filter(prod => {
        const matchesCat = (category === 'all' || prod.category === category);
        const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">لا توجد منتجات مطابقة.</p>';
        return;
    }

    filtered.forEach(prod => {
        productsGrid.innerHTML += `
            <div class="product-card">
                <img src="${prod.image}" alt="${prod.name}">
                <div class="product-info">
                    <h3>${prod.name}</h3>
                    <p class="product-price">${prod.price} ج.م</p>
                    <button class="btn-primary-action" onclick='addToCart(${JSON.stringify(prod)})'>أضف للسلة</button>
                </div>
            </div>
        `;
    });
}

window.addToCart = function(product) {
    cart.push(product);
    alert('تمت إضافة المنتج إلى السلة بنجاح');
    updateCartUI();
};

function updateCartUI() {
    const list = document.getElementById('cartItemsList');
    const totalSpan = document.getElementById('cartTotalPrice');
    list.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += Number(item.price);
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <span>${item.name}</span> 
                <div>
                    <strong>${item.price} ج.م</strong>
                    <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer; margin-right:8px;"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    });
    totalSpan.textContent = total;
    document.getElementById('cartCount').textContent = cart.length;
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

checkoutBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert('الرجاء تسجيل الدخول أولاً لإتمام الطلب');
        authModal.style.display = 'flex';
        return;
    }
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }
    try {
        await addDoc(collection(db, "orders"), {
            userEmail: currentUser.email,
            items: cart,
            total: cart.reduce((sum, item) => sum + Number(item.price), 0),
            status: 'قيد المراجعة والشحن (أسطول العمدة)',
            lat: selectedLat,
            lng: selectedLng,
            date: new Date().toLocaleDateString('ar-EG')
        });
        alert('تم إرسال الطلب بنجاح وتحديد موقع الشحنة على الخريطة!');
        cart = [];
        cartModal.style.display = 'none';
        updateCartUI();
    } catch (err) {
        alert('خطأ أثناء إتمام الطلب: ' + err.message);
    }
});

// إدارة المنتجات للأدمن (إضافة / تعديل / حذف)
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editProductId').value;
    const prodData = {
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        category: document.getElementById('prodCategory').value,
        image: document.getElementById('prodImage').value
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "products", editId), prodData);
            alert('تم تحديث المنتج بنجاح!');
            document.getElementById('editProductId').value = '';
            document.getElementById('productFormTitle').textContent = 'إضافة منتج جديد للمتجر';
            document.getElementById('saveProductBtn').textContent = 'نشر المنتج الآن';
            cancelEditBtn.style.display = 'none';
        } else {
            await addDoc(collection(db, "products"), prodData);
            alert('تم إضافة المنتج بنجاح للقاعدة!');
        }
        addProductForm.reset();
        loadProducts();
        loadAdminProductsList();
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
});

cancelEditBtn.addEventListener('click', () => {
    addProductForm.reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('productFormTitle').textContent = 'إضافة منتج جديد للمتجر';
    document.getElementById('saveProductBtn').textContent = 'نشر المنتج الآن';
    cancelEditBtn.style.display = 'none';
});

async function loadAdminProductsList() {
    const list = document.getElementById('adminProductsList');
    list.innerHTML = 'جاري التحميل...';
    try {
        const snapshot = await getDocs(collection(db, "products"));
        list.innerHTML = '';
        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const id = docSnap.id;
            list.innerHTML += `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${p.name}</strong> - <span style="color:#d4a373">${p.price} ج.م</span> (${p.category})
                    </div>
                    <div>
                        <button onclick='editProduct("${id}", ${JSON.stringify(p.name)}, "${p.price}", "${p.category}", "${p.image}")' style="background:#2c5e3b; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-left:5px;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick='deleteProduct("${id}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في التحميل.';
    }
}

window.editProduct = function(id, name, price, category, image) {
    document.getElementById('editProductId').value = id;
    document.getElementById('prodName').value = name;
    document.getElementById('prodPrice').value = price;
    document.getElementById('prodCategory').value = category;
    document.getElementById('prodImage').value = image;
    document.getElementById('productFormTitle').textContent = 'تعديل بيانات المنتج';
    document.getElementById('saveProductBtn').textContent = 'حفظ التعديلات';
    cancelEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        try {
            await deleteDoc(doc(db, "products", id));
            alert('تم الحذف بنجاح');
            loadProducts();
            loadAdminProductsList();
        } catch (e) {
            alert('خطأ أثناء الحذف: ' + e.message);
        }
};
}

// إضافة قسم جديد للأدمن
addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catId = document.getElementById('catIdInput').value.trim();
    const catName = document.getElementById('catNameInput').value.trim();
    const catIcon = document.getElementById('catIconInput').value.trim();

    try {
        await setDoc(doc(db, "categories", catId), {
            name: catName,
            icon: catIcon
        });
        alert('تم إضافة القسم الجديد بنجاح!');
        addCategoryForm.reset();
        loadCategories();
        loadCategoriesForAdmin();
    } catch (err) {
        alert('خطأ في إضافة القسم: ' + err.message);
    }
});

async function loadCategoriesForAdmin() {
    const list = document.getElementById('adminCategoriesList');
    list.innerHTML = 'جاري التحميل...';
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        list.innerHTML = '';
        snapshot.forEach(docSnap => {
            const c = docSnap.data();
            const id = docSnap.id;
            list.innerHTML += `
                <div class="data-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <div><i class="${c.icon || 'fa-solid fa-wheat-awn'}"></i> <strong>${c.name}</strong> (معرف: ${id})</div>
                    <button onclick='deleteCategory("${id}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i> حذف القسم</button>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في التحميل.';
    }
}

window.deleteCategory = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        try {
            await deleteDoc(doc(db, "categories", id));
            alert('تم حذف القسم بنجاح');
            loadCategories();
            loadCategoriesForAdmin();
        } catch (e) {
            alert('خطأ أثناء الحذف: ' + e.message);
        }
    }
};

async function loadUserProfile() {
    if (!currentUser) return;
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    
    const roleDisplay = document.getElementById('userRoleDisplay');
    if (currentUser.email === "haretg@gmail.com") {
        roleDisplay.textContent = "مدير النظام الرئيسي (Admin)";
        roleDisplay.style.color = "#d4a373";
    } else {
        roleDisplay.textContent = "عميل معتمد";
    }

    const q = query(collection(db, "orders"), where("userEmail", "==", currentUser.email));
    const querySnapshot = await getDocs(q);
    let invoicesHtml = '';
    
    querySnapshot.forEach((docSnap) => {
        const order = docSnap.data();
        invoicesHtml += `<div style="background:#f9f9f9; padding:10px; margin-bottom:8px; border-radius:6px;">رقم الطلب: #${docSnap.id.slice(0,6)} | الإجمالي: <strong>${order.total} ج.م</strong> | الحالة: <span style="color:green">${order.status}</span></div>`;
    });
    
    document.getElementById('userInvoicesList').innerHTML = invoicesHtml || '<p>لا توجد فواتير سابقة</p>';
}

function initUserMap() {
    if (userMap) {
        userMap.invalidateSize();
        return;
    }
    userMap = L.map('userMap').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(userMap);

    userMarker = L.marker([30.0444, 31.2357], { draggable: true }).addTo(userMap);
    userMarker.on('dragend', function (e) {
        const pos = userMarker.getLatLng();
        selectedLat = pos.lat;
        selectedLng = pos.lng;
    });

    userMap.on('click', function(e) {
        userMarker.setLatLng(e.latlng);
        selectedLat = e.latlng.lat;
        selectedLng = e.latlng.lng;
    });
}

saveLocationBtn.addEventListener('click', () => {
    alert('تم حفظ موقع التوصيل المختار بنجاح لاستخدامه عند الطلب!');
});

window.switchAdminTab = function(tabName) {
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
    } else if (tabName === 'orders') {
        document.getElementById('adminOrdersTab').style.display = 'block';
        document.getElementById('tabOrdBtn').classList.add('active');
        loadAllOrders();
    } else if (tabName === 'map') {
        document.getElementById('adminMapTab').style.display = 'block';
        document.getElementById('tabMapBtn').classList.add('active');
        setTimeout(() => { initAdminMap(); }, 300);
    } else if (tabName === 'users') {
        document.getElementById('adminUsersTab').style.display = 'block';
        document.getElementById('tabUserBtn').classList.add('active');
        loadAllUsers();
    }
}

async function loadAllOrders() {
    const list = document.getElementById('adminOrdersList');
    const snapshot = await getDocs(collection(db, "orders"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const o = docSnap.data();
        const id = docSnap.id;
        list.innerHTML += `
            <div class="data-item">
                الطلب #${id.slice(0,6)} | العميل: ${o.userEmail} | المجموع: <strong>${o.total} ج.م</strong> | الحالة: <span style="color:#2c5e3b">${o.status}</span>
                <div style="margin-top:8px;">
                    <button onclick='updateOrderStatus("${id}", "جاري التوصيل عبر أسطول العمدة")' style="background:#1e3d2f; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">تعيين للأسطول وجاري التوصيل</button>
                    <button onclick='updateOrderStatus("${id}", "تم التسليم بنجاح")' style="background:green; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;">تم التسليم</button>
                </div>
            </div>`;
    });
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        alert('تم تحديث حالة الطلب بنجاح');
        loadAllOrders();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

async function loadAllUsers() {
    const list = document.getElementById('adminUsersList');
    const snapshot = await getDocs(collection(db, "users"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const u = docSnap.data();
        const email = docSnap.id;
        list.innerHTML += `
            <div class="data-item" style="display:flex; justify-content:space-between; align-items:center;">
                <div>الاسم: ${u.name || 'غير محدد'} | البريد: ${email} | الصلاحية: <strong>${u.col}</strong></div>
                <div>
                    <button onclick='toggleUserRole("${email}", "${u.col}")' style="background:#d4a373; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">تبديل الصلاحية (مدير/عميل)</button>
                </div>
            </div>`;
    });
}

window.toggleUserRole = async function(email, currentCol) {
    const newCol = currentCol === "admin" ? "customer" : "admin";
    try {
        await updateDoc(doc(db, "users", email), { col: newCol });
        alert('تم تحديث صلاحية المستخدم بنجاح!');
        loadAllUsers();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

async function initAdminMap() {
    if (adminMap) {
        adminMap.invalidateSize();
        return;
    }
    adminMap = L.map('adminMap').setView([30.0444, 31.2357], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(adminMap);

    const snapshot = await getDocs(collection(db, "orders"));
    snapshot.forEach(docSnap => {
        const order = docSnap.data();
        if (order.lat && order.lng) {
            L.marker([order.lat, order.lng]).addTo(adminMap)
                .bindPopup(`<b>عميل:</b> ${order.userEmail}<br><b>المبلغ:</b> ${order.total} ج.م<br><b>الحالة:</b> ${order.status}`);
        }
    });
}

loadProducts();
