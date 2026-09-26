// ==========================================
// بيانات المنيو الأساسية مع صور تفصيلية للمشويات
// ==========================================
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
let cart = JSON.parse(localStorage.getItem('omda_cart') || '[]');
let currentCustomer = JSON.parse(localStorage.getItem('omda_current_cust') || 'null');
let favorites = JSON.parse(localStorage.getItem('omda_favorites') || '[]');
let activeDiscount = 0;

let customerLat = null;
let customerLng = null;
let restaurantCoords = JSON.parse(localStorage.getItem('omda_restaurant_coords') || '[30.005, 31.185]');

let map;
let streetLayer, topoLayer, satelliteLayer;
let markersLayer, polylinesLayer, driversLayer, branchesLayer;
let activeRoutingControl = null;
let currentFilter = 'all';
let previousOrdersCount = 0;
let watchId = null;
let pickingBranchMode = false;
let pickingDriverMode = false;

let peerConnection = null;
let localStream = null;
let ringingInterval = null;
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ==========================================
// نظام سليدر العروض والمنتجات المتحرك (كل 3 ثواني)
// ==========================================
let currentSliderIndex = 0;
let sliderInterval = null;
let currentSliderProduct = null;

function initHeroSlider() {
    if (!window.menuProducts || menuProducts.length === 0) return;
    updateSliderContent();
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        currentSliderIndex = (currentSliderIndex + 1) % menuProducts.length;
        updateSliderContent();
    }, 3000);
}

function updateSliderContent() {
    if (!window.menuProducts || menuProducts.length === 0) return;
    const prod = menuProducts[currentSliderIndex];
    currentSliderProduct = prod;

    const nameEl = document.getElementById('slider-prod-name');
    const descEl = document.getElementById('slider-prod-desc');
    const priceEl = document.getElementById('slider-prod-price');
    const imgEl = document.getElementById('slider-prod-img');

    if (nameEl) nameEl.innerText = `👑 ${prod.name}`;
    if (descEl) descEl.innerText = prod.desc;
    if (priceEl) priceEl.innerText = `${prod.price} جنيه`;
    if (imgEl) imgEl.src = prod.media || prod.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
}

function sliderClickAction() {
    if (currentSliderProduct) {
        window.location.href = `product.html?id=${currentSliderProduct.id}`;
    }
}

function sliderAddToCart() {
    if (currentSliderProduct && typeof addToCart === 'function') {
        addToCart(currentSliderProduct.id);
    }
}

// ==========================================
// نظام جلب موقع العميل عبر GPS
// ==========================================
function fetchCustomerGpsLocation() {
    const statusEl = document.getElementById('customer-gps-status');
    if(!navigator.geolocation) {
        if(statusEl) statusEl.innerText = "❌ متصفحك لا يدعم تحديد الموقع الجغرافي.";
        alert("متصفحك لا يدعم تحديد الموقع الجغرافي GPS.");
        return;
    }

    if(statusEl) statusEl.innerText = "⏳ جاري تحديد موقعك بدقة عبر الأقمار الصناعية والشبكة...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            customerLat = position.coords.latitude;
            customerLng = position.coords.longitude;
            if(statusEl) statusEl.innerText = `✓ تم تحديد موقعك بدقة بنجاح! (${customerLat.toFixed(4)}, ${customerLng.toFixed(4)})`;
            alert("✓ تم تحديد موقع الاستلام بدقة بنجاح!");
        },
        (error) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    customerLat = position.coords.latitude;
                    customerLng = position.coords.longitude;
                    if(statusEl) statusEl.innerText = `✓ تم تحديد موقعك بنجاح عبر الشبكة! (${customerLat.toFixed(4)}, ${customerLng.toFixed(4)})`;
                    alert("✓ تم تحديد موقع الاستلام بنجاح!");
                },
                (err2) => {
                    if(statusEl) statusEl.innerText = "❌ تعذر تحديد الموقع. تأكد من تفعيل صلاحية الـ GPS.";
                    alert("تعذر تحديد موقعك: تأكد من إعطاء إذن الموقع للمتصفح أو تفعيل الـ GPS في هاتفك.");
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
            );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

// ==========================================
// نظام نغمة الرنين والاتصال (WebRTC)
// ==========================================
function startRingingTone() {
    if (ringingInterval) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        ringingInterval = setInterval(() => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
        }, 1200);
    } catch(e) { console.log('Audio error:', e); }
}

function stopRingingTone() {
    if (ringingInterval) {
        clearInterval(ringingInterval);
        ringingInterval = null;
    }
}

function playAlertSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

async function initiateWebRtcCall(orderId, customerPhone, isVideo = true) {
    const modal = document.getElementById('callModal');
    const title = document.getElementById('callStatusTitle');
    const info = document.getElementById('callOrderInfo');
    if(!modal) return;

    modal.classList.remove('hidden');
    title.innerText = isVideo ? "🎥 مكالمة فيديو مباشرة مع العميل" : "📞 مكالمة صوتية مباشرة مع العميل";
    info.innerText = `رقم الطلب: ${orderId} | هاتف العميل: ${customerPhone}`;

    startRingingTone();

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
        const localVid = document.getElementById('localVideo');
        if(localVid) localVid.srcObject = localStream;

        peerConnection = new RTCPeerConnection(rtcConfig);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = event => {
            stopRingingTone();
            const remoteVid = document.getElementById('remoteVideo');
            if(remoteVid) remoteVid.srcObject = event.streams[0];
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        localStorage.setItem('omda_webrtc_signal', JSON.stringify({
            type: 'offer',
            orderId,
            sdp: offer,
            isVideo,
            timestamp: Date.now()
        }));

    } catch(err) {
        alert("تعذر الوصول للكاميرا أو الميكروفون: " + err.message);
        endWebRtcCall();
    }
}

