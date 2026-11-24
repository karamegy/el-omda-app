/**
 * ============================================================================
 * ملف النواة المتقدمة (الإصدار الاحترافي المُحسَّن) - منصة العمدة / مؤسسة الإخلاص
 * File: omda-pro-core.js
 * المميزات الخمس المدمجة بالكامل:
 * 1. تذكرة الميزان البسكول الرقمية + توليد رمز QR Code مدمج في الفاتورة (بدون إنترنت/CORS) + عرض حالة الدفع والإيصال.
 * 2. مُحسِّن خط سير السائق (ترتيب من الأقرب للأبعد GPS) + لوحة التوقيع الإلكتروني (POD).
 * 3. حارس السقف الائتماني للآجل + إرسال كشف الحساب عبر واتساب بضغطة زر.
 * 4. جدول الطلب السريع للجملة والمزارع (Bulk Order Grid) + منبّه أسعار البورصة المستهدفة.
 * 5. حاسبة معامل التحويل الغذائي (FCR) + تقييم جودة الدفعة وعرض التقييمات والتعليقات في الإدارة.
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc,
    updateDoc, query, where, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCU--Klxwfg7pDinUgS0UEde9cpmmsrDRM",
    authDomain: "omda-a750f.firebaseapp.com",
    projectId: "omda-a750f",
    storageBucket: "omda-a750f.firebasestorage.app",
    messagingSenderId: "1078714497381",
    appId: "1:1078714497381:android:9430672b84226b0a46898c"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let proUser = null;
let proProductsCache = [];
let proMarketCache = [];

function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isEn() {
    return (document.documentElement.lang || localStorage.getItem('omda_lang') || 'ar') === 'en';
}

function tr(ar, en) {
    return isEn() ? en : ar;
}

function calcDistKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ==========================================
// 0. حقن التنسيقات الخاصة بالنواة الاحترافية
// ==========================================
function injectProStyles() {
    if (document.getElementById('omda-pro-core-styles')) return;
    const style = document.createElement('style');
    style.id = 'omda-pro-core-styles';
    style.textContent = `
        .pro-btn-gold {
            background: linear-gradient(135deg, #d4af37 0%, #b89225 100%);
            color: #10271c;
            border: none;
            padding: 9px 15px;
            border-radius: 10px;
            font-weight: 800;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85rem;
            box-shadow: 0 3px 10px rgba(212, 175, 55, 0.25);
        }
        .pro-btn-emerald {
            background: #173627;
            color: #ffffff;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.82rem;
        }
        .pro-btn-wa {
            background: #25D366;
            color: #ffffff;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 800;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.8rem;
            margin-top: 6px;
        }
        .pro-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(16, 39, 28, 0.68);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 14px;
            backdrop-filter: blur(3px);
        }
        .pro-modal-box {
            background: #ffffff;
            width: 100%;
            max-width: 640px;
            max-height: 88vh;
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 15px 40px rgba(0,0,0,0.28);
            border-top: 4px solid #d4af37;
        }
        .pro-modal-head {
            background: #173627;
            color: #ffffff;
            padding: 14px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .pro-modal-body {
            padding: 16px;
            overflow-y: auto;
            flex: 1;
        }
        .pro-modal-foot {
            padding: 12px 16px;
            background: #f8faf9;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .pro-bulk-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        .pro-bulk-table th {
            background: #f0f7f4;
            color: #173627;
            padding: 9px 8px;
            text-align: right;
            border-bottom: 2px solid #173627;
            position: sticky;
            top: 0;
        }
        .pro-bulk-table td {
            padding: 9px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: middle;
        }
        .pro-qty-stepper {
            display: inline-flex;
            align-items: center;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
        }
        .pro-qty-stepper button {
            background: #f1f5f9;
            border: none;
            padding: 5px 9px;
            font-weight: 900;
            cursor: pointer;
            color: #173627;
        }
        .pro-qty-stepper input {
            width: 52px;
            text-align: center;
            border: none;
            font-weight: 800;
            padding: 4px 0;
        }
        .pro-sig-canvas {
            width: 100%;
            height: 180px;
            border: 2px dashed #173627;
            border-radius: 10px;
            background: #fcfdfc;
            touch-action: none;
            cursor: crosshair;
        }
        .pro-star-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #cbd5e1;
            transition: transform 0.15s;
        }
        .pro-star-btn.active {
            color: #f59e0b;
            transform: scale(1.12);
        }
        .pro-credit-alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
            border-radius: 8px;
            padding: 9px 12px;
            font-size: 0.82rem;
            margin-top: 8px;
        }
        .pro-credit-ok {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
            border-radius: 8px;
            padding: 9px 12px;
            font-size: 0.82rem;
            margin-top: 8px;
        }
        .pro-admin-rating-inline {
            margin-top: 8px;
            padding: 8px 10px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-right: 4px solid #f59e0b;
            border-radius: 8px;
            font-size: 0.82rem;
            color: #78350f;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// مولد رمز QR Code قياسي (SVG) يعمل محلياً 100% بدون إنترنت أو CORS
// ==========================================
function generateQrCodeSvg(text, sizePx = 96) {
    const size = 29;
    const rawBytes = new TextEncoder().encode(String(text)).slice(0, 53);

    const bits = [];
    const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };
    pushBits(0b0100, 4);
    pushBits(rawBytes.length, 8);
    rawBytes.forEach(b => pushBits(b, 8));
    pushBits(0, Math.min(4, 440 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const dataCodewords = [];
    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
        dataCodewords.push(byte);
    }
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (dataCodewords.length < 55) {
        dataCodewords.push(padBytes[padIdx % 2]);
        padIdx++;
    }

    const gfExp = new Uint8Array(512);
    const gfLog = new Uint8Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
        gfExp[i] = x;
        gfLog[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) gfExp[i] = gfExp[i - 255];
    const gfMul = (a, b) => (a === 0 || b === 0) ? 0 : gfExp[gfLog[a] + gfLog[b]];

    let genPoly = [1];
    for (let i = 0; i < 15; i++) {
        const next = new Array(genPoly.length + 1).fill(0);
        for (let j = 0; j < genPoly.length; j++) {
            next[j] ^= genPoly[j];
            next[j + 1] ^= gfMul(genPoly[j], gfExp[i]);
        }
        genPoly = next;
    }

    const msgPoly = [...dataCodewords, ...new Array(15).fill(0)];
    for (let i = 0; i < dataCodewords.length; i++) {
        const coef = msgPoly[i];
        if (coef !== 0) {
            for (let j = 0; j < genPoly.length; j++) {
                msgPoly[i + j] ^= gfMul(genPoly[j], coef);
            }
        }
    }
    const ecCodewords = msgPoly.slice(dataCodewords.length);
    const allCodewords = [...dataCodewords, ...ecCodewords];
    const allBits = [];
    allCodewords.forEach(cw => {
        for (let b = 7; b >= 0; b--) allBits.push((cw >> b) & 1);
    });
    for (let r = 0; r < 7; r++) allBits.push(0);

    const grid = Array.from({ length: size }, () => new Array(size).fill(null));
    const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));

    const setFunc = (r, c, val) => {
        if (r >= 0 && r < size && c >= 0 && c < size) {
            grid[r][c] = val ? 1 : 0;
            isFunc[r][c] = true;
        }
    };

    const placeFinder = (row, col) => {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
                const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
                setFunc(row + r, col + c, inOuter && (onBorder || inInner));
            }
        }
    };
    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            setFunc(22 + r, 22 + c, Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
        }
    }

    for (let i = 8; i < size - 8; i++) {
        setFunc(6, i, i % 2 === 0);
        setFunc(i, 6, i % 2 === 0);
    }

    for (let i = 0; i < 9; i++) {
        if (i !== 6) {
            setFunc(8, i, false);
            setFunc(i, 8, false);
        }
    }
    for (let i = 0; i < 8; i++) {
        setFunc(8, size - 1 - i, false);
        setFunc(size - 1 - i, 8, false);
    }
    setFunc(size - 8, 8, true);

    let bitIdx = 0;
    let upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let step = 0; step < size; step++) {
            const r = upward ? (size - 1 - step) : step;
            for (let dx = 0; dx < 2; dx++) {
                const c = right - dx;
                if (!isFunc[r][c]) {
                    const rawBit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
                    const mask = ((r + c) % 2 === 0) ? 1 : 0;
                    grid[r][c] = rawBit ^ mask;
                }
            }
        }
        upward = !upward;
    }

    const fmt = 0x77C4;
    const fmtCoords1 = [
        [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
        [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    const fmtCoords2 = [
        [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
        [size - 5, 8], [size - 6, 8], [size - 7, 8],
        [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
        [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
    ];
    for (let i = 0; i < 15; i++) {
        const bit = (fmt >> (14 - i)) & 1;
        grid[fmtCoords1[i][0]][fmtCoords1[i][1]] = bit;
        grid[fmtCoords2[i][0]][fmtCoords2[i][1]] = bit;
    }

    let rects = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 1) {
                rects += `<rect x="${c + 2}" y="${r + 2}" width="1" height="1" fill="#173627"/>`;
            }
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size + 4} ${size + 4}" width="${sizePx}" height="${sizePx}" style="background:#fff; border:1px solid #d1d5db; border-radius:6px; display:block;">${rects}</svg>`;
}

// ==========================================
// الإضافة 1: تذكرة الميزان البسكول + QR Code مدمج في الفاتورة + بيانات الدفع والإيصال
// ==========================================
function initInvoiceQrAndWeighbridge() {
    const invContent = document.getElementById('printableInvoiceContent');
    if (invContent) {
        new MutationObserver(async () => {
            if (!invContent.innerHTML.trim() || invContent.querySelector('#proInvoiceQrBox')) return;

            const text = invContent.textContent || '';
            const idMatch = text.match(/#([A-Za-z0-9_-]{4,})/);
            const shortId = idMatch ? idMatch[1] : 'INV';

            const box = document.createElement('div');
            box.id = 'proInvoiceQrBox';
            box.style.cssText = 'margin-top:14px; padding-top:12px; border-top:1.5px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;';

            const qrSvg = generateQrCodeSvg(`OMDA-INV:${shortId}|DATE:${new Date().toISOString().slice(0, 10)}`, 86);
            box.innerHTML = `
                <div style="flex:1; min-width:180px; font-size:0.8rem; color:#374151;">
                    <strong style="color:#173627; display:block;"><i class="fa-solid fa-qrcode"></i> ${tr('ختم التحقق الرقمي للفاتورة', 'Digital Invoice Verification Seal')}</strong>
                    <span>${tr('رقم المرجع:', 'Ref ID:')} #${esc(shortId)}</span>
                    <div id="proInvoiceExtraMetadata" style="margin-top:6px;"></div>
                </div>
                <div>${qrSvg}</div>
            `;

            // الإدراج داخل #invoiceCanvasArea ليظهر في الصورة المحفوظة (PNG) والطباعة
            (invContent.querySelector('#invoiceCanvasArea') || invContent).appendChild(box);

            try {
                let matchedOrder = null;
                if (shortId && shortId !== 'INV' && shortId.length >= 15) {
                    const directSnap = await getDoc(doc(db, "orders", shortId));
                    if (directSnap.exists()) {
                        matchedOrder = { id: directSnap.id, ...directSnap.data() };
                    }
                }
                if (!matchedOrder && shortId && shortId !== 'INV') {
                    const ordersSnap = await getDocs(query(collection(db, "orders"), limit(150)));
                    ordersSnap.forEach(d => {
                        if (d.id.startsWith(shortId) || d.id === shortId) matchedOrder = { id: d.id, ...d.data() };
                    });
                }

                const metaEl = document.getElementById('proInvoiceExtraMetadata');
                if (matchedOrder && metaEl) {
                    let html = '';

                    // 1. عرض حالة الدفع وبيانات التحويل والإيصال داخل الفاتورة
                    const payType = matchedOrder.paymentType || '';
                    const payStatus = matchedOrder.paymentStatus || '';
                    const transferRef = matchedOrder.transferRef || '';
                    const receiptUrl = (matchedOrder.receiptUrl && /^https?:\/\//i.test(matchedOrder.receiptUrl))
                        ? matchedOrder.receiptUrl
                        : '';

                    const isPaidVerified = payStatus === 'verified' || (matchedOrder.status || '').includes('مدفوع');
                    const isPendingVerify = payStatus === 'pending_verification' || (matchedOrder.status || '').includes('بانتظار مراجعة التحويل');
                    const isRejectedPay = payStatus === 'rejected' || (matchedOrder.status || '').includes('مرفوض');

                    if (isPaidVerified) {
                        html += `
                            <div style="background:#dcfce7; border:1.5px solid #16a34a; color:#15803d; padding:6px 10px; border-radius:8px; font-weight:800; margin-bottom:6px;">
                                <i class="fa-solid fa-circle-check"></i> ${tr('مدفوعة بالكامل (تم تأكيد استلام التحويل)', 'Paid (Transfer Verified)')}
                            </div>
                        `;
                    } else if (isPendingVerify) {
                        html += `
                            <div style="background:#fef3c7; border:1.5px solid #f59e0b; color:#b45309; padding:6px 10px; border-radius:8px; font-weight:800; margin-bottom:6px;">
                                <i class="fa-solid fa-clock"></i> ${tr('بانتظار مراجعة وتأكيد التحويل', 'Pending Transfer Verification')}
                            </div>
                        `;
                    } else if (isRejectedPay) {
                        html += `
                            <div style="background:#fee2e2; border:1.5px solid #dc2626; color:#b91c1c; padding:6px 10px; border-radius:8px; font-weight:800; margin-bottom:6px;">
                                <i class="fa-solid fa-circle-xmark"></i> ${tr('التحويل مرفوض - يرجى مراجعة الإدارة', 'Transfer Rejected')}
                            </div>
                        `;
                    }

                    if (payType) {
                        html += `<div style="color:#173627; font-weight:700; margin-bottom:3px;"><i class="fa-solid fa-wallet"></i> ${tr('طريقة الدفع:', 'Payment Method:')} ${esc(payType)}</div>`;
                    }

                    if (transferRef) {
                        html += `<div style="color:#374151; font-weight:700; margin-bottom:4px;"><i class="fa-solid fa-hashtag"></i> ${tr('رقم مرجع التحويل:', 'Transfer Ref:')} <span dir="ltr">${esc(transferRef)}</span></div>`;
                    }

                    if (receiptUrl) {
                        html += `
                            <div style="margin:5px 0 6px;">
                                <a href="${esc(receiptUrl)}" target="_blank" rel="noopener noreferrer"
                                   onclick="if(typeof window.openReceiptLightbox==='function'){event.preventDefault();window.openReceiptLightbox('${esc(receiptUrl)}');}"
                                   style="display:inline-flex; align-items:center; gap:5px; background:#f0f7f4; border:1px solid #173627; color:#173627; padding:4px 10px; border-radius:6px; text-decoration:none; font-weight:800; font-size:0.76rem;">
                                    <i class="fa-solid fa-receipt"></i> ${tr('عرض إيصال الدفع المرفق', 'View Attached Payment Receipt')}
                                </a>
                            </div>
                        `;
                    }

                    // 2. وزن البسكول وتوقيع المستلم (كما هي)
                    if (matchedOrder.weighbridgeNetKg) {
                        html += `<div style="color:#15803d; font-weight:700;"><i class="fa-solid fa-weight-scale"></i> ${tr('وزن البسكول الصافي:', 'Weighbridge Net:')} ${Number(matchedOrder.weighbridgeNetKg).toLocaleString()} ${tr('كجم', 'kg')} (${(matchedOrder.weighbridgeNetKg / 1000).toFixed(3)} ${tr('طن', 'Ton')})</div>`;
                    }
                    if (matchedOrder.podSignature) {
                        html += `
                            <div style="margin-top:6px;">
                                <span style="font-size:0.75rem; color:#555;">${tr('توقيع المستلم بالمزرعة:', 'Recipient Signature:')} <strong>${esc(matchedOrder.podRecipient || '')}</strong></span><br>
                                <img src="${matchedOrder.podSignature}" alt="Signature" style="max-height:46px; border:1px solid #e5e7eb; border-radius:4px; background:#fff; margin-top:2px;">
                            </div>
                        `;
                    }
                    metaEl.innerHTML = html;
                }
            } catch (_) {}
        }).observe(invContent, { childList: true });
    }

    const adminOrdersTab = document.getElementById('adminOrdersTab');
    if (adminOrdersTab && !document.getElementById('openWeighbridgeAdminBtn')) {
        const heading = adminOrdersTab.querySelector('h3');
        if (heading) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'openWeighbridgeAdminBtn';
            btn.className = 'pro-btn-gold';
            btn.style.marginTop = '8px';
            btn.innerHTML = `<i class="fa-solid fa-weight-scale"></i> إصدار تذكرة ميزان بسكول (صب / معبأ)`;
            btn.onclick = () => openWeighbridgeModal();
            heading.insertAdjacentElement('afterend', btn);
        }
    }

    const driverSection = document.getElementById('driverSection');
    if (driverSection && !document.getElementById('openWeighbridgeDriverBtn')) {
        const btnWrap = driverSection.querySelector('#driverUpdateGpsBtn')?.parentElement;
        if (btnWrap) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'openWeighbridgeDriverBtn';
            btn.className = 'pro-btn-emerald';
            btn.innerHTML = `<i class="fa-solid fa-weight-scale"></i> ${tr('تذكرة ميزان بسكول', 'Weighbridge Ticket')}`;
            btn.onclick = () => openWeighbridgeModal();
            btnWrap.appendChild(btn);
        }
    }
}

function openWeighbridgeModal() {
    document.getElementById('proWeighbridgeModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'proWeighbridgeModal';
    modal.className = 'pro-modal-backdrop';
    modal.innerHTML = `
        <div class="pro-modal-box" style="max-width:480px;">
            <div class="pro-modal-head">
                <h3 style="margin:0; font-size:1rem;"><i class="fa-solid fa-weight-scale" style="color:#d4af37;"></i> ${tr('تذكرة الميزان البسكول الرقمية', 'Digital Weighbridge Scale Ticket')}</h3>
                <button type="button" id="closeWbModalBtn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">&times;</button>
            </div>
            <div class="pro-modal-body">
                <div class="input-group">
                    <label>${tr('رقم الطلب / الفاتورة (اختياري للربط المباشر)', 'Order / Invoice ID (Optional)')}</label>
                    <input type="text" id="wbOrderIdInput" placeholder="مثال: 8f3a1c">
                </div>
                <div class="input-group">
                    <label>${tr('رقم لوحة السيارة', 'Vehicle Plate Number')}</label>
                    <input type="text" id="wbPlateInput" placeholder="مثال: ر و م 1234" required>
                </div>
                <div style="display:flex; gap:10px;">
                    <div class="input-group" style="flex:1;">
                        <label>${tr('الوزن القائم محمّل (كجم)', 'Gross Loaded Weight (kg)')}</label>
                        <input type="number" id="wbGrossInput" min="1" placeholder="12500">
                    </div>
                    <div class="input-group" style="flex:1;">
                        <label>${tr('الوزن الفارغ (كجم)', 'Tare Empty Weight (kg)')}</label>
                        <input type="number" id="wbTareInput" min="0" placeholder="4500">
                    </div>
                </div>
                <div id="wbNetPreview" style="background:#f0f7f4; border:1.5px solid #173627; border-radius:12px; padding:12px; text-align:center; margin-top:8px;">
                    <span style="font-size:0.82rem; color:#555;">${tr('الوزن الصافي المحسوب تلقائياً', 'Calculated Net Weight')}</span>
                    <strong id="wbNetKgDisplay" style="display:block; font-size:1.4rem; color:#173627;">0 ${tr('كجم', 'kg')} (0.000 ${tr('طن', 'Ton')})</strong>
                    <small id="wbBagsDisplay" style="color:#15803d; font-weight:700;">0 ${tr('شكارة (50 كجم)', 'bags (50kg)')}</small>
                </div>
            </div>
            <div class="pro-modal-foot">
                <button type="button" id="saveWbTicketBtn" class="pro-btn-gold" style="width:100%; justify-content:center;">
                    <i class="fa-solid fa-print"></i> ${tr('اعتماد وحفظ تذكرة الميزان', 'Save & Issue Scale Ticket')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const calcNet = () => {
        const gross = Number(document.getElementById('wbGrossInput')?.value || 0);
        const tare = Number(document.getElementById('wbTareInput')?.value || 0);
        const net = Math.max(0, gross - tare);
        const tons = (net / 1000).toFixed(3);
        const bags = Math.round(net / 50);
        document.getElementById('wbNetKgDisplay').textContent = `${net.toLocaleString()} ${tr('كجم', 'kg')} (${tons} ${tr('طن', 'Ton')})`;
        document.getElementById('wbBagsDisplay').textContent = `${bags.toLocaleString()} ${tr('شكارة (50 كجم)', 'bags (50kg)')}`;
        return { gross, tare, net };
    };

    document.getElementById('wbGrossInput')?.addEventListener('input', calcNet);
    document.getElementById('wbTareInput')?.addEventListener('input', calcNet);
    document.getElementById('closeWbModalBtn')?.addEventListener('click', () => modal.remove());

    document.getElementById('saveWbTicketBtn')?.addEventListener('click', async () => {
        const { gross, tare, net } = calcNet();
        const plate = (document.getElementById('wbPlateInput')?.value || '').trim();
        const shortOrderId = (document.getElementById('wbOrderIdInput')?.value || '').trim().replace(/^#/, '');

        if (!plate || net <= 0) {
            alert(tr('الرجاء إدخال رقم السيارة وأوزان صحيحة بحيث يكون الصافي أكبر من صفر.', 'Please enter valid plate and weights.'));
            return;
        }

        const btn = document.getElementById('saveWbTicketBtn');
        btn.disabled = true;

        try {
            const ticketRef = await addDoc(collection(db, "weighbridge_tickets"), {
                orderRef: shortOrderId,
                plate,
                grossKg: gross,
                tareKg: tare,
                netKg: net,
                netTons: Number((net / 1000).toFixed(3)),
                issuedBy: proUser ? proUser.email : 'system',
                createdAt: new Date().toISOString()
            });

            if (shortOrderId) {
                const ordersSnap = await getDocs(query(collection(db, "orders"), limit(120)));
                for (const d of ordersSnap.docs) {
                    if (d.id === shortOrderId || d.id.startsWith(shortOrderId)) {
                        await updateDoc(doc(db, "orders", d.id), {
                            weighbridgeNetKg: net,
                            weighbridgeTicketId: ticketRef.id
                        });
                    }
                }
            }

            alert(tr(
                `تم إصدار تذكرة الميزان #${ticketRef.id.slice(0, 6)} بنجاح! الوزن الصافي: ${net.toLocaleString()} كجم (${(net / 1000).toFixed(3)} طن).`,
                `Scale Ticket #${ticketRef.id.slice(0, 6)} issued! Net: ${net} kg.`
            ));
            modal.remove();
        } catch (err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
        }
    });
}

// ==========================================
// الإضافة 2: مُحسِّن خط سير السائق الذكي + التوقيع الإلكتروني (POD)
// ==========================================
function initDriverRouteAndPod() {
    const driverOrdersList = document.getElementById('driverOrdersList');
    if (!driverOrdersList) return;

    if (!document.getElementById('proDriverRouteBar')) {
        const bar = document.createElement('div');
        bar.id = 'proDriverRouteBar';
        bar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; background:#f0f7f4; padding:10px 12px; border-radius:10px; border:1px solid #cbd5e1; margin-bottom:12px;';
        bar.innerHTML = `
            <span style="font-size:0.84rem; color:#173627; font-weight:700;">
                <i class="fa-solid fa-route" style="color:#d4af37;"></i> ${tr('مُحسِّن خط السير الذكي (الأقرب أولاً)', 'Smart Route Optimizer (Nearest First)')}
            </span>
            <button type="button" id="optimizeDriverRouteBtn" class="pro-btn-emerald">
                <i class="fa-solid fa-arrow-down-short-wide"></i> ${tr('ترتيب حسب الأقرب لموقعي', 'Sort Nearest to Me')}
            </button>
        `;
        driverOrdersList.insertAdjacentElement('beforebegin', bar);
        document.getElementById('optimizeDriverRouteBtn')?.addEventListener('click', () => optimizeDriverCards(true));
    }

    new MutationObserver(() => {
        enhanceDriverOrderCards();
    }).observe(driverOrdersList, { childList: true });
}

function enhanceDriverOrderCards() {
    const list = document.getElementById('driverOrdersList');
    if (!list) return;

    list.querySelectorAll('.data-item').forEach(card => {
        if (card.querySelector('.pro-pod-btn')) return;

        const actionBtn = card.querySelector('button[onclick]');
        const onclickStr = actionBtn?.getAttribute('onclick') || '';
        const idMatch = onclickStr.match(/['"]([A-Za-z0-9_-]{10,})['"]/);
        const orderId = idMatch ? idMatch[1] : '';
        if (!orderId) return;

        card.dataset.orderId = orderId;

        const podBtn = document.createElement('button');
        podBtn.type = 'button';
        podBtn.className = 'pro-btn-gold pro-pod-btn';
        podBtn.style.marginTop = '8px';
        podBtn.innerHTML = `<i class="fa-solid fa-signature"></i> ${tr('توقيع الاستلام الإلكتروني (POD)', 'Electronic POD Signature')}`;
        podBtn.onclick = () => openSignaturePodModal(orderId);
        card.appendChild(podBtn);
    });

    optimizeDriverCards(false);
}

async function optimizeDriverCards(forceGeo) {
    const list = document.getElementById('driverOrdersList');
    if (!list) return;
    const cards = Array.from(list.querySelectorAll('.data-item[data-order-id]'));
    if (cards.length === 0) return;

    const getCoords = () => new Promise((resolve) => {
        if (!forceGeo && localStorage.getItem('omda_driver_lat')) {
            return resolve({
                lat: parseFloat(localStorage.getItem('omda_driver_lat')),
                lng: parseFloat(localStorage.getItem('omda_driver_lng'))
            });
        }
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            pos => {
                localStorage.setItem('omda_driver_lat', pos.coords.latitude);
                localStorage.setItem('omda_driver_lng', pos.coords.longitude);
                resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => resolve(null),
            { timeout: 6000 }
        );
    });

    const myPos = await getCoords();
    if (!myPos) return;

    const enriched = await Promise.all(cards.map(async (card) => {
        const oid = card.dataset.orderId;
        try {
            const snap = await getDoc(doc(db, "orders", oid));
            const o = snap.exists() ? snap.data() : {};
            const dist = (typeof o.lat === 'number' && typeof o.lng === 'number')
                ? calcDistKm(myPos.lat, myPos.lng, o.lat, o.lng)
                : 9999;

            let badge = card.querySelector('.pro-dist-badge');
            if (!badge && dist < 9000) {
                badge = document.createElement('span');
                badge.className = 'pro-dist-badge';
                badge.style.cssText = 'display:inline-block; background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:12px; font-size:0.76rem; font-weight:800; margin-top:4px;';
                card.insertAdjacentElement('afterbegin', badge);
            }
            if (badge && dist < 9000) {
                badge.innerHTML = `<i class="fa-solid fa-location-arrow"></i> ${tr('يبعد عنك:', 'Distance:')} ${dist.toFixed(1)} ${tr('كم', 'km')}`;
            }
            return { card, dist };
        } catch (_) {
            return { card, dist: 9999 };
        }
    }));

    enriched.sort((a, b) => a.dist - b.dist);
    enriched.forEach(item => list.appendChild(item.card));
}

function openSignaturePodModal(orderId) {
    document.getElementById('proPodModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'proPodModal';
    modal.className = 'pro-modal-backdrop';
    modal.innerHTML = `
        <div class="pro-modal-box" style="max-width:460px;">
            <div class="pro-modal-head">
                <h3 style="margin:0; font-size:1rem;"><i class="fa-solid fa-file-signature" style="color:#d4af37;"></i> ${tr('إثبات التسليم والتوقيع الإلكتروني', 'Electronic Proof of Delivery (POD)')}</h3>
                <button type="button" id="closePodBtn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">&times;</button>
            </div>
            <div class="pro-modal-body">
                <div class="input-group">
                    <label>${tr('اسم المستلم بالمزرعة / المخزن', 'Recipient Name at Farm / Warehouse')}</label>
                    <input type="text" id="podRecipientInput" placeholder="${tr('مثال: م. أحمد محمود - أمين المخزن', 'e.g. Farm Manager')}" required>
                </div>
                <label style="font-size:0.85rem; font-weight:700; color:#173627; display:block; margin-bottom:6px;">
                    ${tr('توقيع المستلم بإصبعه داخل الإطار:', 'Sign inside the box below:')}
                </label>
                <canvas id="podSignatureCanvas" class="pro-sig-canvas" width="400" height="170"></canvas>
                <div style="text-align:left; margin-top:6px;">
                    <button type="button" id="clearPodCanvasBtn" style="background:#fee2e2; color:#b91c1c; border:none; padding:5px 10px; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">
                        <i class="fa-solid fa-eraser"></i> ${tr('مسح التوقيع', 'Clear')}
                    </button>
                </div>
            </div>
            <div class="pro-modal-foot">
                <button type="button" id="submitPodBtn" class="pro-btn-gold" style="width:100%; justify-content:center;">
                    <i class="fa-solid fa-circle-check"></i> ${tr('اعتماد التوقيع وتأكيد التسليم النهائي', 'Confirm Delivery & Save Signature')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const canvas = document.getElementById('podSignatureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#173627';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    let drawing = false;
    let hasSigned = false;

    const getPt = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDraw = (e) => {
        drawing = true;
        hasSigned = true;
        const p = getPt(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    };
    const moveDraw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const p = getPt(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    };
    const endDraw = () => { drawing = false; };

    const closePodModal = () => {
        window.removeEventListener('mouseup', endDraw);
        window.removeEventListener('touchend', endDraw);
        modal.remove();
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw);

    document.getElementById('clearPodCanvasBtn')?.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSigned = false;
    });
    document.getElementById('closePodBtn')?.addEventListener('click', closePodModal);

    document.getElementById('submitPodBtn')?.addEventListener('click', async () => {
        const recipient = (document.getElementById('podRecipientInput')?.value || '').trim();
        if (!recipient) {
            alert(tr('الرجاء كتابة اسم المستلم أولاً.', 'Please enter recipient name.'));
            return;
        }
        if (!hasSigned) {
            alert(tr('الرجاء توقيع المستلم داخل المربع قبل التأكيد.', 'Please provide a signature first.'));
            return;
        }

        const btn = document.getElementById('submitPodBtn');
        btn.disabled = true;
        try {
            const sigDataUrl = canvas.toDataURL('image/png');
            await updateDoc(doc(db, "orders", orderId), {
                status: 'تم التسليم بنجاح',
                podSignature: sigDataUrl,
                podRecipient: recipient,
                podTimestamp: new Date().toISOString()
            });
            alert(tr('تم تسجيل التوقيع الإلكتروني وتأكيد تسليم الشحنة بنجاح!', 'POD Signature recorded and order marked delivered!'));
            closePodModal();
            document.getElementById('driverRefreshOrdersBtn')?.click();
        } catch (err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
        }
    });
}

// ==========================================
// الإضافة 3: حارس السقف الائتماني للآجل + كشف حساب واتساب بضغطة زر
// ==========================================
function initCreditGuardAndWhatsAppStatements() {
    const accTab = document.getElementById('adminAccountingTab');
    const accList = document.getElementById('adminAccountingList');

    if (accTab && !document.getElementById('proCreditLimitCard')) {
        const card = document.createElement('div');
        card.id = 'proCreditLimitCard';
        card.className = 'form-card';
        card.style.marginBottom = '18px';
        card.style.borderRight = '4px solid #d4af37';
        card.innerHTML = `
            <h3><i class="fa-solid fa-shield-halved" style="color:#d4af37;"></i> تحديد السقف الائتماني الأقصى للعميل (حارس الآجل)</h3>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                <div class="input-group" style="flex:1; min-width:180px; margin-bottom:0;">
                    <label>البريد الإلكتروني للعميل</label>
                    <input type="email" id="proCreditLimitEmail" placeholder="client@example.com">
                </div>
                <div class="input-group" style="flex:1; min-width:150px; margin-bottom:0;">
                    <label>الحد الأقصى للآجل (ج.م)</label>
                    <input type="number" id="proCreditLimitAmount" min="0" placeholder="مثال: 50000">
                </div>
                <button type="button" id="saveProCreditLimitBtn" class="pro-btn-emerald" style="height:40px;">
                    <i class="fa-solid fa-lock"></i> حفظ السقف الائتماني
                </button>
            </div>
        `;
        const summaryCards = document.getElementById('accountingSummaryCards');
        summaryCards?.insertAdjacentElement('afterend', card);

        document.getElementById('saveProCreditLimitBtn')?.addEventListener('click', async () => {
            const email = (document.getElementById('proCreditLimitEmail')?.value || '').trim().toLowerCase();
            const limitVal = Number(document.getElementById('proCreditLimitAmount')?.value || 0);
            if (!email) {
                alert('الرجاء إدخال البريد الإلكتروني للعميل.');
                return;
            }
            try {
                await setDoc(doc(db, "users", email), { creditLimit: limitVal }, { merge: true });
                alert(`تم تحديد السقف الائتماني للعميل (${email}) بمبلغ ${limitVal.toLocaleString()} ج.م بنجاح!`);
            } catch (err) {
                alert(err.message);
            }
        });
    }

    if (accList) {
        new MutationObserver(() => {
            accList.querySelectorAll('.data-item').forEach(item => {
                if (item.querySelector('.pro-btn-wa')) return;
                const text = item.textContent || '';
                const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                const phoneMatch = text.match(/01[0-9]{9}|\+20[0-9]{10}/);
                const email = emailMatch ? emailMatch[0] : '';
                const phone = phoneMatch ? phoneMatch[0].replace(/^\+/, '') : '';

                const waBtn = document.createElement('button');
                waBtn.type = 'button';
                waBtn.className = 'pro-btn-wa';
                waBtn.innerHTML = `<i class="fa-brands fa-whatsapp"></i> إرسال كشف الحساب واتساب`;
                waBtn.onclick = async () => {
                    let targetPhone = phone;
                    if (!targetPhone && email) {
                        try {
                            const uSnap = await getDoc(doc(db, "users", email));
                            if (uSnap.exists() && uSnap.data().phone) {
                                targetPhone = String(uSnap.data().phone).replace(/[^0-9]/g, '');
                            }
                        } catch (_) {}
                    }
                    if (targetPhone && targetPhone.startsWith('01')) targetPhone = '2' + targetPhone;

                    const cleanLines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5).join('%0A');
                    const msg = `*مؤسسة الإخلاص للأعلاف والحبوب - كشف حساب آجل*%0A-------------------------%0A${cleanLines}%0A-------------------------%0Aشكراً لتعاملكم معنا.`;
                    const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
                    window.open(waUrl, '_blank');
                };
                item.appendChild(waBtn);
            });
        }).observe(accList, { childList: true });
    }

    const paySelect = document.getElementById('paymentTypeSelect');
    const summaryCard = document.querySelector('#cartModal .cart-summary-card');
    if (paySelect && summaryCard && !document.getElementById('proCreditGuardStatus')) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'proCreditGuardStatus';
        statusDiv.style.display = 'none';
        paySelect.closest('.payment-method-box')?.insertAdjacentElement('afterend', statusDiv);

        const evaluateCredit = async () => {
            const isCredit = (paySelect.value || '').includes('آجل');
            if (!isCredit || !proUser) {
                statusDiv.style.display = 'none';
                statusDiv.dataset.exceeded = '0';
                return;
            }

            try {
                const [uSnap, ordSnap, paySnap] = await Promise.all([
                    getDoc(doc(db, "users", proUser.email)),
                    getDocs(query(collection(db, "orders"), where("userEmail", "==", proUser.email), limit(100))),
                    getDocs(query(collection(db, "credit_payments"), where("clientEmail", "==", proUser.email), limit(100)))
                ]);

                const creditLimit = uSnap.exists() && typeof uSnap.data().creditLimit === 'number'
                    ? uSnap.data().creditLimit
                    : 50000;

                let totalDebit = 0;
                ordSnap.forEach(d => {
                    const o = d.data();
                    if ((o.paymentType || '').includes('آجل')) totalDebit += Number(o.total || 0);
                });
                let totalPaid = 0;
                paySnap.forEach(d => {
                    totalPaid += Number(d.data().amount || 0);
                });

                const currentDebt = Math.max(0, totalDebit - totalPaid);
                const available = Math.max(0, creditLimit - currentDebt);
                const cartTotal = Number(document.getElementById('cartTotalPrice')?.textContent || 0);

                statusDiv.style.display = 'block';
                if (cartTotal > available) {
                    statusDiv.dataset.exceeded = '1';
                    statusDiv.className = 'pro-credit-alert';
                    statusDiv.innerHTML = `
                        <strong><i class="fa-solid fa-triangle-exclamation"></i> ${tr('تنبيه تجاوز السقف الائتماني:', 'Credit Limit Exceeded:')}</strong><br>
                        ${tr('الحد الائتماني:', 'Limit:')} ${creditLimit.toLocaleString()} | ${tr('المديونية الحالية:', 'Current Debt:')} ${currentDebt.toLocaleString()} | ${tr('المتاح للآجل:', 'Available:')} <strong>${available.toLocaleString()} ${tr('ج.م', 'EGP')}</strong>
                    `;
                } else {
                    statusDiv.dataset.exceeded = '0';
                    statusDiv.className = 'pro-credit-ok';
                    statusDiv.innerHTML = `
                        <i class="fa-solid fa-circle-check"></i> ${tr('الرصيد الائتماني المتاح يغطي الطلب:', 'Available credit covers order:')} <strong>${available.toLocaleString()} ${tr('ج.م', 'EGP')}</strong>
                    `;
                }
            } catch (_) {}
        };

        paySelect.addEventListener('change', evaluateCredit);
        const cartItemsList = document.getElementById('cartItemsList');
        if (cartItemsList) {
            new MutationObserver(evaluateCredit).observe(cartItemsList, { childList: true });
        }

        const checkoutBtn = document.getElementById('checkoutBtn');
        checkoutBtn?.addEventListener('click', (e) => {
            if (statusDiv.dataset.exceeded === '1' && (paySelect.value || '').includes('آجل')) {
                const proceedPending = confirm(tr(
                    'قيمة الطلب تتجاوز السقف الائتماني المتاح لحسابك! هل تريد إرسال الطلب كـ "معلّق بانتظار موافقة الإدارة الائتمانية"؟ (اضغط إلغاء لتغيير طريقة الدفع إلى نقدي)',
                    'Order exceeds your available credit limit! Submit as "Pending Credit Approval"? (Cancel to switch to Cash)'
                ));
                if (!proceedPending) {
                    e.stopImmediatePropagation();
                    paySelect.focus();
                } else {
                    const opt = paySelect.querySelector('option[value*="آجل"]');
                    if (opt) opt.value = 'آجل (بانتظار موافقة السقف الائتماني)';
                }
            }
        }, true);
    }
}

// ==========================================
// الإضافة 4: جدول الطلب السريع للجملة (Bulk Order Grid) + منبّه أسعار البورصة
// ==========================================
function initBulkOrderAndMarketAlerts() {
    const prodSectionTitle = document.querySelector('#productsSection .section-title');
    if (prodSectionTitle && !document.getElementById('openBulkOrderGridBtn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'openBulkOrderGridBtn';
        btn.className = 'pro-btn-gold';
        btn.style.marginTop = '10px';
        btn.innerHTML = `<i class="fa-solid fa-table-list"></i> ${tr('جدول الطلب السريع للجملة والمزارع (Bulk Order)', 'Quick Wholesale Bulk Order Grid')}`;
        btn.onclick = openBulkOrderGridModal;
        prodSectionTitle.appendChild(btn);
    }

    const marketSection = document.getElementById('marketPricesSection');
    if (marketSection && !document.getElementById('proMarketAlertCard')) {
        const card = document.createElement('div');
        card.id = 'proMarketAlertCard';
        card.className = 'form-card';
        card.style.marginTop = '18px';
        card.style.borderRight = '4px solid #d4af37';
        card.innerHTML = `
            <h3><i class="fa-solid fa-bell" style="color:#d4af37;"></i> ${tr('منبّه أسعار البورصة المستهدفة للشراء', 'Target Commodity Price Alert')}</h3>
            <p style="font-size:0.83rem; color:#666; margin-bottom:10px;">
                ${tr('حدد السعر المستهدف للطن وسينبهك النظام فور وصول سعر البورصة إليه.', 'Set your target price per ton and get alerted immediately when market rates hit it.')}
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                <div class="input-group" style="flex:1; min-width:160px; margin-bottom:0;">
                    <label>${tr('اسم الخامة', 'Commodity')}</label>
                    <input type="text" id="proAlertCommodityInput" placeholder="${tr('مثال: ذرة صفراء أو صويا', 'e.g. Yellow Corn')}">
                </div>
                <div class="input-group" style="flex:1; min-width:130px; margin-bottom:0;">
                    <label>${tr('السعر المستهدف للطن (ج.م)', 'Target Price / Ton (EGP)')}</label>
                    <input type="number" id="proAlertTargetPriceInput" min="1" placeholder="13500">
                </div>
                <button type="button" id="saveProMarketAlertBtn" class="pro-btn-emerald" style="height:40px;">
                    <i class="fa-solid fa-bell-plus"></i> ${tr('تفعيل التنبيه', 'Set Alert')}
                </button>
            </div>
            <div id="proTriggeredAlertsBox" style="margin-top:10px;"></div>
        `;
        marketSection.appendChild(card);

        document.getElementById('saveProMarketAlertBtn')?.addEventListener('click', async () => {
            const item = (document.getElementById('proAlertCommodityInput')?.value || '').trim();
            const targetPrice = Number(document.getElementById('proAlertTargetPriceInput')?.value || 0);
            if (!item || targetPrice <= 0) {
                alert(tr('الرجاء إدخال اسم الخامة والسعر المستهدف.', 'Enter commodity name and target price.'));
                return;
            }
            const alerts = JSON.parse(localStorage.getItem('omda_price_alerts') || '[]');
            alerts.push({ item, targetPrice, createdAt: new Date().toISOString() });
            localStorage.setItem('omda_price_alerts', JSON.stringify(alerts));

            if (proUser) {
                try {
                    await addDoc(collection(db, "price_alerts"), {
                        userEmail: proUser.email,
                        commodity: item,
                        targetPrice,
                        createdAt: new Date().toISOString()
                    });
                } catch (_) {}
            }
            alert(tr(`تم تفعيل منبّه السعر لـ (${item}) عند ${targetPrice.toLocaleString()} ج.م/طن!`, `Price alert saved for ${item} at ${targetPrice} EGP/ton!`));
            checkTriggeredMarketAlerts();
        });

        checkTriggeredMarketAlerts();
    }
}

async function checkTriggeredMarketAlerts() {
    const box = document.getElementById('proTriggeredAlertsBox');
    if (!box) return;
    const alerts = JSON.parse(localStorage.getItem('omda_price_alerts') || '[]');
    if (alerts.length === 0) return;

    try {
        const snap = await getDocs(query(collection(db, "market_prices"), limit(40)));
        proMarketCache = [];
        snap.forEach(d => proMarketCache.push(d.data()));

        const hits = [];
        alerts.forEach(a => {
            const match = proMarketCache.find(m =>
                (m.nameAr || '').includes(a.item) || (m.nameEn || '').toLowerCase().includes(a.item.toLowerCase())
            );
            if (match && Number(match.price) <= Number(a.targetPrice)) {
                hits.push(`<strong>${esc(match.nameAr || match.nameEn)}</strong> وصل إلى <strong>${Number(match.price).toLocaleString()} ${tr('ج.م', 'EGP')}</strong> (هدفك: ${Number(a.targetPrice).toLocaleString()})`);
            }
        });

        if (hits.length > 0) {
            box.innerHTML = `
                <div style="background:#dcfce7; border:1.5px solid #16a34a; color:#14532d; padding:10px 12px; border-radius:10px; font-size:0.84rem;">
                    <strong><i class="fa-solid fa-bullhorn"></i> ${tr('فرصة شراء! الأسعار وصلت لهدفك:', 'Target Price Hit!')}</strong>
                    <ul style="margin:5px 0 0 18px;">${hits.map(h => `<li>${h}</li>`).join('')}</ul>
                </div>
            `;
        }
    } catch (_) {}
}

async function openBulkOrderGridModal() {
    document.getElementById('proBulkOrderModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'proBulkOrderModal';
    modal.className = 'pro-modal-backdrop';
    modal.innerHTML = `
        <div class="pro-modal-box">
            <div class="pro-modal-head">
                <h3 style="margin:0; font-size:1rem;"><i class="fa-solid fa-boxes-stacked" style="color:#d4af37;"></i> ${tr('جدول الطلب السريع للجملة والمزارع', 'Wholesale Bulk Order Grid')}</h3>
                <button type="button" id="closeBulkModalBtn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">&times;</button>
            </div>
            <div class="pro-modal-body">
                <input type="text" id="bulkSearchInput" placeholder="${tr('ابحث باسم العلف أو الحبوب...', 'Filter products...')}" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:10px;">
                <div id="bulkGridContainer" style="overflow-x:auto;">
                    <p style="text-align:center; color:#666;">${tr('جاري تحميل قائمة المنتجات...', 'Loading products...')}</p>
                </div>
            </div>
            <div class="pro-modal-foot">
                <div>
                    <strong style="color:#173627; display:block;" id="bulkSummaryLine">0 ${tr('شكارة', 'bags')} (0 ${tr('طن', 'Ton')})</strong>
                    <span style="color:#15803d; font-weight:800; font-size:0.95rem;" id="bulkTotalPriceLine">0 ${tr('ج.م', 'EGP')}</span>
                </div>
                <button type="button" id="confirmBulkAddBtn" class="pro-btn-gold">
                    <i class="fa-solid fa-cart-plus"></i> ${tr('إضافة الكميات للسلة دفعة واحدة', 'Add All to Cart')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeBulkModalBtn')?.addEventListener('click', () => modal.remove());

    try {
        if (proProductsCache.length === 0) {
            const snap = await getDocs(query(collection(db, "products"), limit(120)));
            snap.forEach(d => proProductsCache.push({ id: d.id, ...d.data() }));
        }

        const quantities = {};
        const renderTable = (filterTerm = '') => {
            const filtered = proProductsCache.filter(p =>
                !filterTerm ||
                (p.name || '').toLowerCase().includes(filterTerm) ||
                (p.nameEn || '').toLowerCase().includes(filterTerm)
            );
            const rowsHtml = filtered.map(p => {
                const qty = quantities[p.id] || 0;
                const price = Number(p.price || 0);
                return `
                    <tr>
                        <td>
                            <strong style="color:#173627;">${esc(isEn() && p.nameEn ? p.nameEn : p.name)}</strong><br>
                            <small style="color:#64748b;">${price.toLocaleString()} ${tr('ج.م / وحدة', 'EGP / unit')}</small>
                        </td>
                        <td>
                            <div class="pro-qty-stepper">
                                <button type="button" data-act="dec" data-id="${esc(p.id)}">-</button>
                                <input type="number" min="0" value="${qty}" data-id="${esc(p.id)}" class="bulk-qty-input">
                                <button type="button" data-act="inc" data-id="${esc(p.id)}">+</button>
                                <button type="button" data-act="ton" data-id="${esc(p.id)}" style="background:#dcfce7; color:#15803d; font-size:0.75rem;">+20</button>
                            </div>
                        </td>
                        <td style="font-weight:800; color:#173627;">${(qty * price).toLocaleString()}</td>
                    </tr>
                `;
            }).join('');

            document.getElementById('bulkGridContainer').innerHTML = `
                <table class="pro-bulk-table">
                    <thead>
                        <tr>
                            <th>${tr('الصنف', 'Product')}</th>
                            <th>${tr('الكمية (شكارة)', 'Qty (Bags)')}</th>
                            <th>${tr('الإجمالي', 'Subtotal')}</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
            updateBulkTotals();
        };

        const updateBulkTotals = () => {
            let totalBags = 0;
            let totalCost = 0;
            proProductsCache.forEach(p => {
                const q = Number(quantities[p.id] || 0);
                if (q > 0) {
                    totalBags += q;
                    totalCost += q * Number(p.price || 0);
                }
            });
            const tons = ((totalBags * 50) / 1000).toFixed(2);
            document.getElementById('bulkSummaryLine').textContent = `${totalBags} ${tr('شكارة', 'bags')} (~${tons} ${tr('طن', 'Ton')})`;
            document.getElementById('bulkTotalPriceLine').textContent = `${totalCost.toLocaleString()} ${tr('ج.م', 'EGP')}`;
        };

        renderTable();

        document.getElementById('bulkSearchInput')?.addEventListener('input', (e) => {
            renderTable((e.target.value || '').trim().toLowerCase());
        });

        document.getElementById('bulkGridContainer')?.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-act]');
            if (!btn) return;
            const id = btn.dataset.id;
            const act = btn.dataset.act;
            const cur = Number(quantities[id] || 0);
            if (act === 'inc') quantities[id] = cur + 1;
            if (act === 'dec') quantities[id] = Math.max(0, cur - 1);
            if (act === 'ton') quantities[id] = cur + 20;
            renderTable((document.getElementById('bulkSearchInput')?.value || '').trim().toLowerCase());
        });

        document.getElementById('bulkGridContainer')?.addEventListener('change', (e) => {
            if (!e.target.classList.contains('bulk-qty-input')) return;
            const id = e.target.dataset.id;
            quantities[id] = Math.max(0, parseInt(e.target.value, 10) || 0);
            renderTable((document.getElementById('bulkSearchInput')?.value || '').trim().toLowerCase());
        });

        document.getElementById('confirmBulkAddBtn')?.addEventListener('click', () => {
            let addedCount = 0;
            proProductsCache.forEach(p => {
                const q = Number(quantities[p.id] || 0);
                if (q > 0 && typeof window.addToCartDirect === 'function') {
                    // تمرير كائن المنتج الكامل للحفاظ على الصورة والاسم الإنجليزي داخل السلة
                    const fullProduct = { ...p, price: Number(p.price || 0) };
                    for (let i = 0; i < q; i++) {
                        window.addToCartDirect(fullProduct);
                        addedCount++;
                    }
                }
            });
            if (addedCount === 0) {
                alert(tr('الرجاء تحديد كمية لصنف واحد على الأقل.', 'Please select quantity for at least one product.'));
                return;
            }
            modal.remove();
            alert(tr(`تمت إضافة (${addedCount}) وحدة إلى سلة المشتريات بنجاح!`, `Added (${addedCount}) items to your cart!`));
            if (typeof window.openCartModal === 'function') window.openCartModal();
        });
    } catch (err) {
        document.getElementById('bulkGridContainer').innerHTML = `<p style="color:#dc2626;">${esc(err.message)}</p>`;
    }
}

// ==========================================
// الإضافة 5: حاسبة معامل التحويل الغذائي (FCR) وتقييم جودة الدفعة وعرضه في الإدارة
// ==========================================
function initFcrAndOrderRatings() {
    const profileSection = document.getElementById('profileSection');
    if (profileSection && !document.getElementById('proFcrCalculatorCard')) {
        const card = document.createElement('div');
        card.id = 'proFcrCalculatorCard';
        card.className = 'profile-box';
        card.style.marginTop = '20px';
        card.style.borderTop = '4px solid #173627';
        card.innerHTML = `
            <h3><i class="fa-solid fa-chart-simple" style="color:#d4af37;"></i> ${tr('حاسبة معامل التحويل الغذائي (FCR) وتقييم كفاءة العلف', 'Feed Conversion Ratio (FCR) Calculator')}</h3>
            <p style="font-size:0.84rem; color:#666; margin-bottom:12px;">
                ${tr('احسب كفاءة تحويل العلف إلى لحم في مزرعتك وقارنها بالمعدل القياسي لعلف الإخلاص.', 'Calculate how efficiently your flock converts feed into weight gain compared to standard benchmarks.')}
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <div class="input-group" style="flex:1; min-width:150px;">
                    <label>${tr('نوع القطيع', 'Livestock Type')}</label>
                    <select id="fcrSpeciesSelect">
                        <option value="broiler" data-target="1.55">${tr('دواجن تسمين (القياسي: 1.50 - 1.60)', 'Broiler Poultry (Target: 1.55)')}</option>
                        <option value="fish" data-target="1.35">${tr('أسماك بلطي طافي (القياسي: 1.25 - 1.40)', 'Tilapia Fish (Target: 1.35)')}</option>
                        <option value="cattle" data-target="6.20">${tr('تسمين عجول (القياسي: 5.8 - 6.5)', 'Beef Cattle (Target: 6.20)')}</option>
                        <option value="sheep" data-target="4.80">${tr('أغنام وماعز (القياسي: 4.5 - 5.2)', 'Sheep & Goats (Target: 4.80)')}</option>
                    </select>
                </div>
                <div class="input-group" style="flex:1; min-width:140px;">
                    <label>${tr('إجمالي العلف المستهلك (كجم)', 'Total Feed Consumed (kg)')}</label>
                    <input type="number" id="fcrFeedKgInput" min="1" placeholder="3200">
                </div>
                <div class="input-group" style="flex:1; min-width:140px;">
                    <label>${tr('إجمالي الوزن الحي الناتج (كجم)', 'Total Live Weight Gain (kg)')}</label>
                    <input type="number" id="fcrWeightGainInput" min="1" placeholder="2050">
                </div>
            </div>
            <button type="button" id="calcFcrBtn" class="pro-btn-emerald">
                <i class="fa-solid fa-calculator"></i> ${tr('احسب معامل التحويل (FCR)', 'Calculate FCR')}
            </button>
            <div id="fcrResultBox" style="display:none; margin-top:12px; padding:12px; border-radius:10px; background:#f0f7f4; border:1px dashed #173627;"></div>
        `;
        profileSection.appendChild(card);

        document.getElementById('calcFcrBtn')?.addEventListener('click', () => {
            const sel = document.getElementById('fcrSpeciesSelect');
            const target = parseFloat(sel?.options[sel.selectedIndex]?.dataset.target || '1.55');
            const feedKg = Number(document.getElementById('fcrFeedKgInput')?.value || 0);
            const gainKg = Number(document.getElementById('fcrWeightGainInput')?.value || 0);

            if (feedKg <= 0 || gainKg <= 0) {
                alert(tr('الرجاء إدخال كمية العلف والوزن الناتج بشكل صحيح.', 'Enter valid feed and weight gain values.'));
                return;
            }

            const fcr = feedKg / gainKg;
            const isExcellent = fcr <= target;
            const isGood = fcr <= target * 1.12;
            const verdict = isExcellent
                ? tr('ممتاز! أعلى كفاءة تحويل وأقل تكلفة للكيلو لحم.', 'Excellent! Peak feed efficiency & lowest cost per kg.')
                : isGood
                    ? tr('جيد جداً ضمن المعدل الطبيعي للتربية.', 'Very Good, within standard farm range.')
                    : tr('مرتفع نسبياً — يُنصح بمراجعة التهوية ودرجات الحرارة وبرنامج التغذية.', 'Slightly high — review farm ventilation & feeding program.');

            const resBox = document.getElementById('fcrResultBox');
            resBox.style.display = 'block';
            resBox.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <span style="font-size:0.82rem; color:#555;">${tr('معامل التحويل الفعلي لمزرعتك:', 'Your Farm Actual FCR:')}</span>
                        <strong style="font-size:1.35rem; color:${isExcellent ? '#15803d' : '#d97706'}; display:block;">${fcr.toFixed(2)}</strong>
                    </div>
                    <div style="text-align:left;">
                        <span style="font-size:0.8rem; color:#555;">${tr('المعدل القياسي المستهدف:', 'Benchmark Target:')} <strong>${target.toFixed(2)}</strong></span>
                    </div>
                </div>
                <p style="margin-top:6px; font-size:0.84rem; font-weight:700; color:#173627;">${verdict}</p>
            `;
        });
    }

    const userInvoicesList = document.getElementById('userInvoicesList');
    if (userInvoicesList) {
        new MutationObserver(() => {
            userInvoicesList.querySelectorAll('button[onclick^="previewInvoice"]').forEach(btn => {
                const parent = btn.parentElement;
                if (!parent || parent.querySelector('.pro-rate-order-btn')) return;
                if (!parent.textContent.includes('تم التسليم')) return;

                const match = btn.getAttribute('onclick')?.match(/previewInvoice\(['"]([^'"]+)['"]\)/);
                const orderId = match ? match[1] : '';
                if (!orderId) return;

                const rateBtn = document.createElement('button');
                rateBtn.type = 'button';
                rateBtn.className = 'pro-btn-emerald pro-rate-order-btn';
                rateBtn.style.cssText = 'padding:5px 10px; font-size:0.8rem; margin-inline-start:6px; margin-top:5px;';
                rateBtn.innerHTML = `<i class="fa-solid fa-star" style="color:#d4af37;"></i> ${tr('تقييم الجودة والتوصيل', 'Rate Delivery')}`;
                rateBtn.onclick = () => openOrderRatingModal(orderId);
                btn.insertAdjacentElement('afterend', rateBtn);
            });
        }).observe(userInvoicesList, { childList: true });
    }

    // زر وعارض سجل تقييمات وتعليقات العملاء في تبويب طلبات الإدارة
    const adminOrdersTab = document.getElementById('adminOrdersTab');
    if (adminOrdersTab && !document.getElementById('openAdminRatingsBtn')) {
        const anchorBtn = document.getElementById('openWeighbridgeAdminBtn') || adminOrdersTab.querySelector('h3');
        if (anchorBtn) {
            const ratingsBtn = document.createElement('button');
            ratingsBtn.type = 'button';
            ratingsBtn.id = 'openAdminRatingsBtn';
            ratingsBtn.className = 'pro-btn-emerald';
            ratingsBtn.style.marginTop = '8px';
            ratingsBtn.style.marginInlineStart = '8px';
            ratingsBtn.innerHTML = `<i class="fa-solid fa-star" style="color:#d4af37;"></i> تقييمات وتعليقات العملاء`;
            ratingsBtn.onclick = openAdminRatingsViewerModal;
            anchorBtn.insertAdjacentElement('afterend', ratingsBtn);
        }
    }

    // عرض تقييم وتعليق العميل مباشرة داخل بطاقة الطلب في قائمة الإدارة
    const adminOrdersList = document.getElementById('adminOrdersList');
    if (adminOrdersList) {
        let ratingsByOrderCache = null;
        new MutationObserver(async () => {
            const cards = adminOrdersList.querySelectorAll('.data-item');
            if (cards.length === 0) return;

            try {
                if (!ratingsByOrderCache) {
                    const snap = await getDocs(query(collection(db, "order_ratings"), limit(150)));
                    ratingsByOrderCache = {};
                    snap.forEach(d => {
                        const r = d.data();
                        if (r.orderId) ratingsByOrderCache[r.orderId] = r;
                    });
                }

                cards.forEach(card => {
                    if (card.querySelector('.pro-admin-rating-inline')) return;
                    const previewBtn = card.querySelector('button[onclick^="previewInvoice"]');
                    const match = previewBtn?.getAttribute('onclick')?.match(/previewInvoice\(['"]([^'"]+)['"]\)/);
                    const fullOrderId = match ? match[1] : '';
                    const rating = fullOrderId ? ratingsByOrderCache[fullOrderId] : null;
                    if (!rating) return;

                    const starsCount = Math.min(5, Math.max(1, Number(rating.stars || 5)));
                    const starsStr = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
                    const badge = document.createElement('div');
                    badge.className = 'pro-admin-rating-inline';
                    badge.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong><i class="fa-solid fa-star" style="color:#f59e0b;"></i> تقييم العميل:</strong>
                            <span style="color:#d97706; font-size:1rem; letter-spacing:1px;">${starsStr} (${starsCount}/5)</span>
                        </div>
                        ${rating.note ? `<div style="margin-top:4px; color:#1e293b;">"${esc(rating.note)}"</div>` : ''}
                    `;
                    card.appendChild(badge);
                });
            } catch (_) {}
        }).observe(adminOrdersList, { childList: true });
    }
}

function openOrderRatingModal(orderId) {
    document.getElementById('proRatingModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'proRatingModal';
    modal.className = 'pro-modal-backdrop';
    modal.innerHTML = `
        <div class="pro-modal-box" style="max-width:420px;">
            <div class="pro-modal-head">
                <h3 style="margin:0; font-size:1rem;"><i class="fa-solid fa-star" style="color:#d4af37;"></i> ${tr('تقييم جودة العلف والتوصيل', 'Rate Feed Quality & Delivery')}</h3>
                <button type="button" id="closeRatingModalBtn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">&times;</button>
            </div>
            <div class="pro-modal-body" style="text-align:center;">
                <p style="font-size:0.86rem; color:#475569; margin-bottom:10px;">${tr('رأيك يساعدنا على الحفاظ على أعلى جودة لأعلاف الإخلاص', 'Your feedback helps us maintain top feed quality')}</p>
                <div id="proStarsRow" style="margin-bottom:12px;">
                    ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="pro-star-btn active" data-val="${n}"><i class="fa-solid fa-star"></i></button>`).join('')}
                </div>
                <textarea id="proRatingNoteInput" rows="3" placeholder="${tr('اكتب ملاحظاتك حول جودة الشكاير والتزام السائق (اختياري)...', 'Optional notes on feed quality & driver...')}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;"></textarea>
            </div>
            <div class="pro-modal-foot">
                <button type="button" id="submitOrderRatingBtn" class="pro-btn-gold" style="width:100%; justify-content:center;">
                    <i class="fa-solid fa-paper-plane"></i> ${tr('إرسال التقييم', 'Submit Rating')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    let selectedStars = 5;
    modal.querySelectorAll('.pro-star-btn').forEach(star => {
        star.addEventListener('click', () => {
            selectedStars = Number(star.dataset.val);
            modal.querySelectorAll('.pro-star-btn').forEach(s => {
                s.classList.toggle('active', Number(s.dataset.val) <= selectedStars);
            });
        });
    });

    document.getElementById('closeRatingModalBtn')?.addEventListener('click', () => modal.remove());
    document.getElementById('submitOrderRatingBtn')?.addEventListener('click', async () => {
        const note = (document.getElementById('proRatingNoteInput')?.value || '').trim();
        try {
            await addDoc(collection(db, "order_ratings"), {
                orderId,
                userEmail: proUser ? proUser.email : '',
                stars: selectedStars,
                note,
                createdAt: new Date().toISOString()
            });
            await updateDoc(doc(db, "orders", orderId), { customerRating: selectedStars });
            alert(tr('شكراً لك! تم تسجيل تقييمك بنجاح.', 'Thank you! Your rating has been recorded.'));
            modal.remove();
        } catch (err) {
            alert(err.message);
        }
    });
}

async function openAdminRatingsViewerModal() {
    document.getElementById('proAdminRatingsModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'proAdminRatingsModal';
    modal.className = 'pro-modal-backdrop';
    modal.innerHTML = `
        <div class="pro-modal-box">
            <div class="pro-modal-head">
                <h3 style="margin:0; font-size:1rem;"><i class="fa-solid fa-star" style="color:#d4af37;"></i> سجل تقييمات وتعليقات العملاء</h3>
                <button type="button" id="closeAdminRatingsBtn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">&times;</button>
            </div>
            <div class="pro-modal-body" id="adminRatingsListBody">
                <p style="text-align:center; color:#666;">جاري تحميل تقييمات العملاء...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeAdminRatingsBtn')?.addEventListener('click', () => modal.remove());

    const bodyEl = document.getElementById('adminRatingsListBody');
    try {
        const snap = await getDocs(query(collection(db, "order_ratings"), limit(120)));
        if (snap.empty) {
            bodyEl.innerHTML = `<p style="text-align:center; color:#64748b; padding:20px;">لا توجد تقييمات مسجلة من العملاء حتى الآن.</p>`;
            return;
        }

        const list = [];
        let sumStars = 0;
        snap.forEach(d => {
            const r = d.data();
            sumStars += Number(r.stars || 5);
            list.push({ id: d.id, ...r });
        });
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const avg = (sumStars / list.length).toFixed(1);
        const cardsHtml = list.map(r => {
            const starsCount = Math.min(5, Math.max(1, Number(r.stars || 5)));
            const starsHtml = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
            const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : '';
            return `
                <div style="background:#f8faf9; border:1px solid #e2e8f0; border-right:4px solid #d4af37; border-radius:10px; padding:12px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                        <strong style="color:#173627; font-size:0.86rem;">طلب #${esc((r.orderId || '').slice(0, 6))} — ${esc(r.userEmail || 'عميل')}</strong>
                        <span style="color:#f59e0b; font-size:1.05rem; letter-spacing:1px;">${starsHtml}</span>
                    </div>
                    <p style="margin:6px 0 4px; font-size:0.88rem; color:#1e293b; background:#fff; padding:8px 10px; border-radius:8px; border:1px solid #f1f5f9;">
                        ${r.note ? esc(r.note) : '<span style="color:#94a3b8;">(تقييم بالنجوم بدون تعليق مكتوب)</span>'}
                    </p>
                    <small style="color:#64748b; font-size:0.75rem;">بتاريخ: ${esc(dateStr)}</small>
                </div>
            `;
        }).join('');

        bodyEl.innerHTML = `
            <div style="background:#173627; color:#fff; padding:10px 14px; border-radius:10px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                <span>إجمالي التقييمات: <strong>${list.length}</strong></span>
                <span>متوسط الرضا العام: <strong style="color:#d4af37; font-size:1.1rem;">${avg} / 5 ★</strong></span>
            </div>
            ${cardsHtml}
        `;
    } catch (err) {
        bodyEl.innerHTML = `<p style="color:#dc2626;">خطأ في جلب التقييمات: ${esc(err.message)}</p>`;
    }
}

// ==========================================
// التشغيل التلقائي الآمن للنواة الاحترافية
// ==========================================
onAuthStateChanged(auth, (user) => {
    proUser = user || null;
});

function bootstrapOmdaProCore() {
    injectProStyles();
    initInvoiceQrAndWeighbridge();
    initDriverRouteAndPod();
    initCreditGuardAndWhatsAppStatements();
    initBulkOrderAndMarketAlerts();
    initFcrAndOrderRatings();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapOmdaProCore);
} else {
    bootstrapOmdaProCore();
}
