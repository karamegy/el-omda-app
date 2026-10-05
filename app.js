import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let currentUserRole = 'customer';
let cart = [];
let allProductsCache = [];
let allCategoriesCache = [];
let userMap = null;
let adminMap = null;
let userMarker = null;
let selectedLat = 30.0444; 
let selectedLng = 31.2357;
let carouselInterval = null;

// متغيرات عامة لتخزين الوسائط القديمة عند التعديل بنجاح
let editingOldMediaUrl = '';
let editingOldMediaType = 'image';

// متغيرات إحداثيات السيارة الجديدة عند إضافتها للأسطول
let newVehLat = 30.0444;
let newVehLng = 31.2357;

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
const cancelCatEditBtn = document.getElementById('cancelCatEditBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const searchInput = document.getElementById('searchInput');
const saveLocationBtn = document.getElementById('saveLocationBtn');
const locateMeBtn = document.getElementById('locateMeBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const invoiceModal = document.getElementById('invoiceModal');
const closeInvoiceModalBtn = document.getElementById('closeInvoiceModalBtn');
const saveInvoiceImgBtn = document.getElementById('saveInvoiceImgBtn');
const trackInvoiceBtn = document.getElementById('trackInvoiceBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationsModal = document.getElementById('notificationsModal');
const sendNotificationForm = document.getElementById('sendNotificationForm');
const productDetailModal = document.getElementById('productDetailModal');

searchInput.addEventListener('input', (e) => {
    const activeCat = document.querySelector('.cat-chip.active') ? document.querySelector('.cat-chip.active').dataset.cat : 'all';
    renderProducts(activeCat, e.target.value);
});

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
document.querySelector('.close-invoice-modal').addEventListener('click', () => invoiceModal.style.display = 'none');
closeInvoiceModalBtn.addEventListener('click', () => invoiceModal.style.display = 'none');
document.querySelector('.close-prod-modal').addEventListener('click', () => productDetailModal.style.display = 'none');

notificationsBtn.addEventListener('click', () => {
    notificationsModal.style.display = 'flex';
    loadNotifications();
});
document.querySelector('.close-notif-modal').addEventListener('click', () => notificationsModal.style.display = 'none');

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
                col: user.email === "haretg@gmail.com" ? "admin" : "customer"
            });
        }
        alert('تم تسجيل الدخول بحساب جوجل بنجاح!');
        authModal.style.display = 'none';
    } catch (error) {
        alert('خطأ في تسجيل الدخول بجوجل: ' + error.message);
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج';
        authModal.style.display = 'none';
        profileBtn.style.display = 'flex';
        checkUnreadNotifications();
        
        try {
            const userDocRef = doc(db, "users", user.email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                currentUserRole = userDoc.data().col || "customer";
            } else if (user.email === "haretg@gmail.com") {
                currentUserRole = "admin";
            }
            
            if (["admin", "assistant_manager", "accountant", "employee"].includes(currentUserRole)) {
                adminBtn.style.display = 'flex';
            } else {
                adminBtn.style.display = 'none';
            }
        } catch (err) {
            adminBtn.style.display = 'none';
        }
    } else {
        currentUser = null;
        currentUserRole = 'customer';
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                email: user.email,
                name: user.email === "haretg@gmail.com" ? "مدير النظام" : "عميل",
                col: user.email === "haretg@gmail.com" ? "admin" : "customer"
            });
        }

        alert('تم تسجيل الدخول بنجاح');
        authModal.style.display = 'none';
        location.reload();
    } catch (error) {
        alert('خطأ في البيانات أو الصلاحيات: ' + error.message);
    }
});