function endWebRtcCall() {
    stopRingingTone();
    if(localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
    }
    if(peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    const modal = document.getElementById('callModal');
    if(modal) modal.classList.add('hidden');
    localStorage.removeItem('omda_webrtc_signal');
}

window.addEventListener('storage', async (e) => {
    if(e.key === 'omda_webrtc_signal' && e.newValue) {
        const signal = JSON.parse(e.newValue);
        if(signal.type === 'offer') {
            const modal = document.getElementById('callModal');
            const info = document.getElementById('callOrderInfo');
            const answerBtn = document.getElementById('answerCallBtn');
            if(modal && info) {
                modal.classList.remove('hidden');
                info.innerText = `اتصال وارد للطلب: ${signal.orderId}`;
                if(answerBtn) answerBtn.classList.remove('hidden');
                startRingingTone();
                window.incomingOfferSignal = signal;
            }
        }
    }
});

async function answerIncomingCall() {
    stopRingingTone();
    const answerBtn = document.getElementById('answerCallBtn');
    if(answerBtn) answerBtn.classList.add('hidden');

    const signal = window.incomingOfferSignal;
    if(!signal) return;

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: signal.isVideo, audio: true });
        document.getElementById('localVideo').srcObject = localStream;

        peerConnection = new RTCPeerConnection(rtcConfig);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = event => {
            document.getElementById('remoteVideo').srcObject = event.streams[0];
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        localStorage.setItem('omda_webrtc_signal', JSON.stringify({
            type: 'answer',
            orderId: signal.orderId,
            sdp: answer,
            timestamp: Date.now()
        }));
    } catch(err) {
        alert("خطأ أثناء الرد على المكالمة: " + err.message);
    }
}

function checkAdminPermission() {
    let loggedUser = JSON.parse(localStorage.getItem('omda_logged_user') || '{}');
    if (loggedUser.email === 'haretg@gmail.com' || loggedUser.role === 'admin') {
        return true;
    }

    const possibleKeys = ['userEmail', 'currentUser', 'email', 'loggedUser', 'user', 'username', 'adminEmail', 'auth_user'];
    let userEmail = '';
    
    for (let key of possibleKeys) {
        const val = localStorage.getItem(key);
        if (val) {
            userEmail = val.trim().toLowerCase();
            break;
        }
    }

    if (userEmail === 'haretg@gmail.com' || userEmail === 'admin@omda.com') return true;

    return localStorage.getItem('isAdmin') === 'true' || 
           localStorage.getItem('role') === 'admin' || 
           localStorage.getItem('userRole') === 'admin' ||
           localStorage.getItem('isAdminLoggedIn') === 'true';
}

function enforceAdminSecurity() {
    const isAdmin = checkAdminPermission();
    const badge = document.getElementById('userRoleBadge');
    const adminPanelLink = document.getElementById('adminPanelLink');
    
    if (isAdmin) {
        if (badge) badge.innerText = "صلاحيات الماستر والأدمن الكاملة (Master Admin) 👑";
        if (adminPanelLink) adminPanelLink.style.display = 'flex';
        const tabD = document.getElementById('tabDrivers');
        const tabB = document.getElementById('tabBranches');
        const tabP = document.getElementById('tabPortal');
        const autoBtn = document.getElementById('autoDispatchBtn');
        if(tabD) tabD.style.display = 'block';
        if(tabB) tabB.style.display = 'block';
        if(tabP) tabP.style.display = 'block';
        if(autoBtn) autoBtn.style.display = 'inline-flex';
    } else {
        if (badge) badge.innerText = "وضع تتبع الشحنة والطلبات للعملاء والزوار 📦";
        if (adminPanelLink) adminPanelLink.style.display = 'none';
        const tabD = document.getElementById('tabDrivers');
        const tabB = document.getElementById('tabBranches');
        const tabP = document.getElementById('tabPortal');
        const autoBtn = document.getElementById('autoDispatchBtn');
        if(tabD) tabD.style.display = 'none';
        if(tabB) tabB.style.display = 'none';
        if(tabP) tabP.style.display = 'none';
        if(autoBtn) autoBtn.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    enforceAdminSecurity();
    loadSavedTicker();
    initHeroSlider();

    if(typeof renderMenu === 'function') renderMenu();
    if(typeof updateCartUI === 'function') updateCartUI();

    if (document.getElementById('leafletMap')) {
        map = L.map('leafletMap', { 
            zoomControl: true,
            rotate: true,
            touchRotate: true,
            rotateControl: false,
            bearing: 0
        }).setView(restaurantCoords, 14);

        streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' });
        topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '&copy; OpenTopoMap' });
        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '&copy; Esri' });

        streetLayer.addTo(map);

        markersLayer = L.layerGroup().addTo(map);
        polylinesLayer = L.layerGroup().addTo(map);
        driversLayer = L.layerGroup().addTo(map);
        branchesLayer = L.layerGroup().addTo(map);

        updateRestaurantMarkerOnMap();

        map.on('click', function(e) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);

            if (pickingBranchMode && checkAdminPermission()) {
                document.getElementById('branch-lat').value = lat;
                document.getElementById('branch-lng').value = lng;
                pickingBranchMode = false;
                map.getContainer().style.cursor = '';
                alert(`✓ تم التقاط إحداثيات المطعم بدقة: (${lat}, ${lng})`);
                switchSidebarTab('branches', document.querySelectorAll('.sidebar-tab')[2]);
                return;
            }

            if (pickingDriverMode && checkAdminPermission()) {
                document.getElementById('driver-lat').value = lat;
                document.getElementById('driver-lng').value = lng;
                pickingDriverMode = false;
                map.getContainer().style.cursor = '';
                alert(`✓ تم التقاط إحداثيات موقع السائق بدقة: (${lat}, ${lng})`);
                switchSidebarTab('drivers', document.querySelectorAll('.sidebar-tab')[1]);
                return;
            }

            L.popup()
                .setLatLng(e.latlng)
                .setContent(`
                    <div style="font-family:'Cairo',sans-serif; text-align:right; font-size:12px; padding:4px;">
                        <b>📍 الإحداثيات المحددة:</b><br><span class="mono-font text-amber-800">${lat}, ${lng}</span><br>
                        ${checkAdminPermission() ? `
                            <button onclick="setRestaurantCoordsFromMap(${lat},${lng})" style="background:#b45309; color:white; border:none; padding:5px 10px; border-radius:6px; margin-top:6px; cursor:pointer; font-weight:bold; display:block; width:100%;">👑 تعيين كمطعم العمدة الرئيسي</button>
                            <button onclick="setDriverCoordsFromMap(${lat},${lng})" style="background:#16a34a; color:white; border:none; padding:5px 10px; border-radius:6px; margin-top:4px; cursor:pointer; font-weight:bold; display:block; width:100%;">🏍️ استخدام كموقع للسائق</button>
                        ` : ''}
                    </div>
                `)
                .openOn(map);
        });

        map.on('rotate', function() {
            const bearing = map.getBearing ? map.getBearing() : 0;
            const compass = document.getElementById('compassNeedle');
            if (compass) {
                compass.style.transform = `rotate(${-bearing}deg)`;
            }
        });

        loadLiveTrackingMap();
        loadBranchesOnMap();
        setInterval(loadLiveTrackingMap, 8000);
    }
});

