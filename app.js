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
let cart = [];
let allProductsCache = [];
let allCategoriesCache = [];
let userMap = null;
let adminMap = null;
let userMarker = null;
let selectedLat = 30.0444; 
let selectedLng = 31.2357;
let carouselInterval = null;

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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج';
        authModal.style.display = 'none';
        profileBtn.style.display = 'flex';
        checkUnreadNotifications();
        
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

// تحميل الأقسام (تلقائياً من فايربيس مع الدعم الافتراضي)
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
            // حفظها أوتوماتيكياً في فايربيس لأول مرة
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
    productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">جاري تحميل المنتجات والمنشورات...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProductsCache = [];
        querySnapshot.forEach((docSnap) => {
            allProductsCache.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        if (allProductsCache.length === 0) {
            allProductsCache = [
                { id: '1', name: 'علاف تسمين عالي البروتين (50 كجم)', price: '250', category: 'concentrates', mediaUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=500&q=80', mediaType: 'image' },
                { id: '2', name: 'ذرة صفراء مستوردة صافية (50 كجم)', price: '180', category: 'grains', mediaUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=500&q=80', mediaType: 'image' }
            ];
        }
        renderProducts('all', '');
        startProductCarousel();
    } catch (e) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">حدث خطأ أثناء تحميل المنتجات.</p>';
    }
}

// الإطار الديناميكي المتغير للمنتجات كل ثانية
function startProductCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (allProductsCache.length === 0) return;
    let index = 0;
    const textEl = document.getElementById('carouselProductText');
    carouselInterval = setInterval(() => {
        if (!textEl) return;
        const prod = allProductsCache[index];
        textEl.innerHTML = `<strong>${prod.name}</strong> - <span style="color:var(--primary); font-weight:bold;">${prod.price} ج.م</span>`;
        index = (index + 1) % allProductsCache.length;
    }, 1000);
}