async function loadCategories() {
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        allCategoriesCache = [];
        querySnapshot.forEach((docSnap) => {
            allCategoriesCache.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (allCategoriesCache.length === 0) {
            allCategoriesCache = [
                { id: 'concentrates', name: 'أعلاف مركزة', icon: 'fa-solid fa-boxes-stacked' },
                { id: 'grains', name: 'حبوب وبقوليات', icon: 'fa-solid fa-seedling' },
                { id: 'supplements', name: 'مكملات وفيتامينات', icon: 'fa-solid fa-pills' },
                { id: 'veterinary', name: 'أدوية بيطرية', icon: 'fa-solid fa-kit-medical' }
            ];
            for (let cat of allCategoriesCache) {
                await setDoc(doc(db, "categories", cat.id), { name: cat.name, icon: cat.icon });
            }
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
            const defaultProducts = [
                { name: 'علاف تسمين عالي البروتين (50 كجم)', price: '250', category: 'concentrates', mediaUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=500&q=80', mediaType: 'image' },
                { name: 'ذرة صفراء مستوردة صافية (50 كجم)', price: '180', category: 'grains', mediaUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=500&q=80', mediaType: 'image' }
            ];
            for (let prod of defaultProducts) {
                await addDoc(collection(db, "products"), prod);
            }
            const freshSnapshot = await getDocs(collection(db, "products"));
            freshSnapshot.forEach((docSnap) => {
                allProductsCache.push({ id: docSnap.id, ...docSnap.data() });
            });
        }
        renderProducts('all', '');
        startProductCarousel();
    } catch (e) {
        console.error("Error loading products:", e);
    }
}

// العروض السريعة المتطورة مع تثبيت الأبعاد ومنع الاهتزاز
function startProductCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (allProductsCache.length === 0) return;
    let index = 0;
    const bannerContainer = document.getElementById('dynamicBannerCarousel');
    if (!bannerContainer) return;
    
    bannerContainer.style.minHeight = "90px";
    bannerContainer.style.overflow = "hidden";
    
    const updateCarouselItem = () => {
        if (!bannerContainer) return;
        const prod = allProductsCache[index];
        let mediaThumb = `<img src="${prod.mediaUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=100&q=80'}" style="width:65px; height:65px; border-radius:10px; object-fit:cover; flex-shrink:0;">`;
        if (prod.mediaType === 'video') {
            mediaThumb = `<video src="${prod.mediaUrl}" style="width:65px; height:65px; border-radius:10px; object-fit:cover; flex-shrink:0;"></video>`;
        }
        
        bannerContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; cursor: pointer; flex: 1; width: 100%; min-width:0;" onclick='openProductModal(${JSON.stringify(prod)})'>
                <i class="fa-solid fa-bullhorn" style="font-size: 2rem; color: var(--accent); flex-shrink:0;"></i>
                ${mediaThumb}
                <div style="flex: 1; min-width: 0;">
                    <h4 style="color: var(--primary); font-size: 1.05rem; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.name}</h4>
                    <p style="font-size: 0.9rem; color: var(--accent); font-weight: bold;">السعر: ${prod.price} ج.م</p>
                </div>
            </div>
            <span style="background: var(--primary); color: #fff; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; flex-shrink:0;">عروض سريعة</span>
        `;
        index = (index + 1) % allProductsCache.length;
    };

    updateCarouselItem();
    carouselInterval = setInterval(updateCarouselItem, 3500);
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
        let mediaHtml = `<img src="${prod.mediaUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=500&q=80'}" alt="${prod.name}">`;
        if (prod.mediaType === 'video') {
            mediaHtml = `<video src="${prod.mediaUrl}" style="width:100%; height:180px; object-fit:cover;"></video>`;
        }

        productsGrid.innerHTML += `
            <div class="product-card" onclick='openProductModal(${JSON.stringify(prod)})'>
                ${mediaHtml}
                <div class="product-info">
                    <h3>${prod.name}</h3>
                    <p class="product-price">${prod.price} ج.م</p>
                    <button class="btn-primary-action" onclick='event.stopPropagation(); openProductModal(${JSON.stringify(prod)})'>عرض التفاصيل والحجز</button>
                </div>
            </div>
        `;
    });
}

window.openProductModal = function(product) {
    if (!document.getElementById('productDetailModal')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'productDetailModal';
        modalDiv.className = 'modal-overlay';
        modalDiv.style.display = 'none';
        modalDiv.innerHTML = `
            <div class="modal-container" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 id="modalProdTitle">تفاصيل المنتج</h3>
                    <span class="close-prod-modal" style="font-size: 1.6rem; cursor: pointer; color: #fff;">&times;</span>
                </div>
                <div class="modal-body" id="modalProdBody" style="background:#fff; padding:20px;"></div>
            </div>
        `;
        document.body.appendChild(modalDiv);
        modalDiv.querySelector('.close-prod-modal').onclick = () => modalDiv.style.display = 'none';
    }

    document.getElementById('modalProdTitle').textContent = product.name;
    const body = document.getElementById('modalProdBody');
    
    let mediaHtml = `<img src="${product.mediaUrl || ''}" style="width:100%; height:250px; border-radius:8px; object-fit:cover; margin-bottom:15px;">`;
    if (product.mediaType === 'video') {
        mediaHtml = `<video src="${product.mediaUrl}" controls autoplay style="width:100%; height:250px; border-radius:8px; object-fit:cover; margin-bottom:15px;"></video>`;
    }

    body.innerHTML = `
        ${mediaHtml}
        <h3 style="color:var(--primary); margin-bottom:8px;">${product.name}</h3>
        <p style="font-size:1.3rem; font-weight:bold; color:var(--accent); margin-bottom:15px;">السعر: ${product.price} ج.م</p>
        <div class="input-group" style="margin-bottom:15px;">
            <label>حدد الكمية المطلوبة للحجز:</label>
            <input type="number" id="modalQtyInput" value="1" min="1" style="padding:10px; border-radius:8px; border:1px solid #ccc; width:100%;">
        </div>
        <button id="modalAddToCartBtn" class="btn-submit" style="background:var(--primary);">إضافة للسلة وحجز الكمية</button>
    `;

    document.getElementById('modalAddToCartBtn').onclick = () => {
        const qty = parseInt(document.getElementById('modalQtyInput').value) || 1;
        for (let i = 0; i < qty; i++) {
            cart.push(product);
        }
        alert(`تمت إضافة ${qty} قطعة من (${product.name}) إلى السلة بنجاح!`);
        updateCartUI();
        document.getElementById('productDetailModal').style.display = 'none';
    };

    document.getElementById('productDetailModal').style.display = 'flex';
};

window.addToCart = function(product) {
    openProductModal(product);
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
    const paymentType = document.getElementById('paymentTypeSelect').value;
    try {
        const orderRef = await addDoc(collection(db, "orders"), {
            userEmail: currentUser.email,
            items: cart,
            total: cart.reduce((sum, item) => sum + Number(item.price), 0),
            status: 'قيد المراجعة والشحن',
            paymentType: paymentType,
            lat: selectedLat,
            lng: selectedLng,
            assignedVehicle: 'غير محدد',
            assignedDriver: 'غير محدد',
            date: new Date().toLocaleDateString('ar-EG')
        });
        alert(`تم إرسال الطلب وإصدار الفاتورة برقم: #${orderRef.id.slice(0,6)} بنجاح!`);
        cart = [];
        cartModal.style.display = 'none';
        updateCartUI();
    } catch (err) {
        alert('خطأ أثناء إتمام الطلب: ' + err.message);
    }
});

// إدارة المنتجات ونشر الوسائط المرفوعة بنجاح عند التعديل أو الإضافة
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editProductId').value;
    const fileInput = document.getElementById('prodFile');
    
    let mediaUrl = editingOldMediaUrl;
    let mediaType = editingOldMediaType;

    try {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const fileRef = storageRef(storage, `products/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            mediaUrl = await getDownloadURL(fileRef);
            mediaType = file.type.startsWith('video') ? 'video' : 'image';
        }

        const prodData = {
            name: document.getElementById('prodName').value,
            price: document.getElementById('prodPrice').value,
            category: document.getElementById('prodCategory').value,
            mediaUrl: mediaUrl,
            mediaType: mediaType
        };

        if (editId) {
            await updateDoc(doc(db, "products", editId), prodData);
            alert('تم تحديث المنتج بنجاح!');
            document.getElementById('editProductId').value = '';
            editingOldMediaUrl = '';
            document.getElementById('productFormTitle').textContent = 'إضافة منتج أو منشور جديد للمتجر';
            document.getElementById('saveProductBtn').textContent = 'نشر المنتج الآن';
            cancelEditBtn.style.display = 'none';
        } else {
            await addDoc(collection(db, "products"), prodData);
            alert('تم نشر المنتج بنجاح للقاعدة!');
        }
        addProductForm.reset();
        loadProducts();
        loadAdminProductsList();
    } catch (err) {
        alert('خطأ في الرفع: ' + err.message);
    }
});

cancelEditBtn.addEventListener('click', () => {
    addProductForm.reset();
    document.getElementById('editProductId').value = '';
    editingOldMediaUrl = '';
    document.getElementById('productFormTitle').textContent = 'إضافة منتج أو منشور جديد للمتجر';
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
                    <div><strong>${p.name}</strong> - <span style="color:#d4a373">${p.price} ج.م</span></div>
                    <div>
                        <button onclick='editProduct("${id}", ${JSON.stringify(p.name)}, "${p.price}", "${p.category}", "${p.mediaUrl || ''}", "${p.mediaType || 'image'}")' style="background:#2c5e3b; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick='deleteProduct("${id}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في التحميل.';
    }
}

window.editProduct = function(id, name, price, category, mediaUrl, mediaType) {
    document.getElementById('editProductId').value = id;
    editingOldMediaUrl = mediaUrl || '';
    editingOldMediaType = mediaType || 'image';

    document.getElementById('prodName').value = name;
    document.getElementById('prodPrice').value = price;
    document.getElementById('prodCategory').value = category;
    document.getElementById('productFormTitle').textContent = 'تعديل المنتج';
    document.getElementById('saveProductBtn').textContent = 'حفظ التعديلات';
    cancelEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async function(id) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
        try {
            await deleteDoc(doc(db, "products", id));
            alert('تم الحذف بنجاح');
            loadProducts();
            loadAdminProductsList();
        } catch (e) {
            alert('خطأ أثناء الحذف: ' + e.message);
        }
    }
};

addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catId = document.getElementById('catIdInput').value.trim();
    const catName = document.getElementById('catNameInput').value.trim();
    const catIcon = document.getElementById('catIconInput').value.trim();
    try {
        await setDoc(doc(db, "categories", catId), { name: catName, icon: catIcon });
        alert('تم حفظ القسم بنجاح!');
        addCategoryForm.reset();
        loadCategories();
        loadCategoriesForAdmin();
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
});

async function loadCategoriesForAdmin() {
    const list = document.getElementById('adminCategoriesList');
    const snapshot = await getDocs(collection(db, "categories"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const c = docSnap.data();
        list.innerHTML += `<div class="data-item"><i class="${c.icon}"></i> <strong>${c.name}</strong> (${docSnap.id})</div>`;
    });
}

// إضافة إدارة سيارات الأسطول ("سيارتي") وتعيين السائق وتحديد الموقع بـ GPS
if (!document.getElementById('adminFleetTab')) {
    const fleetTabBtn = document.createElement('button');
    fleetTabBtn.onclick = () => switchAdminTab('fleet');
    fleetTabBtn.className = 'tab-btn';
    fleetTabBtn.id = 'tabFleetBtn';
    fleetTabBtn.innerHTML = '<i class="fa-solid fa-car"></i> سيارتي والأسطول';
    document.querySelector('.admin-tabs').appendChild(fleetTabBtn);

    const fleetPanel = document.createElement('div');
    fleetPanel.id = 'adminFleetTab';
    fleetPanel.className = 'admin-panel';
    fleetPanel.style.display = 'none';
    fleetPanel.innerHTML = `
        <div class="form-card" style="margin-bottom: 20px;">
            <h3>إضافة سيارة جديدة للأسطول ("سيارتي") وتعيين السائق الموظف</h3>
            <form id="addVehicleForm">
                <div class="input-group">
                    <label>رقم أو لوحة السيارة</label>
                    <input type="text" id="vehPlate" placeholder="مثال: ر و م 1234" required>
                </div>
                <div class="input-group">
                    <label>نوع السيارة وموديلها</label>
                    <input type="text" id="vehModel" placeholder="مثال: إيسوزو نقل ثقيل" required>
                </div>
                <div class="input-group">
                    <label>السائق / الموظف المسؤول على السيارة</label>
                    <select id="vehDriverSelect" required></select>
                </div>
                <div class="input-group">
                    <label>موقع السيارة الحالي (GPS)</label>
                    <button type="button" id="locateVehicleBtn" class="btn-submit" style="background: var(--accent); margin-bottom: 8px; padding: 8px;">
                        <i class="fa-solid fa-location-crosshairs"></i> جلب موقع السيارة الحالي تلقائياً
                    </button>
                    <p id="vehCoordsDisplay" style="font-size: 0.85rem; color: #666;">الإحداثيات الحالية: لم يتم التحديد (افتراضي القاهرة)</p>
                </div>
                <button type="submit" class="btn-submit">تسجيل السيارة بالأسطول</button>
            </form>
        </div>
        <h3>قائمة سيارات الأسطول الحالية</h3>
        <div id="adminVehiclesList" class="data-list"></div>
    `;
    document.querySelector('#adminSection').appendChild(fleetPanel);
}

// حدث زر جلب إحداثيات سيارة الأسطول عبر GPS
document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'locateVehicleBtn' || e.target.closest('#locateVehicleBtn'))) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                newVehLat = position.coords.latitude;
                newVehLng = position.coords.longitude;
                const display = document.getElementById('vehCoordsDisplay');
                if (display) {
                    display.textContent = `تم بنجاح تحديد الإحداثيات: (${newVehLat.toFixed(4)}, ${newVehLng.toFixed(4)})`;
                    display.style.color = "green";
                }
                alert('تم تحديد موقع السيارة الحالي بنجاح!');
            }, () => {
                alert('فشل تحديد الموقع، تأكد من تفعيل الـ GPS وصلاحيات المتصفح.');
            });
        } else {
            alert('خاصية تحديد الموقع غير مدعومة في متصفحك.');
        }
    }
});

// حدث إرسال نموذج إضافة السيارة للأسطول
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'addVehicleForm') {
        e.preventDefault();
        const plate = document.getElementById('vehPlate').value;
        const model = document.getElementById('vehModel').value;
        const driver = document.getElementById('vehDriverSelect').value;
        try {
            await addDoc(collection(db, "vehicles"), { 
                plate, 
                model, 
                driver, 
                lat: newVehLat, 
                lng: newVehLng 
            });
            alert('تم تسجيل السيارة بالأسطول ("سيارتي") بنجاح وتحديد موقعها على الخريطة!');
            e.target.reset();
            newVehLat = 30.0444;
            newVehLng = 31.2357;
            const display = document.getElementById('vehCoordsDisplay');
            if (display) {
                display.textContent = 'الإحداثيات الحالية: لم يتم التحديد (افتراضي القاهرة)';
                display.style.color = "#666";
            }
            loadVehiclesList();
        } catch (err) {
            alert('خطأ: ' + err.message);
        }
    }
});

async function loadVehiclesList() {
    const list = document.getElementById('adminVehiclesList');
    if (!list) return;
    const snapshot = await getDocs(collection(db, "vehicles"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const v = docSnap.data();
        list.innerHTML += `<div class="data-item">سيارة: <strong>${v.plate}</strong> (${v.model}) | السائق الموظف المسؤول: <span style="color:var(--primary); font-weight:bold;">${v.driver}</span></div>`;
    });
}

async function loadDriversDropdown() {
    const select = document.getElementById('vehDriverSelect');
    if (!select) return;
    const snapshot = await getDocs(collection(db, "users"));
    select.innerHTML = '<option value="">اختر السائق الموظف</option>';
    snapshot.forEach(docSnap => {
        const u = docSnap.data();
        if (['driver', 'employee', 'admin', 'assistant_manager'].includes(u.col)) {
            select.innerHTML += `<option value="${u.email}">${u.name || u.email} (${u.col})</option>`;
        }
    });
}

async function loadAllOrders() {
    const list = document.getElementById('adminOrdersList');
    const snapshot = await getDocs(collection(db, "orders"));
    const vehiclesSnap = await getDocs(collection(db, "vehicles"));
    let vehicleOptions = '<option value="">اختر السيارة للأسطول</option>';
    vehiclesSnap.forEach(v => {
        vehicleOptions += `<option value="${v.data().plate}">${v.data().plate} (سائق: ${v.data().driver})</option>`;
    });

    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const o = docSnap.data();
        const id = docSnap.id;
        list.innerHTML += `
            <div class="data-item">
                طلب #${id.slice(0,6)} | العميل: ${o.userEmail} | الإجمالي: <strong>${o.total} ج.م</strong> (${o.paymentType})<br>
                الحالة: <span style="color:#2c5e3b">${o.status}</span> | السيارة المعينة: <strong>${o.assignedVehicle || 'غير محدد'}</strong>
                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <select id="assignVeh_${id}" style="padding:5px; border-radius:5px; border:1px solid #ccc;">${vehicleOptions}</select>
                    <button onclick='assignVehicleToOrder("${id}")' style="background:#1e3d2f; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تعيين السيارة للشحنة</button>
                    <button onclick='updateOrderStatus("${id}", "تم التسليم بنجاح")' style="background:green; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تم التسليم</button>
                </div>
            </div>`;
    });
}

window.assignVehicleToOrder = async function(orderId) {
    const veh = document.getElementById(`assignVeh_${orderId}`).value;
    if (!veh) {
        alert('الرجاء اختيار السيارة أولاً');
        return;
    }
    try {
        await updateDoc(doc(db, "orders", orderId), { assignedVehicle: veh, status: `جاري التوصيل عبر سيارة الأسطول (${veh})` });
        alert('تم تعيين السيارة والشحنة بنجاح!');
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

// التحكم الشامل برتب وصلاحيات العملاء (الرتب الستة الكاملة)
async function loadAllUsers() {
    const list = document.getElementById('adminUsersList');
    const snapshot = await getDocs(collection(db, "users"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const u = docSnap.data();
        const email = docSnap.id;
        list.innerHTML += `
            <div class="data-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>الاسم: ${u.name || 'مستخدم'} | البريد: ${email} | الرتبة الحالية: <strong style="color:var(--accent);">${u.col || 'customer'}</strong></div>
                <div>
                    <select id="roleSelect_${email.replace(/[@.]/g, '_')}" style="padding:6px; border-radius:6px; border:1px solid #ccc;">
                        <option value="admin">مدير</option>
                        <option value="assistant_manager">مساعد مدير</option>
                        <option value="accountant">محاسب</option>
                        <option value="employee">موظف</option>
                        <option value="driver">سائق</option>
                        <option value="customer">عميل</option>
                    </select>
                    <button onclick='changeUserRole("${email}")' style="background:#2c5e3b; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-right:5px;">تحديث الرتبة</button>
                </div>
            </div>`;
    });
}

window.changeUserRole = async function(email) {
    const selectId = `roleSelect_${email.replace(/[@.]/g, '_')}`;
    const newRole = document.getElementById(selectId).value;
    try {
        await updateDoc(doc(db, "users", email), { col: newRole });
        alert('تم تحديث رتبة وصلاحية المستخدم بنجاح!');
        loadAllUsers();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
};

sendNotificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notifTitle').value;
    const body = document.getElementById('notifBody').value;
    try {
        await addDoc(collection(db, "notifications"), { title, body, date: new Date().toLocaleString('ar-EG'), read: false });
        alert('تم إرسال الإشعار بنجاح!');
        sendNotificationForm.reset();
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
});

async function checkUnreadNotifications() {
    try {
        const snapshot = await getDocs(collection(db, "notifications"));
        let count = 0;
        snapshot.forEach(docSnap => { if (!docSnap.data().read) count++; });
        document.getElementById('notifCount').textContent = count;
    } catch (e) { console.error(e); }
}

async function loadNotifications() {
    const list = document.getElementById('notificationsListContent');
    const snapshot = await getDocs(collection(db, "notifications"));
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
        const n = docSnap.data();
        list.innerHTML += `<div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:8px; border-right:4px solid var(--accent);"><h4>${n.title}</h4><p>${n.body}</p></div>`;
    });
}