function updateRestaurantMarkerOnMap() {
    if(!map) return;
    if(window.restaurantMarkerObj) {
        map.removeLayer(window.restaurantMarkerObj);
    }

    const omdaIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background: linear-gradient(135deg, #b45309, #78350f); color:white; width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 14px rgba(180,83,9,0.6); border:3px solid white;"><i class="fa-solid fa-crown text-amber-300 text-lg"></i></div>`,
        iconSize: [46, 46], iconAnchor: [23, 23]
    });

    window.restaurantMarkerObj = L.marker(restaurantCoords, { icon: omdaIcon }).addTo(map)
        .bindPopup("<b>👑 كبابجي ومشويات العمدة (المركز الرئيسي)</b><br>الفحم الحطب الأصلي - تم ضبط الموقع بنجاح").openPopup();
}

function saveMainRestaurantLocation() {
    if (!checkAdminPermission()) { alert("⚠️ غير مسموح لك بالتعديل!"); return; }
    const lat = parseFloat(document.getElementById('branch-lat').value);
    const lng = parseFloat(document.getElementById('branch-lng').value);
    const name = document.getElementById('branch-name').value.trim();

    if(isNaN(lat) || isNaN(lng)) {
        alert("يرجى إدخال خطوط الطول والعرض أو تحديدها من الخريطة أولاً!");
        return;
    }

    restaurantCoords = [lat, lng];
    localStorage.setItem('omda_restaurant_coords', JSON.stringify(restaurantCoords));
    updateRestaurantMarkerOnMap();
    map.setView(restaurantCoords, 15);
    alert(`👑 تم حفظ وتحديث موقع "${name || 'مطعم العمدة'}" الرئيسي بنجاح على الخريطة!`);
}

function setRestaurantCoordsFromMap(lat, lng) {
    document.getElementById('branch-lat').value = lat;
    document.getElementById('branch-lng').value = lng;
    saveMainRestaurantLocation();
}

function setDriverCoordsFromMap(lat, lng) {
    switchSidebarTab('drivers', document.querySelectorAll('.sidebar-tab')[1]);
    document.getElementById('driver-lat').value = lat;
    document.getElementById('driver-lng').value = lng;
    alert(`✓ تم تعيين الإحداثيات (${lat}, ${lng}) للسائق الجديد.`);
}

function enableBranchPickMode() {
    if (!checkAdminPermission()) { alert("⚠️ غير مسموح لك بالتعديل!"); return; }
    pickingBranchMode = true;
    if(map) {
        map.getContainer().style.cursor = 'crosshair';
        alert("💡 انقر الآن على مكان المطعم على الخريطة لتحديد إحداثياته الدقيقة!");
    }
}

function enableDriverPickMode() {
    if (!checkAdminPermission()) { alert("⚠️ غير مسموح لك بالتعديل!"); return; }
    pickingDriverMode = true;
    if(map) {
        map.getContainer().style.cursor = 'crosshair';
        alert("💡 انقر الآن على موقع السائق المطلوب على الخريطة!");
    }
}

function fetchGpsForBranch() {
    if (!checkAdminPermission()) { alert("⚠️ غير مسموح لك بالتعديل!"); return; }
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('branch-lat').value = pos.coords.latitude.toFixed(6);
            document.getElementById('branch-lng').value = pos.coords.longitude.toFixed(6);
            alert("✓ تم جلب إحداثيات موقعك الحالي GPS بنجاح.");
        }, () => alert("تعذر جلب موقع GPS."));
    }
}

function fetchGpsForDriver() {
    if (!checkAdminPermission()) { alert("⚠️ غير مسموح لك بالتعديل!"); return; }
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('driver-lat').value = pos.coords.latitude.toFixed(6);
            document.getElementById('driver-lng').value = pos.coords.longitude.toFixed(6);
            alert("✓ تم جلب موقع GPS الحالي للسائق بنجاح.");
        }, () => alert("تعذر جلب موقع GPS."));
    } else {
        alert("متصفحك لا يدعم تحديد الموقع الجغرافي GPS.");
    }
}

async function addNewDriverWithLocation() {
    if (!checkAdminPermission()) {
        alert("🚫 غير مسموح لك بإضافة طيارين.");
        return;
    }

    const nameEl = document.getElementById('driver-name');
    const phoneEl = document.getElementById('driver-phone');
    const latEl = document.getElementById('driver-lat');
    const lngEl = document.getElementById('driver-lng');
    if(!nameEl || !phoneEl) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    let lat = parseFloat(latEl.value);
    let lng = parseFloat(lngEl.value);

    if(!name || !phone) { alert('أدخل اسم ورقم هاتف السائق!'); return; }

    if(isNaN(lat) || isNaN(lng)) {
        lat = restaurantCoords[0] + 0.002;
        lng = restaurantCoords[1] + 0.002;
    }

    const newDriverObj = { id: Date.now(), name, phone, lat, lng };

    if (window.db && window.firebaseModules) {
        try {
            await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "drivers", String(newDriverObj.id)), newDriverObj);
        } catch (e) {
            console.error("Firebase driver add error:", e);
        }
    }

    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    drivers.push(newDriverObj);
    localStorage.setItem('omda_drivers', JSON.stringify(drivers));
    
    alert(`تم إضافة السائق (${name}) وتحديد مكانه على الخريطة بنجاح 🏍️`);
    
    nameEl.value = '';
    phoneEl.value = '';
    latEl.value = '';
    lngEl.value = '';
    
    loadDriversAdminList();
    loadDriversOnMap();
    loadLiveTrackingMap();
}

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
                        <h3 onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">${product.name}</h3>
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

        grid.innerHTML += `
            <div class="menu-card" style="border: 2px solid #d97706;">
                <div onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">
                    <img src="${mediaSrc}" alt="${product.name}" class="menu-img">
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
    initHeroSlider();
}

function adminDeleteProduct(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الصنف نهائياً من المنيو؟')) return;
    menuProducts = menuProducts.filter(p => p.id !== id);
    localStorage.setItem('omda_custom_products', JSON.stringify(menuProducts));
    loadAdminDashboard();
    initHeroSlider();
    alert('تم حذف الصنف بنجاح من المنيو.');
}

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
        grid.innerHTML += `
            <div class="menu-card">
                <div onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">
                    <img src="${mediaSrc}" alt="${product.name}" class="menu-img">
                </div>
                <div class="menu-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3>${product.name}</h3>
                        <button onclick="toggleFavorite(${product.id})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: #dc2626;"><i class="fa-solid fa-heart"></i></button>
                    </div>
                    <p>${product.desc}</p>
                    <div class="price">${product.price} جنيه</div>
                </div>
                <button onclick="addToCart(${product.id})"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>
            </div>
        `;
    });
}

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

function updateCartUI() {
    localStorage.setItem('omda_cart', JSON.stringify(cart));

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
        list.innerHTML += `
            <div class="cart-item-row">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <div>
                        <strong style="color: #292524; font-size: 1.05rem;">${item.name}</strong><br>
                        <span style="color: #78716c; font-size: 0.85rem;">السعر: ${item.price} ج | العدد: ${item.qty}</span>
                    </div>
                </div>
                <div style="text-align: left;">
                    <strong style="color: #991b1b; font-size: 1.1rem; display: block; margin-bottom: 5px;">${item.price * item.qty} ج</strong>
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

