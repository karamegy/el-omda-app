/**
 * ============================================================================
 * ملف نواة المدفوعات والتحويلات الإلكترونية - منصة العمدة / مؤسسة الإخلاص
 * File: omda-payments-core.js
 * المميزات المدمجة:
 * 1. الدفع عبر إنستا باي (InstaPay) والمحافظ الإلكترونية (كاش) عند إتمام الطلب.
 * 2. رفع صورة إشعار التحويل (Cloudinary) + رقم مرجع العملية مع ضغط تلقائي سريع.
 * 3. إمكانية سداد دفعات الآجل أونلاين من صفحة حساب العميل.
 * 4. لوحة إدارة لإعداد حسابات التحويل ومراجعة الإيصالات واعتمادها أو رفضها.
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc,
    updateDoc, query, where, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// مشاركة نفس إعدادات Firebase و Cloudinary من app.js
const firebaseConfig = {
    apiKey: "AIzaSyCU--Klxwfg7pDinUgS0UEde9cpmmsrDRM",
    authDomain: "omda-a750f.firebaseapp.com",
    projectId: "omda-a750f",
    storageBucket: "omda-a750f.firebasestorage.app",
    messagingSenderId: "1078714497381",
    appId: "1:1078714497381:android:9430672b84226b0a46898c"
};

const CLOUDINARY_CLOUD_NAME = "s5gtopg0";
const CLOUDINARY_UPLOAD_PRESET = "omda_media";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 1. الحالة العامة وأدوات الحماية والترجمة
// ==========================================
let payUser = null;
let payUserRole = 'customer';
let transfersCache = [];
let pendingTransfersCount = 0;

let paymentAccountsConfig = {
    beneficiaryName: "مؤسسة الإخلاص للأعلاف الطبيعية والحبوب",
    instapayIpa: "karamhamdy12@instapay",
    instapayLink: "",
    walletNumbers: "01114099799",
    walletProviders: "فودافون كاش / اتصالات كاش / WE Pay",
    transferNotes: "يرجى كتابة رقم الهاتف أو اسم العميل في ملاحظات التحويل وإرفاق صورة الإشعار."
};

function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeImgUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

function isEn() {
    return (document.documentElement.lang || localStorage.getItem('omda_lang') || 'ar') === 'en';
}

function tr(ar, en) {
    return isEn() ? en : ar;
}

function isStaff(role) {
    return ["admin", "assistant_manager", "accountant", "employee"].includes(role);
}

function getCartItems() {
    try {
        const raw = JSON.parse(localStorage.getItem('omda_cart') || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch (_) {
        return [];
    }
}

// ==========================================
// 2. حقن تنسيقات نواة المدفوعات وتثبيت زر الشراء داخل السلة
// ==========================================
function injectPaymentCoreStyles() {
    if (document.getElementById('omda-payments-core-styles')) return;
    const style = document.createElement('style');
    style.id = 'omda-payments-core-styles';
    style.textContent = `
        /* ضبط تخطيط نافذة السلة لمنع اختفاء زر الشراء عند فتح بيانات التحويل */
        #cartModal .cart-modal-container {
            max-height: 92vh !important;
            max-height: 92dvh !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
        }
        #cartModal .modal-header {
            flex-shrink: 0 !important;
        }
        #cartModal .cart-modal-body {
            flex: 0 1 auto !important;
            max-height: 30vh !important;
            min-height: 76px;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            padding: 12px 14px !important;
            transition: max-height 0.22s ease;
        }
        #cartModal .cart-modal-container.has-transfer-open .cart-modal-body {
            max-height: 17vh !important;
            min-height: 70px;
            padding: 8px 14px !important;
        }
        #cartModal .cart-modal-footer {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
            overflow: hidden !important;
            padding: 12px 14px !important;
            background: #ffffff;
        }
        #cartModal .cart-summary-card {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            margin-bottom: 10px !important;
            padding: 11px 12px !important;
        }
        #cartModal #checkoutBtn {
            flex-shrink: 0 !important;
            width: 100% !important;
            margin-top: auto !important;
            position: relative;
            z-index: 5;
        }
        #addonCouponInput {
            font-size: 0.85rem !important;
            min-width: 0;
        }
        .pay-transfer-box {
            background: linear-gradient(135deg, #f0f7f4 0%, #ffffff 100%);
            border: 1.5px solid #173627;
            border-radius: 12px;
            padding: 12px;
            margin-top: 10px;
            box-shadow: 0 4px 12px rgba(23, 54, 39, 0.08);
        }
        .pay-transfer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }
        .pay-account-pill {
            background: #173627;
            color: #ffffff;
            padding: 9px 11px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
            flex-wrap: wrap;
        }
        .pay-account-value {
            font-family: monospace, sans-serif;
            font-size: 0.98rem;
            font-weight: 800;
            color: #d4af37;
            direction: ltr;
            word-break: break-all;
        }
        .pay-copy-btn {
            background: #d4af37;
            color: #10271c;
            border: none;
            padding: 6px 12px;
            border-radius: 7px;
            font-weight: 800;
            font-size: 0.8rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .pay-copy-btn:active { transform: scale(0.97); }
        .pay-upload-label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px;
            border: 1.5px dashed #173627;
            border-radius: 9px;
            background: #f8faf9;
            color: #173627;
            font-weight: 700;
            font-size: 0.84rem;
            cursor: pointer;
            margin-top: 6px;
            text-align: center;
        }
        .pay-upload-label:hover { background: #ecfdf5; }
        .pay-receipt-preview {
            max-width: 100%;
            max-height: 130px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            margin-top: 8px;
            display: none;
            object-fit: contain;
        }
        .pay-admin-panel-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-top: 4px solid #d4af37;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 18px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.04);
        }
        .pay-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.76rem;
            font-weight: 800;
        }
        .pay-status-pending { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
        .pay-status-approved { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .pay-status-rejected { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .pay-lightbox-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10050;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 3. ضغط ورفع صورة الإيصال إلى Cloudinary
// ==========================================
function compressReceiptImage(file) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/') || file.size <= 900 * 1024) {
            resolve(file);
            return;
        }
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const maxDim = 1280;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                } else {
                    resolve(file);
                }
            }, 'image/jpeg', 0.82);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file);
        };
        img.src = url;
    });
}