async function loadUserProfile() {
    if (!currentUser) return;
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    document.getElementById('userRoleDisplay').textContent = currentUserRole;

    const q = query(collection(db, "orders"), where("userEmail", "==", currentUser.email));
    const querySnapshot = await getDocs(q);
    let invoicesHtml = '';
    
    querySnapshot.forEach((docSnap) => {
        const orderId = docSnap.id;
        const order = docSnap.data();
        invoicesHtml += `
            <div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid #1e3d2f;">
                رقم الفاتورة: <strong>#${orderId.slice(0,6)}</strong> | الإجمالي: <strong>${order.total} ج.م</strong><br>
                الحالة: <span style="color:green">${order.status}</span> | سيارة التوصيل الخاصة بك: <strong>${order.assignedVehicle || 'قريباً'}</strong><br>
                <button onclick='previewInvoice("${orderId}", ${JSON.stringify(order)})' style="background:#1e3d2f; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-top:5px;"><i class="fa-solid fa-eye"></i> معاينة الفاتورة</button>
            </div>`;
    });
    document.getElementById('userInvoicesList').innerHTML = invoicesHtml || '<p>لا توجد فواتير سابقة</p>';
}

trackInvoiceBtn.addEventListener('click', async () => {
    const invId = document.getElementById('trackInvoiceInput').value.trim();
    const resultBox = document.getElementById('trackResultBox');
    if (!invId) return;
    resultBox.innerHTML = 'جاري البحث...';
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        let found = null;
        snapshot.forEach(docSnap => {
            if (docSnap.id.includes(invId)) found = { id: docSnap.id, ...docSnap.data() };
        });

        if (found) {
            resultBox.innerHTML = `
                <div style="background:#eef5f1; padding:12px; border-radius:8px; border:1px solid #2c5e3b;">
                    <p><strong>رقم الفاتورة:</strong> #${found.id}</p>
                    <p><strong>حالة الشحنة:</strong> <span style="color:green; font-weight:bold;">${found.status}</span></p>
                    <p><strong>سيارة الأسطول المخصصة لتتبع شحنتك:</strong> ${found.assignedVehicle || 'قيد التحديد'}</p>
                    <p><strong>الإجمالي:</strong> ${found.total} ج.م</p>
                </div>`;
        } else {
            resultBox.innerHTML = '<p style="color:red;">لم يتم العثور على شحنة بهذا الرقم.</p>';
        }
    } catch (err) {
        resultBox.innerHTML = '<p style="color:red;">حدث خطأ.</p>';
    }
});