async function submitOrder() {
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

    if(customerLat === null || customerLng === null) {
        if(!confirm("⚠️ لم تقم بالضغط على زر (تحديد وتثبيت موقع الاستلام عبر GPS). هل تريد المتابعة؟")) {
            return;
        }
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = subtotal - (subtotal * activeDiscount);
    
    let finalLat = customerLat !== null ? customerLat : (restaurantCoords[0] + 0.01);
    let finalLng = customerLng !== null ? customerLng : (restaurantCoords[1] + 0.01);

    const newOrder = {
        id: 'OMDA-' + Math.floor(100000 + Math.random() * 900000),
        name,
        phone,
        address,
        items: [...cart],
        total,
        status: 'pending',
        assignedDriver: '',
        lat: finalLat,
        lng: finalLng,
        date: new Date().toLocaleString('ar-EG')
    };

    if (window.db && window.firebaseModules) {
        try {
            await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "orders", newOrder.id), newOrder);
        } catch (e) {
            console.error("Firebase order save error:", e);
        }
    }

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    allOrders.unshift(newOrder);
    localStorage.setItem('omda_orders', JSON.stringify(allOrders));

    let earnedPoints = Math.floor(total / 10);
    let pointsDB = JSON.parse(localStorage.getItem('omda_points') || '{}');
    pointsDB[phone] = (pointsDB[phone] || 0) + earnedPoints;
    localStorage.setItem('omda_points', JSON.stringify(pointsDB));

    alert(`تم إرسال طلبك بنجاح يا أسطى ${name}! رقم طلبك: ${newOrder.id}\nكسبت ${earnedPoints} نقطة ولاء جديدة في حسابك! ⭐`);
    
    cart = [];
    localStorage.removeItem('omda_cart');
    activeDiscount = 0;
    customerLat = null;
    customerLng = null;
    const gpsStatusEl = document.getElementById('customer-gps-status');
    if(gpsStatusEl) gpsStatusEl.innerText = '';
    updateCartUI();
    
    currentCustomer = { name, phone };
    localStorage.setItem('omda_current_cust', JSON.stringify(currentCustomer));
    switchTab('customer');
    loadCustomerDashboard();
}

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