async function uploadReceiptToCloudinary(file, onProgress) {
    if (!file) return '';
    if (!file.type.startsWith('image/')) {
        throw new Error(tr('يرجى اختيار صورة صالحة لإشعار التحويل (JPG / PNG / WEBP).', 'Please select a valid receipt image.'));
    }
    const processedFile = await compressReceiptImage(file);
    return new Promise((resolve, reject) => {
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        const formData = new FormData();
        formData.append("file", processedFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable && typeof onProgress === 'function') {
                onProgress(Math.round((ev.loaded / ev.total) * 100));
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const resp = JSON.parse(xhr.responseText);
                    resolve(resp.secure_url || '');
                } catch (_) {
                    reject(new Error(tr('تعذر قراءة رابط الصورة المرفوعة.', 'Failed to parse uploaded image response.')));
                }
            } else {
                reject(new Error(tr('فشل رفع صورة الإيصال، تأكد من اتصال الإنترنت.', 'Receipt upload failed.')));
            }
        };
        xhr.onerror = () => reject(new Error(tr('تعذر الاتصال بخادم رفع الصور.', 'Network error while uploading receipt.')));
        xhr.send(formData);
    });
}

function copyTextWithFeedback(text, btn) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
    if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> ${tr('تم النسخ!', 'Copied!')}`;
        setTimeout(() => { btn.innerHTML = orig; }, 1800);
    }
}

// ==========================================
// 4. تحميل إعدادات حسابات الاستقبال (InstaPay & Cash)
// ==========================================
async function loadPaymentAccountsConfig() {
    try {
        const snap = await getDoc(doc(db, "app_settings", "payments_config"));
        if (snap.exists()) {
            const data = snap.data();
            if (!data.instapayIpa || data.instapayIpa === "alekhlas.feed@instapay") {
                data.instapayIpa = "karamhamdy12@instapay";
            }
            paymentAccountsConfig = { ...paymentAccountsConfig, ...data };
        }
    } catch (_) {}
}

function buildTransferDetailsMarkup(methodType, amountText, prefixId) {
    const isInsta = methodType === 'instapay';
    const title = isInsta
        ? tr('بيانات التحويل اللحظي عبر إنستا باي (InstaPay)', 'InstaPay Instant Transfer Details')
        : tr('بيانات التحويل عبر المحفظة الإلكترونية (كاش)', 'Mobile Cash Wallet Transfer Details');
    const badgeColor = isInsta ? '#6d28d9' : '#dc2626';
    const iconClass = isInsta ? 'fa-bolt' : 'fa-mobile-screen-button';
    const accountTarget = isInsta ? paymentAccountsConfig.instapayIpa : paymentAccountsConfig.walletNumbers;
    const subLabel = isInsta
        ? tr('عنوان الدفع اللحظي (IPA):', 'Instant Payment Address (IPA):')
        : esc(paymentAccountsConfig.walletProviders);

    const openLinkBtn = (isInsta && paymentAccountsConfig.instapayLink)
        ? `<a href="${esc(paymentAccountsConfig.instapayLink)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; background:#6d28d9; color:#fff; padding:6px 12px; border-radius:7px; text-decoration:none; font-size:0.8rem; font-weight:800;">
             <i class="fa-solid fa-arrow-up-right-from-square"></i> ${tr('فتح رابط إنستا باي', 'Open InstaPay Link')}
           </a>`
        : '';

    return `
        <div class="pay-transfer-header">
            <strong style="color:#173627; font-size:0.88rem;">
                <i class="fa-solid ${iconClass}" style="color:${badgeColor};"></i> ${title}
            </strong>
            <span style="background:${badgeColor}; color:#fff; padding:2px 8px; border-radius:12px; font-size:0.72rem; font-weight:800; white-space:nowrap;">
                ${isInsta ? 'InstaPay' : 'Cash Wallet'}
            </span>
        </div>

        <div style="font-size:0.81rem; color:#374151; margin-bottom:4px;">
            <strong>${tr('اسم المستفيد:', 'Beneficiary:')}</strong> ${esc(paymentAccountsConfig.beneficiaryName)}
        </div>
        <div style="font-size:0.77rem; color:#6b7280;">${subLabel}</div>

        <div class="pay-account-pill">
            <span class="pay-account-value" id="${prefixId}_accVal">${esc(accountTarget)}</span>
            <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" class="pay-copy-btn" data-copy-target="${esc(accountTarget)}">
                    <i class="fa-regular fa-copy"></i> ${tr('نسخ', 'Copy')}
                </button>
                ${openLinkBtn}
            </div>
        </div>

        <div style="background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; padding:8px 10px; font-size:0.83rem; color:#92400e; display:flex; justify-content:space-between; align-items:center;">
            <span>${tr('المبلغ المطلوب تحويله:', 'Amount to Transfer:')}</span>
            <strong style="font-size:1rem; color:#173627;" id="${prefixId}_amountVal">${esc(amountText)}</strong>
        </div>

        <p style="font-size:0.75rem; color:#4b5563; margin:8px 0;">
            <i class="fa-solid fa-circle-info" style="color:#173627;"></i> ${esc(paymentAccountsConfig.transferNotes)}
        </p>

        <div style="margin-top:8px;">
            <label style="font-size:0.79rem; font-weight:800; color:#173627; display:block; margin-bottom:4px;">
                ${tr('رقم مرجع العملية (Transaction Ref):', 'Transaction Reference Number:')}
            </label>
            <input type="text" id="${prefixId}_refInput" placeholder="${tr('أدخل آخر 6 أرقام أو رقم مرجع التحويل', 'Enter transfer reference number')}" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #cbd5e1; background:#fff;">
        </div>

        <div style="margin-top:8px;">
            <label style="font-size:0.79rem; font-weight:800; color:#173627; display:block;">
                ${tr('صورة إشعار التحويل (Screenshot):', 'Transfer Receipt Screenshot:')}
            </label>
            <label class="pay-upload-label" for="${prefixId}_fileInput">
                <i class="fa-solid fa-camera"></i>
                <span id="${prefixId}_fileLabel">${tr('اضغط لاختيار صورة إيصال التحويل من الهاتف', 'Tap to upload transfer receipt image')}</span>
            </label>
            <input type="file" id="${prefixId}_fileInput" accept="image/*" style="display:none;">
            <img id="${prefixId}_previewImg" class="pay-receipt-preview" alt="Receipt Preview">
        </div>
    `;
}

function bindTransferBoxEvents(container, prefixId) {
    container.querySelectorAll('.pay-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            copyTextWithFeedback(btn.dataset.copyTarget, btn);
        });
    });

    const fileInput = document.getElementById(`${prefixId}_fileInput`);
    const fileLabel = document.getElementById(`${prefixId}_fileLabel`);
    const previewImg = document.getElementById(`${prefixId}_previewImg`);

    fileInput?.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (fileLabel) fileLabel.textContent = file.name;
        if (previewImg) {
            previewImg.src = URL.createObjectURL(file);
            previewImg.style.display = 'block';
        }
    });
}

// ==========================================
// 5. دمج خيارات إنستا باي والكاش في سلة المشتريات
// ==========================================
function initCartTransferPaymentUI() {
    const paySelect = document.getElementById('paymentTypeSelect');
    if (!paySelect || document.getElementById('omdaCartTransferContainer')) return;

    // إضافة خياري إنستا باي والمحفظة الإلكترونية
    const instapayOpt = document.createElement('option');
    instapayOpt.value = 'تحويل إنستا باي (InstaPay)';
    instapayOpt.textContent = tr('تحويل لحظي - إنستا باي (InstaPay)', 'Instant Transfer - InstaPay');

    const walletOpt = document.createElement('option');
    walletOpt.value = 'محفظة إلكترونية (كاش)';
    walletOpt.textContent = tr('محفظة إلكترونية (فودافون / اتصالات / WE كاش)', 'Mobile Cash Wallet');

    paySelect.appendChild(instapayOpt);
    paySelect.appendChild(walletOpt);

    const transferContainer = document.createElement('div');
    transferContainer.id = 'omdaCartTransferContainer';
    transferContainer.className = 'pay-transfer-box';
    transferContainer.style.display = 'none';
    paySelect.insertAdjacentElement('afterend', transferContainer);

    const getDisplayedTotalLabel = () => {
        const totalEl = document.getElementById('cartTotalPrice');
        const val = totalEl ? totalEl.textContent.trim() : '0';
        return `${val} ${tr('ج.م', 'EGP')}`;
    };

    const updateTransferBoxVisibility = () => {
        const val = paySelect.value || '';
        const isInsta = val.includes('إنستا باي') || val.toLowerCase().includes('instapay');
        const isWallet = val.includes('محفظة') || (val.includes('كاش') && !val.includes('عند الاستلام'));
        const modalContainer = document.querySelector('#cartModal .cart-modal-container');

        if (!isInsta && !isWallet) {
            transferContainer.style.display = 'none';
            modalContainer?.classList.remove('has-transfer-open');
            return;
        }

        const method = isInsta ? 'instapay' : 'wallet';
        if (transferContainer.dataset.activeMethod !== method || transferContainer.style.display === 'none') {
            transferContainer.dataset.activeMethod = method;
            transferContainer.innerHTML = buildTransferDetailsMarkup(method, getDisplayedTotalLabel(), 'cartPay');
            bindTransferBoxEvents(transferContainer, 'cartPay');
        } else {
            const amtEl = document.getElementById('cartPay_amountVal');
            if (amtEl) amtEl.textContent = getDisplayedTotalLabel();
        }
        transferContainer.style.display = 'block';
        modalContainer?.classList.add('has-transfer-open');

        // تمرير بطاقة الملخص بلطف لإظهار بيانات التحويل فوق زر الشراء المثبت
        requestAnimationFrame(() => {
            transferContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    };

    paySelect.addEventListener('change', updateTransferBoxVisibility);

    // تحديث المبلغ المعروض تلقائياً إذا تغيرت السلة أو طُبق كوبون/خصم جملة
    const totalSpan = document.getElementById('cartTotalPrice');
    if (totalSpan) {
        new MutationObserver(() => {
            const amtEl = document.getElementById('cartPay_amountVal');
            if (amtEl) amtEl.textContent = getDisplayedTotalLabel();
        }).observe(totalSpan, { childList: true, characterData: true, subtree: true });
    }

    // اعتراض زر إتمام الطلب في مرحلة الالتقاط (Capture) على مستوى document لضمان العمل قبل أي مستمع آخر
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('#checkoutBtn');
        if (!btn) return;

        const val = paySelect.value || '';
        const isInsta = val.includes('إنستا باي') || val.toLowerCase().includes('instapay');
        const isWallet = val.includes('محفظة') || (val.includes('كاش') && !val.includes('عند الاستلام'));
        if (!isInsta && !isWallet) return; // دع التدفق العادي يعمل للنقدي أو الآجل

        e.preventDefault();
        e.stopImmediatePropagation();

        if (btn.disabled) return;
        if (!payUser) {
            alert(tr('الرجاء تسجيل الدخول أولاً لإتمام الطلب.', 'Please sign in first to complete your order.'));
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.style.display = 'flex';
            return;
        }

        const currentCart = getCartItems();
        if (currentCart.length === 0) {
            alert(tr('سلة المشتريات فارغة!', 'Your cart is empty!'));
            return;
        }

        const phoneInput = document.getElementById('checkoutPhoneInput');
        const phoneVal = phoneInput ? phoneInput.value.trim() : '';
        if (!phoneVal || phoneVal.length < 6) {
            alert(tr('الرجاء إدخال رقم هاتف صحيح للتواصل والشحن قبل إتمام الطلب.', 'Please enter a valid contact phone number.'));
            phoneInput?.focus();
            return;
        }

        const refVal = (document.getElementById('cartPay_refInput')?.value || '').trim();
        const fileInput = document.getElementById('cartPay_fileInput');
        const receiptFile = fileInput?.files?.[0] || null;

        if (!refVal && !receiptFile) {
            alert(tr(
                'يرجى إدخال رقم مرجع التحويل أو إرفاق صورة إشعار التحويل لتأكيد الطلب.',
                'Please enter the transfer reference number or attach a receipt screenshot.'
            ));
            document.getElementById('cartPay_refInput')?.focus();
            return;
        }

        const origBtnHtml = btn.innerHTML;
        btn.disabled = true;

        try {
            let receiptUrl = '';
            if (receiptFile) {
                receiptUrl = await uploadReceiptToCloudinary(receiptFile, (pct) => {
                    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up fa-bounce"></i> ${tr(`جاري رفع الإيصال (${pct}%)...`, `Uploading receipt (${pct}%)...`)}`;
                });
            }

            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${tr('جاري تسجيل الطلب والتحويل...', 'Submitting order & transfer...')}`;

            await setDoc(doc(db, "users", payUser.email), { phone: phoneVal }, { merge: true });

            const sanitizedItems = currentCart.map(item => ({
                id: item.id || '',
                name: item.name || '',
                price: Number(item.price || 0)
            })).filter(i => i.price > 0);

            const rawSubtotal = sanitizedItems.reduce((s, i) => s + i.price, 0);
            const displayedNet = Number((document.getElementById('cartTotalPrice')?.textContent || '0').replace(/[^\d.]/g, ''));
            const finalTotal = (displayedNet > 0 && displayedNet <= rawSubtotal) ? displayedNet : rawSubtotal;
            const totalDiscount = Math.max(0, rawSubtotal - finalTotal);

            const lat = parseFloat(localStorage.getItem('omda_user_lat')) || 30.0444;
            const lng = parseFloat(localStorage.getItem('omda_user_lng')) || 31.2357;
            const methodKey = isInsta ? 'instapay' : 'wallet';
            const methodLabel = isInsta ? 'تحويل إنستا باي (InstaPay)' : 'محفظة إلكترونية (كاش)';
            const nowIso = new Date().toISOString();
            const todayAr = new Date().toLocaleDateString('ar-EG');

            const orderRef = await addDoc(collection(db, "orders"), {
                userEmail: payUser.email,
                phone: phoneVal,
                items: sanitizedItems,
                subtotal: rawSubtotal,
                discount: totalDiscount,
                total: finalTotal,
                status: 'بانتظار مراجعة التحويل',
                paymentType: methodLabel,
                paymentMethod: methodKey,
                paymentStatus: 'pending_verification',
                transferRef: refVal,
                receiptUrl,
                lat,
                lng,
                assignedVehicle: 'غير محدد',
                assignedDriver: 'غير محدد',
                date: todayAr,
                createdAt: nowIso
            });

            await addDoc(collection(db, "payment_transfers"), {
                purpose: 'order',
                orderId: orderRef.id,
                clientEmail: payUser.email,
                phone: phoneVal,
                method: methodKey,
                methodLabel,
                amount: finalTotal,
                transferRef: refVal,
                receiptUrl,
                status: 'pending',
                date: todayAr,
                createdAt: nowIso
            });

            // تفريغ السلة
            const uniqueKeys = [...new Set(currentCart.map(i => i.id || i.name))];
            if (typeof window.removeGroupFromCart === 'function') {
                uniqueKeys.forEach(k => window.removeGroupFromCart(k));
            } else {
                localStorage.removeItem('omda_cart');
            }

            const cartModal = document.getElementById('cartModal');
            if (cartModal) cartModal.style.display = 'none';

            alert(tr(
                `تم إرسال طلبك وإيصال التحويل بنجاح! رقم الفاتورة: #${orderRef.id.slice(0, 6)}. سيتم مراجعة التحويل وتأكيد الشحن فوراً.`,
                `Order & transfer receipt submitted! Invoice #${orderRef.id.slice(0, 6)}. Verification will be completed shortly.`
            ));
        } catch (err) {
            alert(tr('خطأ أثناء إرسال التحويل: ', 'Transfer error: ') + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = origBtnHtml;
        }
    }, true);
}