let currentOrderToPrint = null;
window.previewInvoice = function(orderId, order) {
    currentOrderToPrint = { orderId, order };
    const content = document.getElementById('printableInvoiceContent');
    let itemsHtml = '';
    if (order.items) {
        order.items.forEach(item => {
            itemsHtml += `<tr><td style="padding:8px; border:1px solid #ddd;">${item.name}</td><td style="padding:8px; border:1px solid #ddd;">1</td><td style="padding:8px; border:1px solid #ddd;">${item.price} ج.م</td></tr>`;
        });
    }

    content.innerHTML = `
        <div id="invoiceCanvasArea" style="background:#fff; padding:15px;">
            <h2 style="color:#1e3d2f; text-align:center;">منصة العمدة للأعلاف والحبوب</h2>
            <p style="text-align:center; color:#666;">فاتورة مبيعات رسمية</p>
            <hr style="margin:10px 0;">
            <p><strong>رقم الفاتورة:</strong> #${orderId}</p>
            <p><strong>العميل:</strong> ${order.userEmail}</p>
            <table style="width:100%; border-collapse:collapse; margin:15px 0;">
                <tr style="background:#1e3d2f; color:#fff;"><th style="padding:8px; border:1px solid #ddd;">المنتج</th><th style="padding:8px; border:1px solid #ddd;">الكمية</th><th style="padding:8px; border:1px solid #ddd;">السعر</th></tr>
                ${itemsHtml}
            </table>
            <h3>الإجمالي النهائي: ${order.total} ج.م</h3>
        </div>`;
    invoiceModal.style.display = 'flex';
};