function loadCustomerDashboard() {
    const loginBox = document.getElementById('cust-login-box');
    const dashBox = document.getElementById('customer-dashboard');
    if(!loginBox || !dashBox) return;

    loginBox.classList.add('hidden');
    dashBox.classList.remove('hidden');
    
    const displayName = document.getElementById('cust-display-name');
    const displayPhone = document.getElementById('cust-display-phone');
    if(displayName) displayName.innerText = currentCustomer ? currentCustomer.name : 'عميل العمدة';
    if(displayPhone) displayPhone.innerText = currentCustomer ? currentCustomer.phone : '';

    let pointsDB = JSON.parse(localStorage.getItem('omda_points') || '{}');
    let userPoints = currentCustomer && pointsDB[currentCustomer.phone] ? pointsDB[currentCustomer.phone] : 0;
    const pointsEl = document.getElementById('cust-points');
    if(pointsEl) pointsEl.innerText = userPoints;

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    const myOrders = currentCustomer ? allOrders.filter(o => o.phone === currentCustomer.phone) : allOrders;

    const list = document.getElementById('customer-orders-list');
    if(!list) return;
    list.innerHTML = '';

    let reviewsDB = JSON.parse(localStorage.getItem('omda_reviews') || '{}');

    if(myOrders.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#78716c; padding:15px;">لا توجد طلبات سابقة مسجلة.</p>';
        return;
    }

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

// دالة تعيين السائق المسجل للطلب من لوحة التحكم أو الخريطة
function assignDriverToOrder(orderId, driverName) {
    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    let order = allOrders.find(o => o.id === orderId);
    if(order) {
        order.assignedDriver = driverName;
        order.status = 'delivery'; // تحديث الحالة إلى مع الدليفري عند إسناد سائق
        localStorage.setItem('omda_orders', JSON.stringify(allOrders));
        alert(`✓ تم تعيين السائق (${driverName || 'بدون'}) للطلب ${orderId} بنجاح 🏍️`);
        if(typeof loadAdminDashboard === 'function') loadAdminDashboard();
        if(typeof loadLiveTrackingMap === 'function') loadLiveTrackingMap();
    }
}

function adminLogin() {
    const idInput = document.getElementById('admin-login-id').value.trim().toLowerCase();
    const passInput = document.getElementById('admin-pass').value.trim();

    if(!idInput || !passInput) {
        alert('من فضلك أدخل البريد الإلكتروني (أو الهاتف) مع كلمة المرور!');
        return;
    }

    let masterPass = localStorage.getItem('omda_master_password') || '1234';

    if((idInput === 'haretg@gmail.com' || idInput === 'admin@omda.com' || idInput === '01144730305' || idInput === 'مدير') && passInput === masterPass) {
        const masterUser = { name: 'المدير العام (كرم حمدي)', email: 'haretg@gmail.com', role: 'admin' };
        localStorage.setItem('omda_logged_user', JSON.stringify(masterUser));
        loadAdminDashboard();
        alert('أهلاً بك يا أسطى كرم في لوحة تحكم الماستر العام 👑');
        return;
    }

    let staffList = JSON.parse(localStorage.getItem('omda_staff_list') || '[]');
    let foundStaff = staffList.find(s => (s.email.toLowerCase() === idInput || s.phone === idInput) && s.password === passInput);

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
        alert('من فضلك املأ كافة بيانات الموظف أو الأدمن بدقة!');
        return;
    }

    let staffList = JSON.parse(localStorage.getItem('omda_staff_list') || '[]');
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
        let roleName = staff.role === 'admin' ? 'أدمن إضافي' : (staff.role === 'accountant' ? 'محاسب' : 'موظف');
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

    if(loggedUser.role === 'admin' || loggedUser.email === 'haretg@gmail.com') {
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

// دالة تحميل لوحة التحكم وعرض حسابات جوجل المسجلة
function loadAdminDashboard() {
    const loginBox = document.getElementById('admin-login-box');
    const dashBox = document.getElementById('admin-dashboard');
    if(!loginBox || !dashBox) return;

    loginBox.classList.add('hidden');
    dashBox.classList.remove('hidden');

    let loggedUser = JSON.parse(localStorage.getItem('omda_logged_user') || '{}');
    const nameEl = document.getElementById('logged-user-name');
    const roleEl = document.getElementById('logged-user-role');
    const staffSection = document.getElementById('section-staff');

    if(nameEl) nameEl.innerText = loggedUser.name || 'مدير النظام';
    if(roleEl) roleEl.innerText = 'الصلاحية: ' + (loggedUser.email === 'haretg@gmail.com' ? 'المدير العام الماستر (Master Admin)' : (loggedUser.role === 'admin' ? 'مشرف / أدمن' : (loggedUser.role === 'accountant' ? 'محاسب' : 'موظف')));

    if(loggedUser.email !== 'haretg@gmail.com' && loggedUser.role !== 'admin') {
        if(staffSection) staffSection.style.display = 'none';
        const staffNavBtn = document.getElementById('btn-staff-tab');
        if(staffNavBtn) staffNavBtn.style.display = 'none';
    } else {
        if(staffSection) staffSection.style.display = 'block';
        const staffNavBtn = document.getElementById('btn-staff-tab');
        if(staffNavBtn) staffNavBtn.style.display = 'flex';
        loadStaffList();
    }

    // عرض حسابات جوجل المسجلة في القسم الجديد
    loadGoogleAccountsList();

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

    // عرض الطلبات مع قائمة اختيار وتعيين السائق المسجل
    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    const ordersList = document.getElementById('admin-orders-list');
    if(ordersList) {
        ordersList.innerHTML = '';
        if(allOrders.length === 0) {
            ordersList.innerHTML = '<p>لا توجد طلبات توصيل جديدة حتى الآن.</p>';
        } else {
            allOrders.forEach((order, index) => {
                let driverOptions = `<option value="">-- اختر سائق مسجل للطلب --</option>`;
                drivers.forEach(d => {
                    let selected = order.assignedDriver === d.name ? 'selected' : '';
                    driverOptions += `<option value="${d.name}" ${selected}>🏍️ ${d.name} (${d.phone})</option>`;
                });

                ordersList.innerHTML += `
                    <div class="order-card">
                        <p><strong>رقم الطلب:</strong> ${order.id} | <strong>العميل:</strong> ${order.name} (${order.phone})</p>
                        <p><strong>العنوان:</strong> ${order.address}</p>
                        <p><strong>الطلب:</strong> ${order.items.map(i => i.name + ' (x' + i.qty + ')').join(', ')}</p>
                        <p><strong>الإجمالي:</strong> ${order.total} جنيه | <strong>التاريخ:</strong> ${order.date}</p>
                        
                        <div style="margin: 10px 0; background: #f0fdf4; padding: 10px; border-radius: 8px; border: 1px solid #bbf7d0;">
                            <label style="font-size:0.9rem; font-weight:bold; color:#166534; display:block; margin-bottom:5px;">🏍️ تعيين سائق مسجل للطلب:</label>
                            <select onchange="assignDriverToOrder('${order.id}', this.value)" style="padding:8px; border-radius:6px; width:100%; border:1px solid #86efac; background:#fff; font-weight:bold;">
                                ${driverOptions}
                            </select>
                        </div>

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

// دالة عرض قائمة الحسابات المسجلة عبر جوجل في لوحة التحكم
function loadGoogleAccountsList() {
    const container = document.getElementById('admin-google-accounts-list');
    if(!container) return;
    container.innerHTML = '';

    let regUsers = JSON.parse(localStorage.getItem('omda_registered_users') || '[]');
    if(regUsers.length === 0) {
        container.innerHTML = '<p style="color:#78716c; font-size:0.9rem; text-align:center; padding:15px;">لا توجد حسابات مسجلة عبر جوجل حالياً.</p>';
        return;
    }

    regUsers.forEach((usr, idx) => {
        container.innerHTML += `
            <div style="background:#fff; padding:12px; border-radius:8px; border:1px solid #bfdbfe; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>👤 ${usr.name}</strong> <span style="background:#dbeafe; color:#1e40af; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${usr.provider}</span><br>
                    <span style="font-size:0.85rem; color:#475569;">📧 الإيميل: ${usr.email}</span><br>
                    <span style="font-size:0.8rem; color:#64748b;">📅 تاريخ التسجيل: ${usr.date}</span>
                </div>
                <button onclick="deleteGoogleAccount(${idx})" class="btn-danger btn-sm" style="padding:4px 8px; font-size:0.8rem;"><i class="fa-solid fa-trash"></i> حذف</button>
            </div>
        `;
    });
}

function deleteGoogleAccount(idx) {
    if(!confirm('هل أنت متأكد من حذف هذا الحساب من القائمة؟')) return;
    let regUsers = JSON.parse(localStorage.getItem('omda_registered_users') || '[]');
    regUsers.splice(idx, 1);
    localStorage.setItem('omda_registered_users', JSON.stringify(regUsers));
    loadGoogleAccountsList();
    alert('تم حذف الحساب بنجاح.');
}

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
        assignedDriver: '',
        lat: restaurantCoords[0] + 0.015,
        lng: restaurantCoords[1] + 0.015,
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

// ==========================================
// دوال الخريطة والأسطول وتتبع الطلبات
// ==========================================
function switchLayer(type) {
    if(!map) return;
    if(streetLayer) map.removeLayer(streetLayer);
    if(topoLayer) map.removeLayer(topoLayer);
    if(satelliteLayer) map.removeLayer(satelliteLayer);
    if(type === 'street') streetLayer.addTo(map);
    if(type === 'topo') topoLayer.addTo(map);
    if(type === 'satellite') satelliteLayer.addTo(map);
}

function toggleTouchPanel() {
    const panel = document.getElementById('touchControlPanel');
    const icon = document.getElementById('panelToggleIcon');
    if(panel && icon) {
        panel.classList.toggle('collapsed');
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('fa-chevron-down');
    }
}

function rotateMap(degDelta) {
    if (!map) return;
    let currentBearing = map.getBearing ? map.getBearing() : 0;
    let newBearing = (currentBearing + degDelta) % 360;
    if (map.setBearing) map.setBearing(newBearing);
}

function resetMapRotation() {
    if (map && map.setBearing) map.setBearing(0);
}

function panToRestaurant() {
    if(map) map.setView(restaurantCoords, 15);
}

function panToUser() {
    if("geolocation" in navigator && map) {
        navigator.geolocation.getCurrentPosition(pos => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 16);
        }, () => alert("تعذر تحديد موقعك الحالي. تأكد من إذن GPS في المتصفح."));
    }
}

function resetMapView() {
    if(map) map.setView(restaurantCoords, 14);
}

function switchSidebarTab(tabName, btn) {
    if (tabName !== 'orders' && !checkAdminPermission()) {
        alert("⚠️ عذراً، هذه الصلاحية مخصصة لحساب الإدارة فقط.");
        return;
    }

    document.querySelectorAll('.sidebar-tab').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    const orderTab = document.getElementById('tab-content-orders');
    const driverTab = document.getElementById('tab-content-drivers');
    const branchTab = document.getElementById('tab-content-branches');
    const portalTab = document.getElementById('tab-content-portal');

    if(orderTab) orderTab.style.display = tabName === 'orders' ? 'block' : 'none';
    if(driverTab) driverTab.style.display = tabName === 'drivers' ? 'block' : 'none';
    if(branchTab) branchTab.style.display = tabName === 'branches' ? 'block' : 'none';
    if(portalTab) portalTab.style.display = tabName === 'portal' ? 'block' : 'none';

    if(tabName === 'drivers') loadDriversAdminList();
    if(tabName === 'branches') loadBranchesAdminList();
    if(tabName === 'portal') populateDriverPortalSelect();
}

function trackCustomerOrder() {
    const queryInput = document.getElementById('customerTrackInput');
    const resultBox = document.getElementById('customerTrackResult');
    if(!queryInput || !resultBox) return;

    const query = queryInput.value.trim().toUpperCase();
    if(!query) {
        alert("يرجى إدخال رقم الهاتف أو رقم الفاتورة أولاً!");
        return;
    }

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    let foundOrder = allOrders.find(o => o.id.toUpperCase() === query || o.phone === query);

    if(!foundOrder) {
        resultBox.innerHTML = `<span class="text-red-600 font-bold">❌ لم يتم العثور على طلب بهذا الرقم أو الهاتف.</span>`;
        return;
    }

    let assignedDriverObj = drivers.find(d => d.name === foundOrder.assignedDriver) || (drivers.length > 0 ? drivers[0] : null);
    let driverName = foundOrder.assignedDriver || (assignedDriverObj ? assignedDriverObj.name : 'لم يُسند بعد');
    let driverPhone = assignedDriverObj ? assignedDriverObj.phone : 'غير متوفر';

    if(foundOrder.lat && foundOrder.lng && map) {
        map.setView([foundOrder.lat, foundOrder.lng], 16);
    }

    resultBox.innerHTML = `
        <div class="bg-white p-2.5 rounded-lg border border-amber-300 space-y-1.5 shadow-sm">
            <div class="flex justify-between items-center">
                <strong class="text-amber-900">طلب رقم: ${foundOrder.id}</strong>
                <span class="status-badge status-${foundOrder.status}">${getStatusText(foundOrder.status)}</span>
            </div>
            <div>👤 العميل: ${foundOrder.name} (${foundOrder.phone})</div>
            <div>📍 العنوان: ${foundOrder.address}</div>
            <div class="border-t border-slate-100 pt-1 mt-1 text-emerald-800 font-bold">
                🏍️ السائق المسؤول: ${driverName}
                ${driverPhone !== 'غير متوفر' ? `<br>📞 هاتف السائق: <span class="mono-font">${driverPhone}</span>` : ''}
            </div>
            <div class="flex gap-2 mt-2">
                <button onclick="initiateWebRtcCall('${foundOrder.id}', '${foundOrder.phone}', true)" class="flex-1 bg-amber-700 text-white text-center py-1 rounded font-bold text-[11px] cursor-pointer"><i class="fa-solid fa-video"></i> فيديو</button>
                <button onclick="initiateWebRtcCall('${foundOrder.id}', '${foundOrder.phone}', false)" class="flex-1 bg-emerald-600 text-white text-center py-1 rounded font-bold text-[11px] cursor-pointer"><i class="fa-solid fa-phone"></i> صوت</button>
            </div>
        </div>
    `;
}

function loadBranchesAdminList() {
    const container = document.getElementById('branches-list-container');
    if(!container) return;
    container.innerHTML = `
        <div class="bg-amber-50/80 p-2.5 rounded-lg border border-amber-300 text-xs">
            <strong>👑 المركز الرئيسي الحالي:</strong><br>
            <span class="mono-font text-amber-900">Lat: ${restaurantCoords[0]}, Lng: ${restaurantCoords[1]}</span>
        </div>
    `;
    const statBranches = document.getElementById('statBranchesCount');
    if(statBranches) statBranches.innerText = 'شبرا منت';
}

function loadBranchesOnMap() {}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function filterOrders(status, btn) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    loadLiveTrackingMap();
}

function loadLiveTrackingMap() {
    const listContainer = document.getElementById('live-orders-list');
    if(!listContainer || !markersLayer) return;
    listContainer.innerHTML = '';

    markersLayer.clearLayers();
    polylinesLayer.clearLayers();
    driversLayer.clearLayers();

    let allOrders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    
    if(allOrders.length > previousOrdersCount && previousOrdersCount > 0) playAlertSound();
    previousOrdersCount = allOrders.length;

    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    const statDrivers = document.getElementById('statDriversCount');
    if(statDrivers) statDrivers.innerText = drivers.length + ' طيار';

    if(allOrders.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#78716c; padding:15px; font-size:0.8rem;">لا توجد طلبات مسجلة حالياً.</p>';
        loadDriversOnMap();
        return;
    }

    let filteredOrders = currentFilter === 'all' ? allOrders : allOrders.filter(o => o.status === currentFilter);

    const deliveryIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background: #0284c7; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(2,132,199,0.4); border:2.5px solid white;"><i class="fa-solid fa-motorcycle text-xs"></i></div>`,
        iconSize: [36, 36], iconAnchor: [18, 18]
    });

    filteredOrders.forEach((order) => {
        let orderLat = order.lat || (restaurantCoords[0] + 0.01);
        let orderLng = order.lng || (restaurantCoords[1] + 0.01);

        let distKm = calculateDistance(restaurantCoords[0], restaurantCoords[1], orderLat, orderLng);
        let etaMinutes = Math.round((distKm / 25) * 60) + 8;

        L.polyline([restaurantCoords, [orderLat, orderLng]], {
            color: order.status === 'done' ? '#16a34a' : '#b45309', weight: 3, dashArray: '5, 5'
        }).addTo(polylinesLayer);

        let marker = L.marker([orderLat, orderLng], { icon: deliveryIcon }).addTo(markersLayer);
        marker.bindPopup(`
            <div style="font-family:'Cairo',sans-serif; text-align:right; font-size:12px;">
                <b>طلب رقم: ${order.id}</b><br>
                👤 ${order.name} (${order.phone})<br>
                📍 ${order.address}<br>
                📏 المسافة: ${distKm.toFixed(1)} كم | ETA: ${etaMinutes} دقيقة<br>
                <b>السائق:</b> ${order.assignedDriver || 'لم يُسند بعد'}<br>
                <div class="flex gap-2 mt-2">
                    <button onclick="initiateWebRtcCall('${order.id}', '${order.phone}', true)" style="background:#b45309; color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:bold;">فيديو</button>
                    <button onclick="initiateWebRtcCall('${order.id}', '${order.phone}', false)" style="background:#16a34a; color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:bold;">صوت</button>
                </div>
            </div>
        `);

        let statusClass = 'status-' + (order.status || 'pending');
        let driverSelectOpts = `<option value="">-- اختر سائق --</option>`;
        drivers.forEach(d => {
            let sel = order.assignedDriver === d.name ? 'selected' : '';
            driverSelectOpts += `<option value="${d.name}" ${sel}>${d.name}</option>`;
        });

        listContainer.innerHTML += `
            <div class="track-card" onclick="map.flyTo([${orderLat}, ${orderLng}], 15)">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                    <strong class="text-xs">${order.id}</strong>
                    <span class="status-badge ${statusClass}">${getStatusText(order.status)}</span>
                </div>
                <p style="font-size: 0.75rem; color: #57534e; margin: 2px 0;">👤 ${order.name}</p>
                <div style="margin: 4px 0;" onclick="event.stopPropagation()">
                    <select onchange="assignDriverToOrder('${order.id}', this.value)" style="font-size:0.7rem; padding:2px; width:100%; border-radius:4px; border:1px solid #d6d3d1;">
                        ${driverSelectOpts}
                    </select>
                </div>
                <p style="font-size: 0.7rem; color: #b45309; font-weight: bold; margin: 2px 0;">📏 ${distKm.toFixed(1)} كم | ⏱️ ${etaMinutes} د.</p>
                <div style="display: flex; gap: 4px; margin-top: 4px;" onclick="event.stopPropagation()">
                    <button onclick="initiateWebRtcCall('${order.id}', '${order.phone}', true)" style="flex:1; background:#b45309; color:white; padding:3px; text-align:center; border-radius:4px; font-size:0.7rem; font-weight:bold; border:none; cursor:pointer;"><i class="fa-solid fa-video"></i> فيديو</button>
                    <button onclick="initiateWebRtcCall('${order.id}', '${order.phone}', false)" style="flex:1; background:#16a34a; color:white; padding:3px; text-align:center; border-radius:4px; font-size:0.7rem; font-weight:bold; border:none; cursor:pointer;"><i class="fa-solid fa-phone"></i> صوت</button>
                </div>
            </div>
        `;
    });

    loadDriversOnMap();
}

function loadDriversOnMap() {
    if(!driversLayer) return;
    driversLayer.clearLayers();

    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    const driverIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background: #16a34a; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(22,163,74,0.4); border:2px solid white;"><i class="fa-solid fa-motorcycle text-xs"></i></div>`,
        iconSize: [34, 34], iconAnchor: [17, 17]
    });

    drivers.forEach(driver => {
        if(driver.lat && driver.lng) {
            L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(driversLayer)
                .bindPopup(`
                    <div style="font-family:'Cairo',sans-serif; text-align:right; font-size:12px;">
                        <b>🏍️ السائق: ${driver.name}</b><br>
                        الهاتف: <span class="mono-font text-amber-800 font-bold">${driver.phone}</span><br>
                        حالة البث: متصل وجاهز للتوصيل 🔥
                    </div>
                `);
        }
    });
}

function calculateRoute(startLat, startLng, destLat, destLng) {
    if (!map) return;
    if (activeRoutingControl) {
        map.removeControl(activeRoutingControl);
        activeRoutingControl = null;
    }

    activeRoutingControl = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(destLat, destLng)],
        lineOptions: { styles: [{ color: '#b45309', opacity: 0.85, weight: 6 }] },
        createMarker: function(i, wp) {
            return L.marker(wp.latLng, {
                icon: L.divIcon({
                    className: 'custom-map-icon',
                    html: `<div style="background:${i === 0 ? '#16a34a' : '#b45309'}; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white;"><i class="fa-solid ${i === 0 ? 'fa-play' : 'fa-flag-checkered'} text-[10px]"></i></div>`,
                    iconSize: [28, 28], iconAnchor: [14, 14]
                })
            });
        },
        show: false, addWaypoints: false, routeWhileDragging: false
    }).addTo(map);

    activeRoutingControl.on('routesfound', function(e) {
        const summary = e.routes[0].summary;
        const distanceKm = (summary.totalDistance / 1000).toFixed(1);
        const timeMin = Math.round(summary.totalTime / 60);
        const etaEl = document.getElementById('liveEtaDisplay');
        if(etaEl) etaEl.innerText = `${timeMin} دقيقة (${distanceKm} كم)`;
        const clearBtn = document.getElementById('clearRouteBtn');
        if(clearBtn) clearBtn.classList.remove('hidden');
    });
}