// ==========================================
// 6. سداد دفعات الآجل أونلاين من صفحة العميل
// ==========================================
function initClientCreditRepaymentButton() {
    const creditBox = document.getElementById('userCreditSummaryBox');
    if (!creditBox || document.getElementById('omdaClientPayCreditBtn')) return;

    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'margin-top:12px; display:flex; justify-content:flex-end;';
    btnWrap.innerHTML = `
        <button type="button" id="omdaClientPayCreditBtn" class="btn-submit" style="width:auto; padding:9px 16px; background:#173627; font-size:0.86rem;">
            <i class="fa-solid fa-money-bill-transfer" style="color:#d4af37;"></i>
            ${tr('سداد دفعة من حساب الآجل (إنستا باي / كاش)', 'Pay Credit Balance (InstaPay / Cash)')}
        </button>
    `;
    creditBox.appendChild(btnWrap);

    document.getElementById('omdaClientPayCreditBtn')?.addEventListener('click', openClientCreditTransferModal);
}

function openClientCreditTransferModal() {
    document.getElementById('omdaCreditTransferModal')?.remove();

    const remText = document.getElementById('userRemainingCreditVal')?.textContent || '';
    const numericRem = Number(remText.replace(/[^\d.]/g, '')) || 0;

    const backdrop = document.createElement('div');
    backdrop.id = 'omdaCreditTransferModal';
    backdrop.className = 'modal-overlay';
    backdrop.style.display = 'flex';
    backdrop.style.zIndex = '10020';

    backdrop.innerHTML = `
        <div class="modal-container" style="max-width:520px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-hand-holding-dollar"></i> ${tr('سداد دفعة من حساب الآجل', 'Settle Credit Account Payment')}</h3>
                <span id="closeCreditTransferModalBtn" style="font-size:1.5rem; cursor:pointer;">&times;</span>
            </div>
            <div class="modal-body" style="max-height:80vh; overflow-y:auto;">
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
                    <div style="flex:1; min-width:140px;">
                        <label style="font-size:0.82rem; font-weight:800;">${tr('طريقة التحويل:', 'Transfer Method:')}</label>
                        <select id="creditTransferMethodSelect" style="width:100%; padding:9px; border-radius:8px; border:1px solid #cbd5e1; margin-top:4px;">
                            <option value="instapay">${tr('إنستا باي (InstaPay)', 'InstaPay')}</option>
                            <option value="wallet">${tr('محفظة إلكترونية (كاش)', 'Mobile Cash Wallet')}</option>
                        </select>
                    </div>
                    <div style="flex:1; min-width:140px;">
                        <label style="font-size:0.82rem; font-weight:800;">${tr('المبلغ المُحوَّل (ج.م):', 'Transferred Amount (EGP):')}</label>
                        <input type="number" id="creditTransferAmountInput" min="1" step="0.01" value="${numericRem > 0 ? numericRem : ''}" placeholder="0" style="width:100%; padding:9px; border-radius:8px; border:1px solid #cbd5e1; margin-top:4px;">
                    </div>
                </div>

                <div id="creditTransferDetailsBox" class="pay-transfer-box"></div>

                <button type="button" id="submitCreditTransferBtn" class="btn-submit" style="margin-top:14px; background:#15803d;">
                    <i class="fa-solid fa-paper-plane"></i> ${tr('إرسال إشعار السداد للمراجعة والخصم', 'Submit Payment Receipt')}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);

    const methodSel = document.getElementById('creditTransferMethodSelect');
    const amtInp = document.getElementById('creditTransferAmountInput');
    const box = document.getElementById('creditTransferDetailsBox');

    const renderBox = () => {
        const amtLabel = `${Number(amtInp.value || 0).toLocaleString()} ${tr('ج.م', 'EGP')}`;
        box.innerHTML = buildTransferDetailsMarkup(methodSel.value, amtLabel, 'credPay');
        bindTransferBoxEvents(box, 'credPay');
    };

    renderBox();
    methodSel.addEventListener('change', renderBox);
    amtInp.addEventListener('input', () => {
        const lbl = document.getElementById('credPay_amountVal');
        if (lbl) lbl.textContent = `${Number(amtInp.value || 0).toLocaleString()} ${tr('ج.م', 'EGP')}`;
    });

    document.getElementById('closeCreditTransferModalBtn')?.addEventListener('click', () => backdrop.remove());

    document.getElementById('submitCreditTransferBtn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        if (btn.disabled || !payUser) return;

        const amount = Number(amtInp.value);
        if (!(amount > 0)) {
            alert(tr('يرجى إدخال مبلغ صحيح أكبر من صفر.', 'Please enter a valid amount greater than zero.'));
            amtInp.focus();
            return;
        }

        const refVal = (document.getElementById('credPay_refInput')?.value || '').trim();
        const file = document.getElementById('credPay_fileInput')?.files?.[0] || null;
        if (!refVal && !file) {
            alert(tr('يرجى إدخال رقم مرجع التحويل أو إرفاق صورة الإيصال.', 'Please provide reference number or receipt image.'));
            return;
        }

        const orig = btn.innerHTML;
        btn.disabled = true;

        try {
            let receiptUrl = '';
            if (file) {
                receiptUrl = await uploadReceiptToCloudinary(file, (pct) => {
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${tr(`جاري رفع الإيصال (${pct}%)...`, `Uploading (${pct}%)...`)}`;
                });
            }

            const method = methodSel.value;
            const methodLabel = method === 'instapay' ? 'تحويل إنستا باي (InstaPay)' : 'محفظة إلكترونية (كاش)';
            const phone = document.getElementById('userPhoneDisplay')?.textContent?.trim() || '';

            await addDoc(collection(db, "payment_transfers"), {
                purpose: 'credit_repayment',
                orderId: '',
                clientEmail: payUser.email,
                phone: phone === '-' ? '' : phone,
                method,
                methodLabel,
                amount,
                transferRef: refVal,
                receiptUrl,
                status: 'pending',
                date: new Date().toLocaleDateString('ar-EG'),
                createdAt: new Date().toISOString()
            });

            alert(tr(
                'تم إرسال إشعار سداد المديونية بنجاح! سيتم خصمه من رصيدك الآجل فور مراجعة المحاسب.',
                'Credit repayment receipt submitted! It will be deducted from your balance once verified.'
            ));
            backdrop.remove();
        } catch (err) {
            alert(tr('خطأ أثناء الإرسال: ', 'Submission error: ') + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    });
}