saveInvoiceImgBtn.addEventListener('click', () => {
    html2canvas(document.getElementById('invoiceCanvasArea'), { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Invoice_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

function initUserMap() {
    if (userMap) { userMap.invalidateSize(); return; }
    userMap = L.map('userMap').setView([30.0444, 31.2357], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(userMap);
    userMarker = L.marker([30.0444, 31.2357], { draggable: true }).addTo(userMap);
    userMarker.on('dragend', () => {
        selectedLat = userMarker.getLatLng().lat;
        selectedLng = userMarker.getLatLng().lng;
    });
}

locateMeBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            selectedLat = position.coords.latitude;
            selectedLng = position.coords.longitude;
            userMap.setView([selectedLat, selectedLng], 15);
            userMarker.setLatLng([selectedLat, selectedLng]);
            alert('تم تحديد موقعك بنجاح!');
        });
    }
});

saveLocationBtn.addEventListener('click', () => alert('تم حفظ موقع التوصيل بنجاح!'));

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
    } else if (tabName === 'fleet') {
        document.getElementById('adminFleetTab').style.display = 'block';
        document.getElementById('tabFleetBtn').classList.add('active');
        loadDriversDropdown();
        loadVehiclesList();
    } else if (tabName === 'map') {
        document.getElementById('adminMapTab').style.display = 'block';
        document.getElementById('tabMapBtn').classList.add('active');
        setTimeout(() => { initAdminMap(); }, 300);
    } else if (tabName === 'messaging') {
        document.getElementById('adminMessagingTab').style.display = 'block';
        document.getElementById('tabMsgBtn').classList.add('active');
    } else if (tabName === 'users') {
        document.getElementById('adminUsersTab').style.display = 'block';
        document.getElementById('tabUserBtn').classList.add('active');
        loadAllUsers();
    }
}

async function initAdminMap() {
    if (adminMap) { adminMap.invalidateSize(); return; }
    adminMap = L.map('adminMap').setView([30.0444, 31.2357], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(adminMap);

    const snapshot = await getDocs(collection(db, "vehicles"));
    snapshot.forEach(docSnap => {
        const v = docSnap.data();
        if (v.lat && v.lng) {
            L.marker([v.lat, v.lng]).addTo(adminMap)
                .bindPopup(`<b>سيارة أسطول ("سيارتي"):</b> ${v.plate}<br><b>السائق الموظف:</b> ${v.driver}`);
        }
    });
}

loadProducts();