function renderProducts(category, searchTerm) {
    productsGrid.innerHTML = '';
    const filtered = allProductsCache.filter(prod => {
        const matchesCat = (category === 'all' || prod.category === category);
        const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">لا توجد منتجات أو منشورات مطابقة.</p>';
        return;
    }

    filtered.forEach(prod => {
        let mediaHtml = `<img src="${prod.mediaUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=500&q=80'}" alt="${prod.name}">`;
        if (prod.mediaType === 'video') {
            mediaHtml = `<video src="${prod.mediaUrl}" controls style="width:100%; height:180px; object-fit:cover;"></video>`;
        }

        productsGrid.innerHTML += `
            <div class="product-card">
                ${mediaHtml}
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
    const paymentType = document.getElementById('paymentTypeSelect').value;
    try {
        const orderRef = await addDoc(collection(db, "orders"), {
            userEmail: currentUser.email,
            items: cart,
            total: cart.reduce((sum, item) => sum + Number(item.price), 0),
            status: 'قيد المراجعة والشحن (أسطول العمدة)',
            paymentType: paymentType,
            lat: selectedLat,
            lng: selectedLng,
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

// إدارة المنتجات والوسائط
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editProductId').value;
    const fileInput = document.getElementById('prodFile');
    
    let mediaUrl = document.getElementById('editProductId').dataset.oldUrl || '';
    let mediaType = document.getElementById('editProductId').dataset.oldType || 'image';

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
            alert('تم تحديث المنتج/المنشور بنجاح!');
            document.getElementById('editProductId').value = '';
            document.getElementById('productFormTitle').textContent = 'إضافة منتج أو منشور جديد للمتجر';
            document.getElementById('saveProductBtn').textContent = 'نشر المنتج الآن';
            cancelEditBtn.style.display = 'none';
        } else {
            await addDoc(collection(db, "products"), prodData);
            alert('تم إضافة ونشر المنتج بنجاح للقاعدة!');
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
                    <div>
                        <strong>${p.name}</strong> - <span style="color:#d4a373">${p.price} ج.م</span> (${p.category})
                    </div>
                    <div>
                        <button onclick='editProduct("${id}", ${JSON.stringify(p.name)}, "${p.price}", "${p.category}", "${p.mediaUrl || ''}", "${p.mediaType || 'image'}")' style="background:#2c5e3b; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-left:5px;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick='deleteProduct("${id}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في التحميل.';
    }
}

window.editProduct = function(id, name, price, category, mediaUrl, mediaType) {
    document.getElementById('editProductId').value = id;
    document.getElementById('editProductId').dataset.oldUrl = mediaUrl;
    document.getElementById('editProductId').dataset.oldType = mediaType;
    document.getElementById('prodName').value = name;
    document.getElementById('prodPrice').value = price;
    document.getElementById('prodCategory').value = category;
    document.getElementById('productFormTitle').textContent = 'تعديل المنشور أو المنتج';
    document.getElementById('saveProductBtn').textContent = 'حفظ التعديلات';
    cancelEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج أو المنشور نهائياً؟')) {
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

// إدارة الأقسام للآدمين (إضافة، تعديل، حذف) مع التحديث التلقائي في فايربيس
addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editCatId = document.getElementById('editCatId').value;
    const catId = document.getElementById('catIdInput').value.trim();
    const catName = document.getElementById('catNameInput').value.trim();
    const catIcon = document.getElementById('catIconInput').value.trim();

    try {
        if (editCatId) {
            // إذا كان تعديل، قد يتطلب تحديث الـ doc أو حذفه وإنشاء جديد إذا تغير الـ ID
            if (editCatId !== catId) {
                await deleteDoc(doc(db, "categories", editCatId));
            }
            await setDoc(doc(db, "categories", catId), { name: catName, icon: catIcon });
            alert('تم تحديث القسم بنجاح!');
            document.getElementById('editCatId').value = '';
            document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد وتوجيه المنصة';
            document.getElementById('saveCatBtn').textContent = 'حفظ القسم الجديد';
            cancelCatEditBtn.style.display = 'none';
        } else {
            await setDoc(doc(db, "categories", catId), { name: catName, icon: catIcon });
            alert('تم إضافة القسم وتحديث التوجيه في فايربيس تلقائياً!');
        }
        addCategoryForm.reset();
        loadCategories();
        loadCategoriesForAdmin();
    } catch (err) {
        alert('خطأ في حفظ القسم: ' + err.message);
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
                    <div>
                        <button onclick='editCategory("${id}", ${JSON.stringify(c.name)}, "${c.icon}")' style="background:#2c5e3b; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-left:5px;"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button onclick='deleteCategory("${id}")' style="background:#e63946; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = 'خطأ في التحميل.';
    }
}

window.editCategory = function(id, name, icon) {
    document.getElementById('editCatId').value = id;
    document.getElementById('catIdInput').value = id;
    document.getElementById('catIdInput').disabled = true; // منع تغيير المعرف الرئيسي لتجنب الأخطاء
    document.getElementById('catNameInput').value = name;
    document.getElementById('catIconInput').value = icon;
    document.getElementById('categoryFormTitle').textContent = 'تعديل القسم';
    document.getElementById('saveCatBtn').textContent = 'حفظ التعديلات';
    cancelCatEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelCatEditBtn.addEventListener('click', () => {
    addCategoryForm.reset();
    document.getElementById('editCatId').value = '';
    document.getElementById('catIdInput').disabled = false;
    document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد وتوجيه المنصة';
    document.getElementById('saveCatBtn').textContent = 'حفظ القسم الجديد';
    cancelCatEditBtn.style.display = 'none';
});

window.deleteCategory = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذا القسم نهائياً؟')) {
        try {
            await deleteDoc(doc(db, "categories", id));
            alert('تم حذف القسم بنجاح من فايربيس');
            loadCategories();
            loadCategoriesForAdmin();
        } catch (e) {
            alert('خطأ أثناء الحذف: ' + e.message);
        }
    }
};

// نظام إرسال الإشعارات والرسائل الفورية
sendNotificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notifTitle').value;
    const body = document.getElementById('notifBody').value;
    try {
        await addDoc(collection(db, "notifications"), {
            title: title,
            body: body,
            date: new Date().toLocaleString('ar-EG'),
            read: false
        });
        alert('تم إرسال الإشعار بنجاح لجميع المستخدمين!');
        sendNotificationForm.reset();
    } catch (err) {
        alert('خطأ في الإرسال: ' + err.message);
    }
});

async function checkUnreadNotifications() {
    try {
        const snapshot = await getDocs(collection(db, "notifications"));
        let count = 0;
        snapshot.forEach(docSnap => {
            if (!docSnap.data().read) count++;
        });
        document.getElementById('notifCount').textContent = count;
    } catch (e) { console.error(e); }
}

async function loadNotifications() {
    const list = document.getElementById('notificationsListContent');
    list.innerHTML = 'جاري التحميل...';
    try {
        const snapshot = await getDocs(collection(db, "notifications"));
        list.innerHTML = '';
        snapshot.forEach(docSnap => {
            const n = docSnap.data();
            list.innerHTML += `
                <div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:8px; border-right:4px solid var(--accent);">
                    <h4 style="color:var(--primary); margin-bottom:4px;">${n.title}</h4>
                    <p style="font-size:0.9rem; color:#444; margin-bottom:5px;">${n.body}</p>
                    <span style="font-size:0.75rem; color:#888;">${n.date}</span>
                </div>`;
        });
        if (list.innerHTML === '') {
            list.innerHTML = '<p>لا توجد إشعارات جديدة.</p>';
        }
        document.getElementById('notifCount').textContent = '0';
    } catch (e) {
        list.innerHTML = 'خطأ في جلب الإشعارات.';
    }
}

// بروفايل العميل والفواتير
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
        const orderId = docSnap.id;
        const order = docSnap.data();
        invoicesHtml += `
            <div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid #1e3d2f;">
                رقم الفاتورة: <strong>#${orderId.slice(0,6)}</strong> | الإجمالي: <strong>${order.total} ج.م</strong><br>
                نوع الدفع: <span style="color:#d4a373; font-weight:bold;">${order.paymentType || 'مدفوع'}</span> | الحالة: <span style="color:green">${order.status}</span><br>
                <div style="margin-top:8px;">
                    <button onclick='previewInvoice("${orderId}", ${JSON.stringify(order)})' style="background:#1e3d2f; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-eye"></i> معاينة وطباعة الفاتورة (A3)</button>
                </div>
            </div>`;
    });
    
    document.getElementById('userInvoicesList').innerHTML = invoicesHtml || '<p>لا توجد فواتير أو معاملات سابقة</p>';
}

// تتبع الشحنة برقم الفاتورة
trackInvoiceBtn.addEventListener('click', async () => {
    const invId = document.getElementById('trackInvoiceInput').value.trim();
    const resultBox = document.getElementById('trackResultBox');
    if (!invId) {
        alert('الرجاء إدخال رقم الفاتورة أو الطلب');
        return;
    }
    resultBox.innerHTML = 'جاري البحث عن الشحنة...';
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        let found = null;
        querySnapshot.forEach(docSnap => {
            if (docSnap.id.includes(invId)) {
                found = { id: docSnap.id, ...docSnap.data() };
            }
        });

        if (found) {
            resultBox.innerHTML = `
                <div style="background:#eef5f1; padding:12px; border-radius:8px; border:1px solid #2c5e3b;">
                    <p><strong>رقم الفاتورة:</strong> #${found.id}</p>
                    <p><strong>حالة الشحنة والأسطول:</strong> <span style="color:green; font-weight:bold;">${found.status}</span></p>
                    <p><strong>المبلغ الإجمالي:</strong> ${found.total} ج.م</p>
                    <p><strong>تاريخ الطلب:</strong> ${found.date}</p>
                </div>`;
        } else {
            resultBox.innerHTML = '<p style="color:red;">لم يتم العثور على شحنة بهذا الرقم.</p>';
        }
    } catch (err) {
        resultBox.innerHTML = '<p style="color:red;">حدث خطأ أثناء البحث.</p>';
    }
});

// معاينة الفاتورة وحفظها كصورة (PNG)
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
            <div style="text-align:center; margin-bottom:20px;">
                <h2 style="color:#1e3d2f; margin-bottom:5px;">منصة العمدة للأعلاف والحبوب</h2>
                <p style="font-size:0.9rem; color:#666;">فاتورة مبيعات ومعاملات رسمية</p>
                <hr style="border:1px solid #ddd; margin-top:10px;">
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-size:0.9rem;">
                <div><strong>رقم الفاتورة:</strong> #${orderId}</div>
                <div><strong>التاريخ:</strong> ${order.date || '---'}</div>
            </div>
            <div style="margin-bottom:15px; font-size:0.9rem;">
                <strong>العميل:</strong> ${order.userEmail}<br>
                <strong>طريقة الدفع:</strong> ${order.paymentType || 'مدفوع'}
            </div>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:0.9rem;">
                <thead>
                    <tr style="background:#1e3d2f; color:#fff;">
                        <th style="padding:8px; border:1px solid #ddd; text-align:right;">اسم المنتج</th>
                        <th style="padding:8px; border:1px solid #ddd; text-align:right;">الكمية</th>
                        <th style="padding:8px; border:1px solid #ddd; text-align:right;">السعر الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div style="text-align:left; font-size:1.1rem; font-weight:bold;">
                المجموع النهائي: <span style="color:#1e3d2f;">${order.total} ج.م</span>
            </div>
            <div style="margin-top:30px; text-align:center; font-size:0.85rem; color:#777;">
                شكراً لتعاملكم مع منصة العمدة - جميع الحقوق محفوظة
            </div>
        </div>
    `;
    invoiceModal.style.display = 'flex';
};

// زر حفظ الفاتورة كصورة
saveInvoiceImgBtn.addEventListener('click', () => {
    const invoiceElement = document.getElementById('invoiceCanvasArea');
    html2canvas(invoiceElement, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Invoice_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

// خريطة العميل مع زر التحديد التلقائي للموقع (GPS)
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

locateMeBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            selectedLat = lat;
            selectedLng = lng;
            userMap.setView([lat, lng], 15);
            userMarker.setLatLng([lat, lng]);
            alert('تم تحديد موقعك الحالي بنجاح!');
        }, () => {
            alert('تعذر الوصول إلى موقعك، تأكد من تفعيل خدمة الرفع الجغرافي (GPS).');
        });
    } else {
        alert('متصفحك لا يدعم تحديد الموقع الجغرافي.');
    }
});

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
    } else if (tabName === 'messaging') {
        document.getElementById('adminMessagingTab').style.display = 'block';
        document.getElementById('tabMsgBtn').classList.add('active');
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
                طلب #${id.slice(0,6)} | العميل: ${o.userEmail} | الإجمالي: <strong>${o.total} ج.م</strong> (${o.paymentType || 'مدفوع'})<br>
                الحالة والأسطول: <span style="color:#2c5e3b">${o.status}</span>
                <div style="margin-top:8px;">
                    <button onclick='updateOrderStatus("${id}", "جاري التوصيل عبر أسطول سيارات العمدة")' style="background:#1e3d2f; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">تعيين لسيارات الأسطول</button>
                    <button onclick='updateOrderStatus("${id}", "تم التسليم بنجاح")' style="background:green; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;">تم التسليم</button>
                </div>
            </div>`;
    });
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        alert('تم تحديث حالة الشحنة والأسطول بنجاح');
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

// خريطة المدير لمتابعة سيارات الأسطول وشحنات العملاء
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
                .bindPopup(`<b>عميل / أسطول:</b> ${order.userEmail}<br><b>المبلغ:</b> ${order.total} ج.م<br><b>الحالة:</b> ${order.status}`);
        }
    });
}

loadProducts();