// ==========================================
// 7. لوحة إدارة التحويلات وإعداد الحسابات (داخل تبويب المحاسبة)
// ==========================================
function updatePendingTransfersBadge(count) {
    const tabBtn = document.getElementById('tabAccountingBtn');
    if (!tabBtn) return;

    let badge = document.getElementById('omdaPendingTransfersBadge');
    if (!badge) {
        badge = document.createElement('span');
        badge.id = 'omdaPendingTransfersBadge';
        badge.style.cssText = 'display:none; background:#7c3aed; color:#fff; font-size:0.74rem; font-weight:800; padding:1px 7px; border-radius:999px; margin-inline-start:6px;';
        tabBtn.appendChild(badge);
    }

    if (count > 0) {
        badge.textContent = `${count} تحويل`;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function listenTransfersRealtime() {
    const qTransfers = query(collection(db, "payment_transfers"), limit(150));
    onSnapshot(qTransfers, (snapshot) => {
        const items = [];
        let pending = 0;
        snapshot.forEach(d => {
            const data = { id: d.id, ...d.data() };
            items.push(data);
            if (data.status === 'pending') pending++;
        });
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        transfersCache = items;
        pendingTransfersCount = pending;

        if (isStaff(payUserRole)) {
            updatePendingTransfersBadge(pending);
            renderAdminTransfersQueue();
        }
    }, (err) => {
        console.warn('تنبيه استماع التحويلات:', err.message);
    });
}

function initAdminPaymentManagementUI() {
    const accTab = document.getElementById('adminAccountingTab');
    if (!accTab || document.getElementById('omdaAdminPaymentsWrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'omdaAdminPaymentsWrapper';
    wrapper.innerHTML = `
        <div class="pay-admin-panel-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                <h3 style="margin:0; color:#173627; font-size:1.05rem;">
                    <i class="fa-solid fa-money-bill-transfer" style="color:#d4af37;"></i>
                    مراجعة واعتماد تحويلات إنستا باي والمحافظ الإلكترونية
                </h3>
                <select id="omdaTransferStatusFilter" style="padding:7px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#f8faf9; font-weight:700;">
                    <option value="pending">بانتظار المراجعة فقط</option>
                    <option value="all">جميع التحويلات</option>
                    <option value="approved">المعتمدة</option>
                    <option value="rejected">المرفوضة</option>
                </select>
            </div>
            <div id="omdaAdminTransfersList" class="data-list"></div>
        </div>

        <details class="pay-admin-panel-card" style="border-top-color:#173627;">
            <summary style="cursor:pointer; font-weight:800; color:#173627; font-size:0.98rem;">
                <i class="fa-solid fa-sliders" style="color:#d4af37;"></i>
                إعدادات حسابات استقبال التحويلات (InstaPay & المحافظ الإلكترونية)
            </summary>
            <form id="omdaPaymentAccountsForm" style="margin-top:12px;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px;">
                    <div class="input-group">
                        <label>اسم المستفيد / المؤسسة</label>
                        <input type="text" id="cfgBeneficiaryName" value="${esc(paymentAccountsConfig.beneficiaryName)}" required>
                    </div>
                    <div class="input-group">
                        <label>عنوان إنستا باي (IPA)</label>
                        <input type="text" id="cfgInstapayIpa" value="${esc(paymentAccountsConfig.instapayIpa)}" placeholder="name@instapay" required>
                    </div>
                    <div class="input-group">
                        <label>رابط إنستا باي المباشر (اختياري)</label>
                        <input type="url" id="cfgInstapayLink" value="${esc(paymentAccountsConfig.instapayLink)}" placeholder="https://ipn.eg/...">
                    </div>
                    <div class="input-group">
                        <label>أرقام المحافظ الإلكترونية (كاش)</label>
                        <input type="text" id="cfgWalletNumbers" value="${esc(paymentAccountsConfig.walletNumbers)}" placeholder="01114099799" required>
                    </div>
                    <div class="input-group">
                        <label>نوع المحافظ المتاحة</label>
                        <input type="text" id="cfgWalletProviders" value="${esc(paymentAccountsConfig.walletProviders)}">
                    </div>
                </div>
                <div class="input-group" style="margin-top:8px;">
                    <label>تعليمات تظهر للعميل عند التحويل</label>
                    <input type="text" id="cfgTransferNotes" value="${esc(paymentAccountsConfig.transferNotes)}">
                </div>
                <button type="submit" id="savePaymentAccountsCfgBtn" class="btn-submit" style="margin-top:8px;">
                    <i class="fa-solid fa-floppy-disk"></i> حفظ بيانات حسابات الاستقبال
                </button>
            </form>
        </details>
    `;

    accTab.insertAdjacentElement('afterbegin', wrapper);

    document.getElementById('omdaTransferStatusFilter')?.addEventListener('change', renderAdminTransfersQueue);

    document.getElementById('omdaPaymentAccountsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('savePaymentAccountsCfgBtn');
        if (btn?.disabled) return;
        btn.disabled = true;

        try {
            const updated = {
                beneficiaryName: document.getElementById('cfgBeneficiaryName').value.trim(),
                instapayIpa: document.getElementById('cfgInstapayIpa').value.trim(),
                instapayLink: document.getElementById('cfgInstapayLink').value.trim(),
                walletNumbers: document.getElementById('cfgWalletNumbers').value.trim(),
                walletProviders: document.getElementById('cfgWalletProviders').value.trim(),
                transferNotes: document.getElementById('cfgTransferNotes').value.trim(),
                updatedAt: new Date().toISOString(),
                updatedBy: payUser?.email || 'admin'
            };

            await setDoc(doc(db, "app_settings", "payments_config"), updated, { merge: true });
            paymentAccountsConfig = { ...paymentAccountsConfig, ...updated };
            alert('تم حفظ بيانات حسابات إنستا باي والمحافظ الإلكترونية بنجاح!');
        } catch (err) {
            alert('خطأ أثناء حفظ الإعدادات: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });

    renderAdminTransfersQueue();
}

function renderAdminTransfersQueue() {
    const list = document.getElementById('omdaAdminTransfersList');
    if (!list) return;

    const filter = document.getElementById('omdaTransferStatusFilter')?.value || 'pending';
    const filtered = filter === 'all'
        ? transfersCache
        : transfersCache.filter(t => (t.status || 'pending') === filter);

    if (filtered.length === 0) {
        list.innerHTML = `<p style="color:#6b7280; font-size:0.86rem; text-align:center; padding:12px;">لا توجد تحويلات في هذه القائمة حالياً.</p>`;
        return;
    }

    list.innerHTML = filtered.map(item => {
        const safeId = esc(item.id);
        const st = item.status || 'pending';
        const statusBadge = st === 'approved'
            ? `<span class="pay-status-badge pay-status-approved"><i class="fa-solid fa-circle-check"></i> معتمد ومؤكد</span>`
            : st === 'rejected'
                ? `<span class="pay-status-badge pay-status-rejected"><i class="fa-solid fa-circle-xmark"></i> مرفوض</span>`
                : `<span class="pay-status-badge pay-status-pending"><i class="fa-solid fa-clock"></i> بانتظار المراجعة</span>`;

        const purposeBadge = item.purpose === 'credit_repayment'
            ? `<span style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:6px; font-size:0.76rem; font-weight:800;">سداد من حساب الآجل</span>`
            : `<span style="background:#f3e8ff; color:#6b21a8; padding:2px 8px; border-radius:6px; font-size:0.76rem; font-weight:800;">طلب شراء #${esc((item.orderId || '').slice(0, 6))}</span>`;

        const imgUrl = safeImgUrl(item.receiptUrl);
        const receiptHtml = imgUrl
            ? `<div style="margin-top:8px;">
                 <a href="javascript:void(0)" onclick="window.openReceiptLightbox('${esc(imgUrl)}')" style="display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; border:1px solid #cbd5e1; padding:5px 10px; border-radius:7px; color:#173627; text-decoration:none; font-size:0.8rem; font-weight:800;">
                    <i class="fa-solid fa-image"></i> عرض صورة إيصال التحويل
                 </a>
               </div>`
            : '';

        const actionsHtml = st === 'pending'
            ? `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
                 <button type="button" onclick="window.approvePaymentTransfer('${safeId}')" style="background:#15803d; color:#fff; border:none; padding:7px 14px; border-radius:7px; font-weight:800; cursor:pointer; font-size:0.82rem;">
                    <i class="fa-solid fa-check-double"></i> تأكيد استلام المبلغ
                 </button>
                 <button type="button" onclick="window.rejectPaymentTransfer('${safeId}')" style="background:#dc2626; color:#fff; border:none; padding:7px 12px; border-radius:7px; font-weight:700; cursor:pointer; font-size:0.82rem;">
                    <i class="fa-solid fa-xmark"></i> رفض
                 </button>
               </div>`
            : '';

        return `
            <div class="data-item" style="border-right:4px solid ${st === 'approved' ? '#16a34a' : (st === 'rejected' ? '#dc2626' : '#7c3aed')};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                    <div>
                        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:4px;">
                            ${statusBadge}
                            ${purposeBadge}
                            <strong style="color:#173627;">${esc(item.methodLabel || item.method)}</strong>
                        </div>
                        <p style="margin:3px 0; font-size:0.88rem;">
                            <strong>العميل:</strong> ${esc(item.clientEmail)}
                            ${item.phone ? ` | <strong>الهاتف:</strong> <a href="tel:${esc(item.phone)}" style="color:#0284c7;">${esc(item.phone)}</a>` : ''}
                        </p>
                        <p style="margin:3px 0; font-size:0.88rem;">
                            <strong>المبلغ:</strong> <span style="color:#15803d; font-weight:900; font-size:1rem;">${Number(item.amount || 0).toLocaleString()} ج.م</span>
                            ${item.transferRef ? ` | <strong>رقم المرجع:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${esc(item.transferRef)}</code>` : ''}
                            | <small style="color:#6b7280;">${esc(item.date || '')}</small>
                        </p>
                        ${receiptHtml}
                    </div>
                </div>
                ${actionsHtml}
            </div>
        `;
    }).join('');
}

window.openReceiptLightbox = function(url) {
    document.getElementById('omdaReceiptLightbox')?.remove();
    const box = document.createElement('div');
    box.id = 'omdaReceiptLightbox';
    box.className = 'pay-lightbox-backdrop';
    box.innerHTML = `
        <div style="position:relative; max-width:94vw; max-height:90vh; text-align:center;">
            <button type="button" onclick="document.getElementById('omdaReceiptLightbox').remove()" style="position:absolute; top:-14px; right:-14px; background:#dc2626; color:#fff; border:none; width:34px; height:34px; border-radius:50%; font-size:1.1rem; cursor:pointer; font-weight:bold;">&times;</button>
            <img src="${esc(url)}" style="max-width:100%; max-height:85vh; border-radius:12px; border:3px solid #d4af37; background:#fff;">
        </div>
    `;
    box.addEventListener('click', (e) => {
        if (e.target === box) box.remove();
    });
    document.body.appendChild(box);
};

window.approvePaymentTransfer = async function(transferId) {
    const item = transfersCache.find(t => t.id === transferId);
    if (!item) return;

    if (!confirm(`هل تؤكد استلام مبلغ (${Number(item.amount).toLocaleString()} ج.م) من ${item.clientEmail}؟`)) return;

    try {
        await updateDoc(doc(db, "payment_transfers", transferId), {
            status: 'approved',
            verifiedBy: payUser?.email || 'admin',
            verifiedAt: new Date().toISOString()
        });

        if (item.purpose === 'order' && item.orderId) {
            await updateDoc(doc(db, "orders", item.orderId), {
                status: 'مدفوع (تم تأكيد التحويل) - قيد الشحن',
                paymentStatus: 'verified'
            });
        } else if (item.purpose === 'credit_repayment') {
            await addDoc(collection(db, "credit_payments"), {
                clientEmail: item.clientEmail,
                amount: Number(item.amount || 0),
                note: `${item.methodLabel || 'تحويل إلكتروني'} معتمد${item.transferRef ? ` - مرجع: ${item.transferRef}` : ''}`,
                recordedBy: payUser?.email || 'admin',
                date: new Date().toLocaleDateString('ar-EG'),
                createdAt: new Date().toISOString()
            });
        }

        alert('تم اعتماد التحويل وترحيله محاسبياً بنجاح!');
    } catch (err) {
        alert('خطأ أثناء اعتماد التحويل: ' + err.message);
    }
};

window.rejectPaymentTransfer = async function(transferId) {
    const item = transfersCache.find(t => t.id === transferId);
    if (!item) return;

    const reason = prompt('سبب رفض التحويل (اختياري):', 'لم يتم العثور على العملية في كشف الحساب');
    if (reason === null) return;

    try {
        await updateDoc(doc(db, "payment_transfers", transferId), {
            status: 'rejected',
            rejectReason: reason.trim(),
            verifiedBy: payUser?.email || 'admin',
            verifiedAt: new Date().toISOString()
        });

        if (item.purpose === 'order' && item.orderId) {
            await updateDoc(doc(db, "orders", item.orderId), {
                status: 'مرفوض - يرجى مراجعة بيانات التحويل',
                paymentStatus: 'rejected'
            });
        }

        alert('تم رفض التحويل وتحديث الحالة.');
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
};

// ==========================================
// 8. التشغيل التلقائي الآمن للنواة
// ==========================================
onAuthStateChanged(auth, async (user) => {
    payUser = user || null;
    if (user) {
        try {
            if (user.email === "haretg@gmail.com") {
                payUserRole = "admin";
            } else {
                const uSnap = await getDoc(doc(db, "users", user.email));
                if (uSnap.exists()) {
                    const d = uSnap.data();
                    payUserRole = d.role || d.rol || d.col || "customer";
                }
            }
            if (isStaff(payUserRole)) {
                updatePendingTransfersBadge(pendingTransfersCount);
                renderAdminTransfersQueue();
            }
        } catch (_) {}
    } else {
        payUserRole = 'customer';
    }
});

async function bootstrapOmdaPaymentsCore() {
    injectPaymentCoreStyles();
    await loadPaymentAccountsConfig();
    initCartTransferPaymentUI();
    initClientCreditRepaymentButton();
    initAdminPaymentManagementUI();
    listenTransfersRealtime();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapOmdaPaymentsCore);
} else {
    bootstrapOmdaPaymentsCore();
}