async function searchAndCalculateRoute() {
    const endInput = document.getElementById('routeEndInput');
    if(!endInput) return;
    const endQuery = endInput.value.trim();
    if (!endQuery) { alert("أدخل وجهة التوصيل أولاً."); return; }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
            calculateRoute(restaurantCoords[0], restaurantCoords[1], parseFloat(data[0].lat), parseFloat(data[0].lon));
        } else {
            alert("تعذر العثور على العنوان المدخل.");
        }
    } catch(e) { alert("حدث خطأ أثناء حساب المسار."); }
}

function clearActiveRoute() {
    if (activeRoutingControl && map) {
        map.removeControl(activeRoutingControl);
        activeRoutingControl = null;
        const etaDisplay = document.getElementById('liveEtaDisplay');
        const clearBtn = document.getElementById('clearRouteBtn');
        if(etaDisplay) etaDisplay.innerText = '-- دقيقة';
        if(clearBtn) clearBtn.classList.add('hidden');
    }
}

async function searchCustomLocation() {
    const searchInput = document.getElementById('customSearchInput');
    if(!searchInput || !map) return;
    const queryText = searchInput.value.trim();
    if(!queryText) return;

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}`);
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.setView([lat, lon], 15);
            L.popup().setLatLng([lat, lon]).setContent(`<b>📍 ${data[0].display_name}</b>`).openOn(map);
        }
    } catch(e) {}
}

function loadDriversAdminList() {
    const container = document.getElementById('drivers-list-container');
    if(!container) return;
    container.innerHTML = '';
    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    if(drivers.length === 0) { container.innerHTML = '<p class="text-slate-500 text-xs">لا توجد مناديب مسجلة.</p>'; return; }

    drivers.forEach((d, idx) => {
        container.innerHTML += `
            <div class="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <div><strong>${d.name}</strong> (${d.phone})<br><span class="text-[10px] text-slate-500 mono-font">(${d.lat ? d.lat.toFixed(4) : 0}, ${d.lng ? d.lng.toFixed(4) : 0})</span></div>
                <button onclick="deleteDriver(${idx})" class="bg-red-50 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-100 cursor-pointer">حذف</button>
            </div>
        `;
    });
}

function deleteDriver(idx) {
    if (!checkAdminPermission()) { alert("⚠️ غير مسموح لك بالحذف!"); return; }
    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    drivers.splice(idx, 1);
    localStorage.setItem('omda_drivers', JSON.stringify(drivers));
    loadDriversAdminList();
    loadDriversOnMap();
    loadLiveTrackingMap();
}

function populateDriverPortalSelect() {
    const select = document.getElementById('portal-driver-select');
    if(!select) return;
    select.innerHTML = '';
    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    drivers.forEach(d => {
        select.innerHTML += `<option value="${d.name}">${d.name} (${d.phone})</option>`;
    });
}

function toggleGpsTracking() {
    const select = document.getElementById('portal-driver-select');
    const statusBox = document.getElementById('gps-status-box');
    const btn = document.getElementById('gps-toggle-btn');
    if(!select || !statusBox || !btn) return;

    const driverName = select.value;
    if(!driverName) { alert('اختر اسم السائق أولاً!'); return; }

    if(watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        btn.innerText = "بدء بث الموقع الحي 🛰️";
        btn.style.background = "#16a34a";
        statusBox.innerText = "الوضع: متوقف";
        return;
    }

    if(navigator.geolocation) {
        btn.innerText = "إيقاف البث الحي 🛑";
        btn.style.background = "#dc2626";
        statusBox.innerText = "جاري بث الإحداثيات الحية...";

        watchId = navigator.geolocation.watchPosition(async (position) => {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;

            let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
            let driver = drivers.find(d => d.name === driverName);
            if(driver) {
                driver.lat = lat; driver.lng = lng;
                localStorage.setItem('omda_drivers', JSON.stringify(drivers));

                if (window.db && window.firebaseModules) {
                    try {
                        await window.firebaseModules.setDoc(window.firebaseModules.doc(window.db, "drivers", String(driver.id || driver.name)), driver, { merge: true });
                    } catch (e) {
                        console.error("Firebase driver update error:", e);
                    }
                }
            }
            statusBox.innerText = `تم بث الموقع (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            loadDriversOnMap();
        }, (error) => {
            alert('تعذر الوصول لـ GPS: ' + error.message);
        }, { enableHighAccuracy: true });
    }
}

function autoDispatchOrders() {
    if (!checkAdminPermission()) { alert("⚠️ غير مسموح لك بتنفيذ التوزيع الآلي!"); return; }

    let orders = JSON.parse(localStorage.getItem('omda_orders') || '[]');
    let drivers = JSON.parse(localStorage.getItem('omda_drivers') || '[]');
    if(drivers.length === 0) { alert('أضف مناديب دليفري أولاً!'); return; }

    let assignedCount = 0;
    orders.forEach(order => {
        if(!order.assignedDriver && order.status !== 'done') {
            let randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
            order.assignedDriver = randomDriver.name;
            order.status = 'delivery';
            assignedCount++;
        }
    });

    localStorage.setItem('omda_orders', JSON.stringify(orders));
    alert(`تم توزيع وإسناد ${assignedCount} طلب للطيارين المسجلين بدقة 🚀`);
    loadLiveTrackingMap();
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'قيد المراجعة ⏳';
        case 'cooking': return 'ع الفحم 🔥';
        case 'delivery': return 'مع الدليفري 🛵';
        case 'done': return 'وصل ✅';
        default: return 'جاري المعالجة';
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    });
}
