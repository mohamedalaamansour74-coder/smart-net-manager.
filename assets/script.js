// Firebase Firestore Integration & Realtime Sync Engine
if (typeof window.firebaseConfig === 'undefined') {
    window.firebaseConfig = {
        apiKey: "AIzaSyBSXkd08SAB209byWw8xdAXCw53gD2cU7o",
        authDomain: "smart-net-manager.firebaseapp.com",
        projectId: "smart-net-manager",
        storageBucket: "smart-net-manager.firebasestorage.app",
        messagingSenderId: "229914487574",
        appId: "1:229914487574:web:61ab260a4cf1990fe0be37",
        measurementId: "G-0QE3L5KLP5"
    };
}
var firebaseConfig = window.firebaseConfig;

if (typeof window.db === 'undefined') {
    window.db = null;
}
var db = window.db;

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(window.firebaseConfig);
        }
        window.db = firebase.firestore();
        db = window.db;
        try { db.enablePersistence({ synchronizeTabs: true }); } catch(err) {}
    }
} catch(e) {
    console.warn('Firestore initialization notice:', e);
}

function saveToFirestore(collectionName, data) {
    if (!db) return;
    try {
        if (Array.isArray(data)) {
            data.forEach(item => {
                const docId = item.username || item.id || `doc_${Date.now()}`;
                db.collection(collectionName).doc(String(docId)).set(item, { merge: true }).catch(err => console.warn('Firestore set item err:', err));
            });
        } else if (typeof data === 'object' && data !== null) {
            db.collection(collectionName).doc('main_config').set(data, { merge: true }).catch(err => console.warn('Firestore set obj err:', err));
        }
    } catch(err) {
        console.warn('saveToFirestore err:', err);
    }
}

// Global Utilities & Helper Functions
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function round(val, decimals = 1) {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

function maxZero(val) {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 0 ? 0 : num;
}

function applyLanguage(lang = 'en') {
    const targetLang = lang === 'ar' ? 'ar' : 'en';
    localStorage.setItem('selected_lang', targetLang);
    localStorage.setItem('lang', targetLang);

    document.documentElement.dir = targetLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = targetLang;

    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.innerText = targetLang === 'en' ? '🌐 AR' : '🌐 EN';
    }

    if (typeof TRANSLATIONS !== 'undefined') {
        const dict = TRANSLATIONS[targetLang] || TRANSLATIONS.en;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict && dict[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = dict[key];
                } else {
                    el.innerText = dict[key];
                }
            }
        });
    }

    document.querySelectorAll('.quota-rem-simple, .minutes-rem-simple').forEach(el => {
        const text = el.getAttribute(`data-${targetLang}`);
        if (text) el.innerText = text;
    });

    if (typeof refreshActiveView === 'function') {
        refreshActiveView();
    }
}

function showLoading(message = 'Processing...') {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text" id="loadingText">${escapeHtml(message)}</div>
        `;
        document.body.appendChild(overlay);
    }
    const textEl = document.getElementById('loadingText');
    if (textEl) textEl.innerText = message;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function appendChatMessage(text, type = 'sent') {
    const chatFeed = document.getElementById('chatFeed');
    const widgetChatLog = document.getElementById('widgetChatLog');

    if (chatFeed) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${type}`;
        msgDiv.innerText = text;
        chatFeed.appendChild(msgDiv);
        chatFeed.scrollTop = chatFeed.scrollHeight;
    }

    if (widgetChatLog) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${type}`;
        msgDiv.innerText = text;
        widgetChatLog.appendChild(msgDiv);
        widgetChatLog.scrollTop = widgetChatLog.scrollHeight;
    }
}

function initPersistedCheckmarks() {
    document.querySelectorAll('.copy-checkmark-icon').forEach(icon => {
        const phone = icon.getAttribute('data-phone');
        if (phone && localStorage.getItem('copied_' + phone)) {
            icon.style.display = 'inline';
        }
    });
}

// Firebase Auxiliary Loader & Sync Handlers
let firebaseInitialized = false;

function refreshActiveView() {
    try {
        if (typeof initActivePage === 'function') {
            initActivePage();
        }
        if (typeof renderDashboard === 'function' && document.getElementById('kpiTotalLines')) {
            renderDashboard();
        }
        if (typeof renderPaymentsPage === 'function' && document.getElementById('paymentsTbody')) {
            renderPaymentsPage();
        }
        if (typeof renderLinesDirectory === 'function' && (document.getElementById('linesTableBody') || document.getElementById('formPanel'))) {
            renderLinesDirectory();
        }
        if (typeof renderAdminPage === 'function' && (document.getElementById('usersDirectoryTbody') || document.getElementById('activityLogsTbody'))) {
            renderAdminPage();
        }
    } catch(err) {
        console.warn('refreshActiveView notice:', err);
    }
}

function loadFirebase() {
    return new Promise((resolve) => {
        if (window.firebase) {
            resolve();
            return;
        }
        const s1 = document.createElement('script');
        s1.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
        s1.onload = () => {
            const s2 = document.createElement('script');
            s2.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js";
            s2.onload = () => resolve();
            s2.onerror = () => resolve();
            document.head.appendChild(s2);
        };
        s1.onerror = () => resolve();
        document.head.appendChild(s1);
    });
}

function initFirebase() {
    if (firebaseInitialized) return;
    try {
        if (window.firebase) {
            if (!firebase.apps.length) {
                firebase.initializeApp(window.firebaseConfig);
            }
            window.db = firebase.firestore();
            db = window.db;
            firebaseInitialized = true;
            console.log("Firebase Firestore initialized successfully with real-time sync active.");
            setupFirestoreListeners();
        } else {
            console.error("Firebase SDK is not loaded on window object.");
        }
    } catch (err) {
        console.error("Firebase initialization failed:", err);
    }
}

function setupFirestoreListeners() {
    if (!db) return;
    const user = getCurrentUser();
    const isMaster = isMasterAdmin();
    const firestoreCol = isMaster ? "smart_net_manager" : `workspace_${user.username || user.id}`;
    
    const keys = ["lines_data", "waiting_list", "chat_history", "archived_months", "package_pricing", "sub_user_pricing", "payments_records", "customers_db", "admin_bills_data", "system_users", "pricing_plans"];
    keys.forEach(rawKey => {
        try {
            db.collection(firestoreCol).doc(rawKey).onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    const isValidData = data && data.value !== undefined;
                    if (isValidData) {
                        const localKey = getWorkspaceKey(rawKey);
                        const localStr = localStorage.getItem(localKey);
                        const dbStr = JSON.stringify(data.value);
                        if (localStr !== dbStr) {
                            localStorage.setItem(localKey, dbStr);
                            console.log(`Real-time sync: updated ${localKey} from Firestore collection [${firestoreCol}].`);
                            refreshActiveView();
                        }
                    }
                }
            }, err => {
                console.error(`Firestore listener error for ${rawKey}:`, err.message);
            });
        } catch(e) {
            console.error("Firestore collection listener error:", e);
        }
    });

    // Real-time snapshot listeners on sub-user isolated collections
    try {
        const colLines = isMaster ? "lines" : `workspace_${user.username || user.id}_lines`;
        const colBookings = isMaster ? "bookings" : `workspace_${user.username || user.id}_bookings`;
        const colPayments = isMaster ? "payments" : `workspace_${user.username || user.id}_payments`;

        db.collection(colLines).onSnapshot(snapshot => {
            const linesList = [];
            snapshot.forEach(doc => linesList.push(doc.data()));
            if (linesList.length >= 0) {
                const keyLines = getWorkspaceKey('lines_data');
                localStorage.setItem(keyLines, JSON.stringify(linesList));
                refreshActiveView();
            }
        }, err => console.error(`Firestore '${colLines}' snapshot error:`, err));

        db.collection(colBookings).onSnapshot(snapshot => {
            const bookingsList = [];
            snapshot.forEach(doc => bookingsList.push(doc.data()));
            if (bookingsList.length >= 0) {
                const keyWaiting = getWorkspaceKey('waiting_list');
                localStorage.setItem(keyWaiting, JSON.stringify(bookingsList));
                refreshActiveView();
            }
        }, err => console.error(`Firestore '${colBookings}' snapshot error:`, err));

        db.collection(colPayments).onSnapshot(snapshot => {
            const paymentsObj = {};
            snapshot.forEach(doc => paymentsObj[doc.id] = doc.data());
            if (Object.keys(paymentsObj).length >= 0) {
                const keyPay = getWorkspaceKey('payments_records');
                localStorage.setItem(keyPay, JSON.stringify(paymentsObj));
                refreshActiveView();
            }
        }, err => console.error(`Firestore '${colPayments}' snapshot error:`, err));
    } catch(e) {
        console.error("Firestore direct collections listeners setup error:", e);
    }
}

function saveToFirestore(key, value) {
    if (!db) {
        console.warn(`saveToFirestore warning: Firestore 'db' is not initialized when saving '${key}'.`);
        return;
    }
    const user = getCurrentUser();
    const isMaster = isMasterAdmin();
    const firestoreCol = isMaster ? "smart_net_manager" : `workspace_${user.username || user.id}`;
    const docKey = key.startsWith('workspace_') ? key.replace(/^workspace_[^_]+_/, '') : key;

    try {
        db.collection(firestoreCol).doc(docKey).set({ value: value })
          .then(() => console.log(`Saved ${docKey} to Firestore collection [${firestoreCol}] successfully.`))
          .catch(err => console.error(`Failed to save ${docKey} to Firestore:`, err));
    } catch(e) {
        console.error("Firestore save error:", e);
    }
}

// Dynamic Pricing Accessors & Fixed Pricing Table
const defaultPrices = {
    10: 170,
    15: 210,
    20: 240,
    30: 300,
    40: 380,
    50: 450,
    60: 520,
    70: 600,
    80: 670,
    100: 770
};

function getPricing() {
    let pricing = localStorage.getItem('package_pricing');
    if (!pricing) {
        pricing = { ...defaultPrices };
        localStorage.setItem('package_pricing', JSON.stringify(pricing));
    } else {
        try {
            pricing = JSON.parse(pricing);
        } catch(e) {
            pricing = { ...defaultPrices };
        }
        if (pricing && pricing.waiting) {
            pricing = pricing.waiting;
        }
        if (!pricing || typeof pricing !== 'object') pricing = { ...defaultPrices };
        
        // Migration check for legacy seed defaults (e.g. 10: 210)
        if (pricing[10] === 210 && pricing[20] === 290) {
            pricing = { ...defaultPrices };
            localStorage.setItem('package_pricing', JSON.stringify(pricing));
            return pricing;
        }
        
        let updated = false;
        for (let gb in defaultPrices) {
            if (pricing[gb] === undefined || pricing[gb] === null || isNaN(pricing[gb])) {
                pricing[gb] = defaultPrices[gb];
                updated = true;
            }
        }
        if (updated) {
            localStorage.setItem('package_pricing', JSON.stringify(pricing));
        }
    }
    return pricing;
}

function savePricing(pricing) {
    localStorage.setItem('package_pricing', JSON.stringify(pricing));
    saveToFirestore('package_pricing', pricing);
}

const getPackages = () => getPricing();
const getWaitingPrices = () => getPricing();

const TRANSLATIONS = {
    en: {
        navDashboard: "Dashboard",
        navChat: "Booking Chat",
        navReserved: "Reserved Bundles",
        navPayments: "Payments & Accounts",
        navLines: "Lines Directory",
        navSearch: "Operations & Query",
        navLogout: "Logout",
        dashboardTitle: "System Dashboard",
        dashboardSubtitle: "Observe capacities, revenue streams, and run Smart Allocation solvers.",
        totalLines: "Total Lines",
        activeTrunks: "Active cellular trunks",
        fullLines: "Full Lines",
        operatingLimits: "Lines operating at maximum limits",
        pendingPool: "Pending Pool",
        accumulatedVolume: "Accumulated reservation volume:",
        activeRevenue: "Active Revenue",
        basedAllocated: "Based on allocated customer lines",
        utilizationTitle: "Total Gigabytes Utilization",
        used: "Used:",
        totalCapacity: "Total Capacity:",
        operationsTitle: "Allocation Operations",
        operationsSubtitle: "Run the optimization algorithm to bind all pending bookings or wipe allocated data for a new month.",
        resetBtn: " WRECK / Reset Allocations",
        triggerBtn: "⚡ Trigger Smart Allocation",
        inventoryTitle: "Management Unit",
        noLines: "No billing lines registered. Navigate to the Lines Directory to register cellular trunks.",
        gigaQuota: "Giga Quota",
        splitMembers: "Split Members",
        assignedMembers: "Assigned Members:",
        callMinutes: "Call minutes:",
        min: "Min",
        available: "Available",
        full: "Full",
        remainingSlotsLabel: "Remaining:",
        copyBtn: "📋 Copy Numbers",
        monthlyArchivesTitle: "Monthly Archives",
        btnManageArchives: "Manage Archives",
        noArchivesFound: "No archives found.",
        waitingListTitle: "Waiting List / Unassigned Bookings",
        thCustomer: "Customer Number",
        thPackage: "Requested Package",
        thPrice: "Price",
        thStatus: "Status",
        noWaitingItems: "No customers in the waiting list.",
        noAvailableSlot: "No Available Slot",
        copyWaitingListBtn: "📋 Copy Waiting List",
        clearWaitingListBtn: "🗑️ Clear All",
        manualAllocationBtn: "🖐️ Manual Allocation",
        manualModalTitle: "🖐️ Manual Order Allocation",
        linesTitle: "Lines Directory",
        linesSubtitle: "Perform CRUD configurations on fluid billing line packages.",
        regLineTitle: "Register New Line",
        editLineTitle: "Edit Line Info",
        lblLineNum: "Line Number",
        lblTotalGB: "Total Gigabytes (GB)",
        lblTotalMins: "Total Call Minutes",
        lblMaxMembers: "Max Split Members",
        btnRegisterTrunk: "Register Trunk",
        btnSaveChanges: "Save Changes",
        btnCancel: "Cancel",
        thLineNum: "Line Number",
        thGigaCap: "Giga Capacity",
        thMinsCap: "Mins Capacity",
        thSplitSeats: "Split Seats",
        thActions: "Actions",
        chatTitle: "Pre-Month Booking Chat",
        chatSubtitle: "Collect customer reservations at lightning speed using chat input shorthand.",
        feedTitle: "Interactive Booking Feed",
        shorthandLabel: "Shorthand: [Phone] [GB] or edit [Phone] [GB]",
        btnBook: "Book",
        pendingPoolTitle: "Pending Pool",
        noPendingBookings: "No pending bookings.",
        searchTitle: "Operations & Reports",
        searchSubtitle: "Search available slots for late client bookings and extract line breakdown reports.",
        slotFinderTitle: "Real-time Slot Finder",
        lblPackageSize: "Package Size (GB)",
        reportTitle: "Final Month Allocation Report",
        reportSubtitle: "Overview of allocated bookings mapped across trunks.",
        btnPrintReport: "Print Report"
    },
    ar: {
        navDashboard: "لوحة التحكم",
        navChat: "شات الحجوزات",
        navReserved: "الباقات المحجوزة",
        navPayments: "الدفعات والحسابات",
        navLines: "دليل الخطوط",
        navSearch: "العمليات والاستعلام",
        navLogout: "تسجيل الخروج",
        dashboardTitle: "لوحة التحكم بالنظام",
        dashboardSubtitle: "مراقبة السعات، وتدفقات الإيرادات، وتشغيل خوارزميات التوزيع الذكي.",
        totalLines: "إجمالي الخطوط",
        activeTrunks: "الخطوط الخلوية النشطة",
        fullLines: "الخطوط الممتلئة",
        operatingLimits: "الخطوط التي وصلت للحدود القصوى",
        pendingPool: "قائمة الحجوزات المعلقة",
        accumulatedVolume: "حجم الحجوزات المتراكمة:",
        activeRevenue: "الإيرادات النشطة",
        basedAllocated: "بناءً على الخطوط الموزعة للعملاء",
        utilizationTitle: "معدل استهلاك الجيجابايت الكلي",
        used: "المستهلك:",
        totalCapacity: "السعة الإجمالية:",
        operationsTitle: "عمليات التوزيع والتحكم",
        operationsSubtitle: "قم بتشغيل خوارزمية التوزيع لربط الحجوزات المعلقة أو مسح التوزيع لبدء شهر جديد.",
        resetBtn: " مسح وإعادة تعيين التوزيعات",
        triggerBtn: "⚡ بدء التوزيع الذكي",
        inventoryTitle: "لوحدة الإدارة",
        noLines: "لا توجد خطوط اتصالات مسجلة. اذهب إلى دليل الخطوط لتسجيل خطوط جديدة.",
        gigaQuota: "حصة الجيجابايت",
        splitMembers: "المشتركين",
        assignedMembers: "الأرقام الموزعة:",
        callMinutes: "دقائق الاتصال:",
        min: "دقيقة",
        available: "متاح",
        full: "ممتلئ",
        remainingSlotsLabel: "المتبقي في الخط:",
        copyBtn: "📋 نسخ الأرقام",
        monthlyArchivesTitle: "أرشيف الشهور السابقة",
        btnManageArchives: "إدارة الأرشيف",
        noArchivesFound: "لا يوجد أرشيفات سابقة حالياً.",
        waitingListTitle: "قائمة الانتظار - أرقام خارج التوزيعة",
        thCustomer: "رقم العميل",
        thPackage: "الباقة المطلوبة",
        thPrice: "السعر",
        thStatus: "الحالة",
        noWaitingItems: "لا يوجد عملاء في قائمة الانتظار.",
        noAvailableSlot: "خارج التوزيعة",
        copyWaitingListBtn: "📋 نسخ قائمة الانتظار",
        clearWaitingListBtn: "🗑️ مسح الكل",
        manualAllocationBtn: "🖐️ توزيع يدوي",
        manualModalTitle: "🖐️ التوزيع اليدوي للحجوزات المعلقة",
        linesTitle: "دليل الخطوط الخلوية",
        linesSubtitle: "إضافة وتعديل وحذف خطوط الاتصالات وباقات الاتصالات النشطة.",
        regLineTitle: "تسجيل خط اتصالات جديد",
        editLineTitle: "تعديل بيانات الخط",
        lblLineNum: "رقم الخط",
        lblTotalGB: "إجمالي الجيجابايت (جيجا)",
        lblTotalMins: "إجمالي دقائق الاتصال",
        lblMaxMembers: "الحد الأقصى للمشتركين",
        btnRegisterTrunk: "تسجيل الخط",
        btnSaveChanges: "حفظ التغييرات",
        btnCancel: "إلغاء",
        thLineNum: "رقم الخط",
        thGigaCap: "سعة الجيجابايت",
        thMinsCap: "سعة الدقائق",
        thSplitSeats: "مقاعد المشتركين",
        thActions: "العمليات",
        chatTitle: "شات الحجوزات السريعة",
        chatSubtitle: "تجميع وحجز رصيد العملاء بسرعة فائقة باستخدام أوامر الشات السريعة.",
        feedTitle: "موجز الحجوزات التفاعلي",
        shorthandLabel: "الاختصار: [رقم الهاتف] [جيجا] أو تعديل [رقم الهاتف] [جيجا]",
        btnBook: "حجز",
        pendingPoolTitle: "الحجوزات المعلقة",
        noPendingBookings: "لا توجد حجوزات معلقة حالياً.",
        searchTitle: "العمليات والتقارير",
        searchSubtitle: "البحث عن مقاعد خطوط خالية للحجوزات المتأخرة وتصدير تقارير التوزيع.",
        slotFinderTitle: "مستكشف المقاعد الشاغرة",
        lblPackageSize: "حجم الباقة (جيجا)",
        reportTitle: "تقرير توزيع الحجوزات للشهر الحالي",
        reportSubtitle: "نظرة عامة تفصيلية على الحجوزات الموزعة عبر خطوط الاتصالات.",
        btnPrintReport: "طباعة التقرير"
    }
};

const MESSAGES = {
    en: {
        confirmReset: "⚠️ WARNING: Clear all line allocations?\n\nThis will clear all mappings and set lines back to available. It will keep line records and bookings pool intact. Proceed?",
        confirmSolver: "Run optimization solver? All pending bookings will be packed into available telecom lines.",
        runningSolver: "Solving Multi-Constraint Packing...",
        solvingSuccess: "Allocation packing completed successfully!",
        solvingError: "Optimization error: ",
        resetSuccess: "Database reset successful.",
        resetError: "Reset failed: ",
        confirmNewMonth: "🧹 Are you sure you want to archive all bookings and start a new month? All current mappings will be backed up into history and reset."
    },
    ar: {
        confirmReset: "⚠️ تحذير: هل أنت متأكد من مسح جميع التوزيعات؟\n\nسيؤدي هذا إلى إعادة ضبط الخطوط لتصبح متاح. لن يتم حذف الخطوط أو أرقام العملاء. هل تريد المتابعة؟",
        confirmSolver: "تشغيل خوارزمية التوزيع؟ سيتم تعبئة جميع الحجوزات المعلقة في الخطوط المتاحة.",
        runningSolver: "جاري تشغيل خوارزمية التوزيع المتقدمة...",
        solvingSuccess: "تمت عملية التوزيع وتعبئة الخطوط بنجاح!",
        solvingError: "فشل التوزيع: ",
        resetSuccess: "تمت عملية إعادة التعيين بنجاح.",
        resetError: "فشلت عملية إعادة التعيين: ",
        confirmNewMonth: "🧹 هل أنت متأكد من تصفير الحجوزات وبدء شهر جديد؟ (سيتم نقل جميع الحجوزات للأرشيف التاريخي وتصفير الشات)"
    }
};

// -------------------------------------------------------------
// LOCALSTORAGE DATA LAYER HANDLERS & SEEDING
// -------------------------------------------------------------

function getDefaultLines() {
    return [
        { id: 1, line_number: '01505555808', total_gigas: 70, total_minutes: 9000, max_members: 5, status: 'available', bookings: [] },
        { id: 2, line_number: '01505555625', total_gigas: 130, total_minutes: 10000, max_members: 6, status: 'available', bookings: [] },
        { id: 3, line_number: '01509999819', total_gigas: 70, total_minutes: 9000, max_members: 5, status: 'available', bookings: [] },
        { id: 4, line_number: '01599990133', total_gigas: 70, total_minutes: 9000, max_members: 5, status: 'available', bookings: [] },
        { id: 5, line_number: '01500093555', total_gigas: 70, total_minutes: 9000, max_members: 5, status: 'available', bookings: [] },
        { id: 6, line_number: '01509057000', total_gigas: 130, total_minutes: 10000, max_members: 6, status: 'available', bookings: [] }
    ];
}

function getCurrentUser() {
    try {
        const u = JSON.parse(localStorage.getItem('current_user') || 'null');
        if (u) return u;
    } catch(e) {}
    return { id: 'admin', username: 'admin', role: 'master' };
}

function isMasterAdmin() {
    const user = getCurrentUser();
    if (!user) return true;
    return user.role === 'master' || user.role === 'admin' || user.username === 'admin';
}

function getWorkspaceKey(key) {
    if (isMasterAdmin()) {
        return key;
    }
    const user = getCurrentUser();
    const userId = user ? (user.id || user.username) : 'guest';
    return `workspace_${userId}_${key}`;
}

function initLocalStorage() {
    const isMaster = isMasterAdmin();
    const keyLines = getWorkspaceKey('lines_data');
    const keyWaiting = getWorkspaceKey('waiting_list');
    const keyChat = getWorkspaceKey('chat_history');
    const keyArchived = getWorkspaceKey('archived_months');

    let linesStr = localStorage.getItem(keyLines);
    if (linesStr === null) {
        if (isMaster) {
            localStorage.setItem(keyLines, JSON.stringify(getDefaultLines()));
        } else {
            localStorage.setItem(keyLines, JSON.stringify([]));
        }
    }
    if (localStorage.getItem(keyWaiting) === null) {
        localStorage.setItem(keyWaiting, JSON.stringify([]));
    }
    if (localStorage.getItem(keyChat) === null) {
        localStorage.setItem(keyChat, JSON.stringify([]));
    }
    if (localStorage.getItem(keyArchived) === null) {
        localStorage.setItem(keyArchived, JSON.stringify([]));
    }
    getPricing();
}

function getLines() {
    let lines = [];
    const keyLines = getWorkspaceKey('lines_data');
    try {
        lines = JSON.parse(localStorage.getItem(keyLines) || '[]');
    } catch (e) {
        lines = [];
    }
    if (isMasterAdmin() && (!Array.isArray(lines) || lines.length === 0)) {
        lines = getDefaultLines();
        localStorage.setItem(keyLines, JSON.stringify(lines));
    }
    return (Array.isArray(lines) ? lines : []).map(line => {
        if (line.total_gigas === 70 && (!line.max_members || line.max_members <= 0)) {
            line.max_members = 5;
        }
        if (!line.bookings && line.allocatedNumbers) {
            line.bookings = line.allocatedNumbers;
        }
        if (!line.bookings) line.bookings = [];
        line.allocatedNumbers = line.bookings;
        return line;
    });
}

function saveLines(lines) {
    lines.forEach(line => {
        if (line.allocatedNumbers && (!line.bookings || line.bookings.length === 0)) {
            line.bookings = line.allocatedNumbers;
        }
        line.allocatedNumbers = line.bookings || [];
    });
    const keyLines = getWorkspaceKey('lines_data');
    localStorage.setItem(keyLines, JSON.stringify(lines));
    saveToFirestore(keyLines, lines);

    if (db) {
        try {
            lines.forEach(line => {
                const docId = String(line.id || line.line_number);
                db.collection('lines').doc(docId).set(line, { merge: true })
                  .catch(err => console.error(`Firestore save line [${docId}] error:`, err));
            });
        } catch(e) {
            console.error('Firestore saveLines error:', e);
        }
    }
}

function getWaitingList() {
    const keyWaiting = getWorkspaceKey('waiting_list');
    let list = [];
    try {
        list = JSON.parse(localStorage.getItem(keyWaiting) || '[]');
    } catch(e) {
        list = [];
    }

    if (!Array.isArray(list) || list.length === 0) return [];

    try {
        const linesKey = getWorkspaceKey('lines_data');
        const linesStr = localStorage.getItem(linesKey);
        if (!linesStr) return list;
        const lines = JSON.parse(linesStr);

        const allocatedPhones = new Set();
        if (Array.isArray(lines)) {
            lines.forEach(line => {
                const bookings = line.bookings || line.allocatedNumbers || [];
                bookings.forEach(b => {
                    if (b.isBundle && (b.members || b.items)) {
                        (b.members || b.items).forEach(m => {
                            const phone = m.customer_number || m.phone;
                            if (phone) allocatedPhones.add(String(phone).trim());
                        });
                    } else {
                        const phone = b.customer_number || b.phone;
                        if (phone) allocatedPhones.add(String(phone).trim());
                    }
                });
            });
        }

        if (allocatedPhones.size > 0) {
            const initialLen = list.length;
            list = list.filter(item => {
                if (item.isBundle && item.members) {
                    item.members = item.members.filter(m => !allocatedPhones.has(String(m.customer_number || m.phone).trim()));
                    return item.members.length > 0;
                } else {
                    const phone = String(item.customer_number || item.phone || '').trim();
                    return !allocatedPhones.has(phone);
                }
            });

            if (list.length !== initialLen) {
                localStorage.setItem(keyWaiting, JSON.stringify(list));
            }
        }
    } catch(e) {
        console.warn('getWaitingList auto-filter notice:', e);
    }

    return list;
}

function saveWaitingList(list) {
    const keyWaiting = getWorkspaceKey('waiting_list');
    localStorage.setItem(keyWaiting, JSON.stringify(list));
    saveToFirestore(keyWaiting, list);

    if (db) {
        try {
            if (list.length === 0) {
                db.collection('bookings').get().then(snapshot => {
                    snapshot.forEach(doc => doc.ref.delete().catch(err => console.error('Firestore clear booking error:', err)));
                }).catch(err => console.error('Firestore query bookings error:', err));
            } else {
                const currentIds = new Set(list.map(item => String(item.id || item.customer_number || item.phone)));
                
                list.forEach(item => {
                    const docId = String(item.id || item.customer_number || item.phone);
                    db.collection('bookings').doc(docId).set(item, { merge: true })
                      .catch(err => console.error(`Firestore save booking [${docId}] error:`, err));
                });

                db.collection('bookings').get().then(snapshot => {
                    snapshot.forEach(doc => {
                        if (!currentIds.has(doc.id)) {
                            doc.ref.delete().catch(err => console.error(`Firestore cleanup booking doc [${doc.id}] error:`, err));
                        }
                    });
                }).catch(err => console.error('Firestore cleanup query error:', err));
            }
        } catch(e) {
            console.error('Firestore saveWaitingList error:', e);
        }
    }
}

function getChatHistory() {
    const keyChat = getWorkspaceKey('chat_history');
    try {
        return JSON.parse(localStorage.getItem(keyChat) || '[]');
    } catch(e) {
        return [];
    }
}

function saveChatHistory(history) {
    const keyChat = getWorkspaceKey('chat_history');
    localStorage.setItem(keyChat, JSON.stringify(history));
    saveToFirestore(keyChat, history);
}

function triggerCloudLoad() {
    loadFirebase().then(() => {
        initFirebase();
    });
}

function getArchivedMonths() {
    const keyArchived = getWorkspaceKey('archived_months');
    try {
        return JSON.parse(localStorage.getItem(keyArchived) || '[]');
    } catch(e) {
        return [];
    }
}

function saveArchivedMonths(archives) {
    const keyArchived = getWorkspaceKey('archived_months');
    localStorage.setItem(keyArchived, JSON.stringify(archives));
    saveToFirestore(keyArchived, archives);
}

function refreshActiveView() {
    if (document.getElementById('kpiTotalLines') || document.getElementById('overallPercentage')) {
        renderDashboard();
    }
    if (document.getElementById('linesTableBody')) {
        renderLinesDirectory();
    }
    if (document.getElementById('chatForm')) {
        renderChatPage();
    }
    if (document.getElementById('gigaSearchInput')) {
        renderSearchPage();
    }
    if (document.getElementById('archivesTableBody')) {
        renderArchivesPage();
    }
    if (typeof renderReservedBundlesPage === 'function' && document.getElementById('reservedBundlesTbody')) {
        renderReservedBundlesPage();
    }
    if (typeof renderPaymentsPage === 'function' && document.getElementById('paymentsTbody')) {
        renderPaymentsPage();
    }
}

// -------------------------------------------------------------
// CORE BUSINESS ALGORITHMS
// -------------------------------------------------------------

// Pure EGP Revenue Maximization Solver using 0/1 Multi-Dimensional Knapsack DP
function findOptimalPackageCombination(waitingQueue, lineCapacity, maxSlots) {
    if (!waitingQueue || !Array.isArray(waitingQueue) || waitingQueue.length === 0 || lineCapacity <= 0 || maxSlots <= 0) {
        return { selectedBookings: [], totalRevenue: 0, totalGB: 0 };
    }

    const validQueue = waitingQueue.filter(item => item && parseInt(item.package_gigas) <= lineCapacity);
    const N = validQueue.length;
    if (N === 0) {
        return { selectedBookings: [], totalRevenue: 0, totalGB: 0 };
    }

    // dp[k][w] stores { revenue, totalGB, items: [] }
    let dp = Array.from({ length: maxSlots + 1 }, () =>
        Array.from({ length: lineCapacity + 1 }, () => ({
            revenue: 0,
            totalGB: 0,
            items: []
        }))
    );

    const pricing = getPricing();

    for (let i = 0; i < N; i++) {
        const item = validQueue[i];
        const itemGB = parseInt(item.package_gigas);
        const itemPrice = parseInt(item.package_price) || (pricing[itemGB] || 0);

        // Dynamic Programming state transition backwards to avoid reusing item
        for (let k = maxSlots; k >= 1; k--) {
            for (let w = lineCapacity; w >= itemGB; w--) {
                const prev = dp[k - 1][w - itemGB];
                const newRev = prev.revenue + itemPrice;
                const newGB = prev.totalGB + itemGB;
                const current = dp[k][w];

                if (newRev > current.revenue || (newRev === current.revenue && newGB > current.totalGB)) {
                    dp[k][w] = {
                        revenue: newRev,
                        totalGB: newGB,
                        items: [...prev.items, item]
                    };
                }
            }
        }
    }

    let best = { revenue: -1, totalGB: -1, items: [] };
    for (let k = 0; k <= maxSlots; k++) {
        for (let w = 0; w <= lineCapacity; w++) {
            const candidate = dp[k][w];
            if (candidate.revenue > best.revenue || 
               (candidate.revenue === best.revenue && candidate.totalGB > best.totalGB)) {
                best = candidate;
            }
        }
    }

    return {
        selectedBookings: best.items,
        totalRevenue: best.revenue,
        totalGB: best.totalGB
    };
}

function triggerSmartAllocation() {
    let lines = getLines();
    let waiting = getWaitingList();
    
    if (lines.length === 0 || waiting.length === 0) {
        return { success: false, assigned_count: 0 };
    }
    
    lines.sort((a, b) => a.id - b.id);
    
    let totalAssignedCount = 0;
    
    lines.forEach(line => {
        if (!line.bookings) line.bookings = [];
        
        const usedGigas = line.bookings.reduce((sum, b) => sum + parseInt(b.package_gigas || 0), 0);
        const currentMembers = line.bookings.length;
        
        const remCapacity = line.total_gigas - usedGigas;
        const remSlots = line.max_members - currentMembers;
        
        if (remCapacity <= 0 || remSlots <= 0 || waiting.length === 0) {
            return;
        }
        
        const result = findOptimalPackageCombination(waiting, remCapacity, remSlots);
        
        if (result.selectedBookings && result.selectedBookings.length > 0) {
            const selectedIds = new Set(result.selectedBookings.map(b => String(b.id)));
            const selectedPhones = new Set(result.selectedBookings.map(b => String(b.customer_number || b.phone || '').trim()));
            
            result.selectedBookings.forEach(booking => {
                booking.assigned_line_id = line.id;
                line.bookings.push(booking);
                totalAssignedCount++;

                if (db) {
                    try {
                        const docId = String(booking.id || booking.customer_number || booking.phone);
                        db.collection('bookings').doc(docId).delete().catch(err => console.error(err));
                    } catch(e) {}
                }
            });
            
            waiting = waiting.filter(b => {
                const bId = String(b.id);
                const bPhone = String(b.customer_number || b.phone || '').trim();
                return !selectedIds.has(bId) && !selectedPhones.has(bPhone);
            });
        }
        
        const updatedUsedGigas = line.bookings.reduce((sum, b) => sum + parseInt(b.package_gigas || 0), 0);
        const updatedMembers = line.bookings.length;
        const isFull = (updatedUsedGigas >= line.total_gigas) || (updatedMembers >= line.max_members);
        line.status = isFull ? 'full' : 'available';
    });
    
    saveLines(lines);
    saveWaitingList(waiting);
    
    return { success: true, assigned_count: totalAssignedCount };
}

function unassignOrderFromLine(phone, lineId, bookingId, memberIndex) {
    let lines = getLines();
    let waiting = getWaitingList();
    
    const targetLine = lines.find(l => l.id === parseInt(lineId) || String(l.line_number) === String(lineId));
    if (!targetLine) {
        console.warn(`Line not found: ${lineId}`);
        return false;
    }

    const bookingsList = targetLine.bookings || targetLine.allocatedNumbers || [];
    let foundIndex = -1;

    if (bookingId) {
        foundIndex = bookingsList.findIndex(b => b.id === parseInt(bookingId) || b.id === bookingId);
    }
    if (foundIndex === -1 && phone) {
        foundIndex = bookingsList.findIndex(b => {
            if (b.customer_number === phone || b.phone === phone) return true;
            if (b.isBundle && (b.members || b.items || b.numbers)) {
                const subItems = b.members || b.items || b.numbers;
                return subItems.some(m => (m.customer_number || m.phone) === phone);
            }
            return false;
        });
    }

    if (foundIndex !== -1) {
        const targetOrder = bookingsList[foundIndex];

        if (targetOrder.isBundle && (targetOrder.members || targetOrder.items || targetOrder.numbers)) {
            const subItems = targetOrder.members || targetOrder.items || targetOrder.numbers;
            let targetSubIdx = -1;

            if (memberIndex !== undefined && memberIndex !== null && !isNaN(parseInt(memberIndex))) {
                targetSubIdx = parseInt(memberIndex);
            } else if (phone) {
                targetSubIdx = subItems.findIndex(m => (m.customer_number || m.phone) === phone);
            }

            if (targetSubIdx !== -1 && targetSubIdx < subItems.length) {
                const [removedMember] = subItems.splice(targetSubIdx, 1);
                
                const returnedOrder = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    customer_number: removedMember.customer_number || removedMember.phone,
                    package_gigas: parseInt(removedMember.package_gigas || removedMember.gb || removedMember.gigas || 10),
                    package_price: parseInt(removedMember.package_price || removedMember.price || 0),
                    package_minutes: parseInt(removedMember.package_minutes || removedMember.minutes || 1000),
                    assigned_line_id: null,
                    booking_date: new Date().toISOString()
                };

                waiting.push(returnedOrder);

                if (subItems.length === 0) {
                    bookingsList.splice(foundIndex, 1);
                } else {
                    targetOrder.total_gigas = subItems.reduce((sum, item) => sum + parseInt(item.package_gigas || item.gb || 0), 0);
                    targetOrder.total_price = subItems.reduce((sum, item) => sum + parseInt(item.package_price || item.price || 0), 0);
                }
            } else {
                bookingsList.splice(foundIndex, 1);
                targetOrder.assigned_line_id = null;
                waiting.push(targetOrder);
            }
        } else {
            const [removedOrder] = bookingsList.splice(foundIndex, 1);
            removedOrder.assigned_line_id = null;
            
            const existsInWaiting = waiting.some(w => (w.id && removedOrder.id && w.id === removedOrder.id) || w.customer_number === removedOrder.customer_number);
            if (!existsInWaiting) {
                waiting.push(removedOrder);
            }
        }

        targetLine.bookings = bookingsList;
        targetLine.allocatedNumbers = bookingsList;

        let updatedUsedGigas = 0;
        let updatedMembers = 0;

        bookingsList.forEach(b => {
            if (b.isBundle && (b.members || b.items || b.numbers)) {
                const subs = b.members || b.items || b.numbers;
                updatedMembers += subs.length;
                subs.forEach(m => updatedUsedGigas += parseInt(m.package_gigas || m.gb || 0));
            } else {
                updatedMembers += 1;
                updatedUsedGigas += parseInt(b.package_gigas || b.gb || 0);
            }
        });

        const isFull = (updatedUsedGigas >= targetLine.total_gigas) || (updatedMembers >= targetLine.max_members);
        targetLine.status = isFull ? 'full' : 'available';

        saveLines(lines);
        saveWaitingList(waiting);

        console.log(`[Unassign] Customer ${phone || 'bundle'} removed from line ${targetLine.line_number}. Restored to waiting list.`);
        refreshActiveView();
        return true;
    }
    return false;
}

function resetAllocations() {
    let lines = getLines();
    let waiting = getWaitingList();

    const initialPendingCount = waiting.length;
    let initialAllocatedCount = 0;
    
    const allAllocatedOrders = [];
    lines.forEach(line => {
        const allocated = line.bookings || line.allocatedNumbers || [];
        initialAllocatedCount += allocated.length;
        allocated.forEach(order => {
            order.assigned_line_id = null;
            allAllocatedOrders.push(order);
        });
        
        line.bookings = [];
        line.allocatedNumbers = [];
        line.status = 'available';
    });

    const expectedTotalOrders = initialPendingCount + initialAllocatedCount;
    const combinedOrders = [...waiting, ...allAllocatedOrders];

    const deduplicatedMap = new Map();
    combinedOrders.forEach(order => {
        const key = order.id || order.customer_number;
        if (!deduplicatedMap.has(key)) {
            deduplicatedMap.set(key, order);
        }
    });

    const finalPendingOrders = Array.from(deduplicatedMap.values());

    console.log(`[Reset Allocations Audit] Initial Pending: ${initialPendingCount}, Initial Allocated: ${initialAllocatedCount}, Expected Total: ${expectedTotalOrders}, Final Reset Pending Count: ${finalPendingOrders.length}`);
    
    if (finalPendingOrders.length < expectedTotalOrders) {
        console.warn(`[Reset Allocations] ${expectedTotalOrders - finalPendingOrders.length} duplicate items consolidated.`);
    }

    saveLines(lines);
    saveWaitingList(finalPendingOrders);
    refreshActiveView();

    return true;
}

function deleteAllBookings() {
    let lines = getLines();
    lines.forEach(line => {
        line.bookings = [];
        line.allocatedNumbers = [];
        line.status = 'available';
    });
    saveLines(lines);

    saveWaitingList([]);
    saveChatHistory([]);

    const keyReserved = getWorkspaceKey('reserved_bundles');
    localStorage.setItem(keyReserved, JSON.stringify([]));
    saveToFirestore(keyReserved, []);

    if (db) {
        try {
            db.collection('bookings').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete().catch(err => console.warn('Firestore booking delete err:', err)));
            }).catch(err => console.warn('Firestore bookings query err:', err));
        } catch(e) {}
    }

    refreshActiveView();
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
    return true;
}

function archiveMonthData() {
    const lines = getLines();
    const waiting = getWaitingList();
    
    let allBooked = [];
    lines.forEach(line => {
        if (line.bookings) {
            line.bookings.forEach(b => {
                allBooked.push({
                    customer_number: b.customer_number || b.phone || '',
                    package_gigas: b.package_gigas || b.gb || 0,
                    package_price: b.package_price || b.price || 0,
                    package_minutes: b.package_minutes || b.minutes || 0,
                    assigned_line_id: line.id,
                    line_number: line.line_number
                });
            });
        }
    });

    waiting.forEach(b => {
        allBooked.push({
            customer_number: b.customer_number || b.phone || '',
            package_gigas: b.package_gigas || b.gb || 0,
            package_price: b.package_price || b.price || 0,
            package_minutes: b.package_minutes || b.minutes || 0,
            assigned_line_id: null,
            line_number: 'قائمة الانتظار'
        });
    });
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = new Date();
    const monthName = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const month_year = `${monthName}_${year}`;
    
    let archives = getArchivedMonths();
    archives = archives.filter(item => item.month_year !== month_year);
    
    const archiveRecord = {
        id: `archive_${Date.now()}`,
        month_year: month_year,
        name: `${monthName} ${year}`,
        date: new Date().toISOString(),
        bookings: allBooked,
        total_bookings_count: allBooked.length
    };

    archives.push(archiveRecord);
    saveArchivedMonths(archives);

    if (db) {
        try {
            db.collection('archived_months').doc(month_year).set(archiveRecord, { merge: true })
              .catch(err => console.error('Firestore archived_months doc save err:', err));

            db.collection('bookings').get().then(snapshot => {
                snapshot.forEach(doc => {
                    doc.ref.delete().catch(err => console.error('Firestore delete booking doc err:', err));
                });
            }).catch(err => console.error('Firestore query bookings err:', err));
        } catch(e) {
            console.error('Firestore archive sync error:', e);
        }
    }
    
    saveWaitingList([]);
    saveChatHistory([]);
    lines.forEach(line => {
        line.bookings = [];
        line.allocatedNumbers = [];
        line.status = 'available';
    });
    saveLines(lines);
    
    return { success: true, month_name: monthName + ' ' + year };
}

// -------------------------------------------------------------
// MANUAL ALLOCATION MODULE
// -------------------------------------------------------------
const LINE_NAMES = {
    "01505555808": { ar: "محمد", en: "Mohamed" },
    "01505555625": { ar: "عمر", en: "Omar" },
    "01500093555": { ar: "ايهاب", en: "Ehab" },
    "01509999819": { ar: "كريم", en: "Kareem" },
    "01599990133": { ar: "حسام", en: "Hossam" },
    "01509057000": { ar: "ابراهيم", en: "Ibrahim" }
};

function getLineDisplayName(line, lang = 'ar') {
    if (line.ownerName) return line.ownerName;
    if (line.name) return line.name;
    const mapping = LINE_NAMES[line.line_number];
    if (mapping) {
        return mapping[lang] || mapping.ar || mapping.en;
    }
    return line.line_number ? String(line.line_number).slice(-3) : line.id;
}

function getGBBadgeColorClass(gb) {
    const val = parseInt(gb || 0);
    if (val <= 10) return 'gb-tier-10';
    if (val <= 30) return 'gb-tier-20';
    if (val <= 60) return 'gb-tier-50';
    if (val <= 80) return 'gb-tier-70';
    return 'gb-tier-100';
}

function renderManualAllocationModal() {
    const modalBody = document.getElementById('manualModalBody');
    if (!modalBody) return;
    
    const lines = getLines();
    const waiting = getWaitingList();
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
    
    modalBody.innerHTML = '';
    
    if (waiting.length === 0) {
        modalBody.innerHTML = `
            <div style="text-align: center; color: var(--text-dim); padding: 40px 10px; font-size: 0.95rem;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">📋</div>
                <p>${lang === 'ar' ? 'لا توجد حجوزات معلقة في قائمة الانتظار حالياً.' : 'No pending bookings in waiting list currently.'}</p>
            </div>
        `;
        return;
    }
    
    // Sort pending items: Primary = Package GB Ascending, Secondary = Timestamp/Date Ascending
    const sortedWaiting = [...waiting].sort((a, b) => {
        const gbA = a.isBundle ? (a.total_gigas || 0) : parseInt(a.package_gigas || 0);
        const gbB = b.isBundle ? (b.total_gigas || 0) : parseInt(b.package_gigas || 0);
        if (gbA !== gbB) {
            return gbA - gbB;
        }
        const timeA = a.booking_date ? new Date(a.booking_date).getTime() : (a.id || 0);
        const timeB = b.booking_date ? new Date(b.booking_date).getTime() : (b.id || 0);
        return timeA - timeB;
    });

    sortedWaiting.forEach(item => {
        const isBundle = !!(item.isBundle && item.members && item.members.length > 0);
        const reqGB = isBundle
            ? (item.total_gigas || item.members.reduce((s, m) => s + parseInt(m.package_gigas || m.gb || 0), 0))
            : parseInt(item.package_gigas || item.gb || 0);
        const reqSlots = isBundle ? item.members.length : 1;
        const tierClass = getGBBadgeColorClass(reqGB);

        let badgesHtml = '';
        
        lines.forEach(line => {
            const bookings = line.bookings || [];
            let lineUsedGigas = 0;
            let lineCurrentMembers = 0;

            bookings.forEach(b => {
                if (b.isBundle && (b.members || b.items || b.numbers)) {
                    const subs = b.members || b.items || b.numbers;
                    lineCurrentMembers += subs.length;
                    subs.forEach(m => lineUsedGigas += parseInt(m.package_gigas || m.gb || 0));
                } else {
                    lineCurrentMembers += 1;
                    lineUsedGigas += parseInt(b.package_gigas || b.gb || 0);
                }
            });

            const remGigas = line.total_gigas - lineUsedGigas;
            const remSlots = line.max_members - lineCurrentMembers;
            const canFit = remGigas >= reqGB && remSlots >= reqSlots;
            
            if (!canFit) return;
            
            const displayName = getLineDisplayName(line, lang);
            
            badgesHtml += `
                <button type="button" 
                        class="line-name-badge" 
                        data-line-id="${line.id}" 
                        data-booking-id="${item.id}"
                        title="${remGigas}GB ${lang === 'ar' ? 'متبقي' : 'rem'} | ${remSlots} ${lang === 'ar' ? 'مقاعد' : 'seats'}">
                    <span class="badge-name">${escapeHtml(displayName)}</span>
                    <span class="badge-meta">${remGigas}G|${remSlots}s</span>
                </button>
            `;
        });

        if (!badgesHtml) {
            badgesHtml = `<span style="font-size: 0.82rem; color: #ef4444; font-weight: 600;">${lang === 'ar' ? '❌ لا توجد خطوط متاحة تكفي لهذه الباقة' : '❌ No available lines fit this package'}</span>`;
        }

        const row = document.createElement('div');
        row.className = 'manual-alloc-row';
        row.setAttribute('data-booking-id', item.id);
        
        let clientInfoHtml = '';
        if (isBundle) {
            const membersListHtml = item.members.map(m => `
                <div style="font-size: 0.85rem; color: var(--text-main); font-weight: 600; display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: rgba(255,255,255,0.04); border-radius: 6px; gap: 8px;">
                    <span>📱 ${escapeHtml(m.customer_number || m.phone)}</span>
                    <span style="color: #a78bfa; font-weight: 700;">${m.package_gigas || m.gb} GB</span>
                </div>
            `).join('');

            clientInfoHtml = `
                <div class="manual-client-info bundle-client-info" style="display: flex; flex-direction: column; gap: 6px; min-width: 200px;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #a78bfa; display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                        <span>👥 مجموعة واحدة</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        ${membersListHtml}
                    </div>
                </div>
            `;
        } else {
            clientInfoHtml = `
                <div class="manual-client-info">
                    <div class="gb-display ${tierClass}">📦 ${reqGB} GB</div>
                    <div class="phone-display">📱 ${escapeHtml(item.customer_number || item.phone)}</div>
                </div>
            `;
        }

        row.innerHTML = `
            ${clientInfoHtml}
            <div style="flex: 2; min-width: 240px;">
                <div class="line-badge-group">
                    ${badgesHtml}
                </div>
            </div>
            <div>
                <button class="btn btn-primary btn-sm btn-do-manual-assign" data-booking-id="${item.id}" style="padding: 9px 18px; font-size: 0.88rem; white-space: nowrap; font-weight: 700;">
                    ${lang === 'ar' ? 'ربط الخط 🔗' : 'Assign 🔗'}
                </button>
            </div>
        `;
        
        modalBody.appendChild(row);
    });
}

function manualAssignBooking(bookingId, lineId) {
    let lines = getLines();
    let waiting = getWaitingList();
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
    
    const bookingIdx = waiting.findIndex(b => 
        String(b.id) === String(bookingId) || 
        b.id === bookingId ||
        (b.customer_number && String(b.customer_number) === String(bookingId)) ||
        (b.phone && String(b.phone) === String(bookingId))
    );
    if (bookingIdx === -1) {
        alert(lang === 'ar' ? 'الحجز غير موجود بقائمة الانتظار.' : 'Booking not found in waiting queue.');
        return;
    }
    
    const targetLine = lines.find(l => l.id === lineId || String(l.id) === String(lineId));
    if (!targetLine) {
        alert(lang === 'ar' ? 'يرجى اختيار خط اتصالات صحيح.' : 'Please select a valid line.');
        return;
    }
    
    const booking = waiting[bookingIdx];
    const isBundle = !!(booking.isBundle && booking.members && booking.members.length > 0);
    const itemGB = isBundle
        ? (booking.total_gigas || booking.members.reduce((s, m) => s + parseInt(m.package_gigas || m.gb || 0), 0))
        : parseInt(booking.package_gigas || booking.gb || 0);
    const itemSlots = isBundle ? booking.members.length : 1;
    
    const bookings = targetLine.bookings || [];
    let usedGigas = 0;
    let usedMembers = 0;

    bookings.forEach(b => {
        if (b.isBundle && (b.members || b.items || b.numbers)) {
            const subs = b.members || b.items || b.numbers;
            usedMembers += subs.length;
            subs.forEach(m => usedGigas += parseInt(m.package_gigas || m.gb || 0));
        } else {
            usedMembers += 1;
            usedGigas += parseInt(b.package_gigas || b.gb || 0);
        }
    });

    const remGigas = targetLine.total_gigas - usedGigas;
    const remSlots = targetLine.max_members - usedMembers;
    
    if (remGigas < itemGB || remSlots < itemSlots) {
        alert(lang === 'ar' ? 'سعة الخط أو عدد المقاعد لا يكفي لربط هذا الحجز!' : 'Line capacity or available slots insufficient for this booking!');
        return;
    }
    
    booking.assigned_line_id = targetLine.id;
    if (!targetLine.bookings) targetLine.bookings = [];
    targetLine.bookings.push(booking);
    
    const [removedItem] = waiting.splice(bookingIdx, 1);

    if (db && removedItem) {
        try {
            const docId = String(removedItem.id || removedItem.customer_number || removedItem.phone);
            db.collection('bookings').doc(docId).delete()
              .then(() => console.log(`Deleted allocated booking doc [${docId}] from Firestore.`))
              .catch(err => console.error(`Error deleting doc [${docId}] from Firestore:`, err));
        } catch(e) {}
    }
    
    let updatedUsedGigas = 0;
    let updatedMembers = 0;

    targetLine.bookings.forEach(b => {
        if (b.isBundle && (b.members || b.items || b.numbers)) {
            const subs = b.members || b.items || b.numbers;
            updatedMembers += subs.length;
            subs.forEach(m => updatedUsedGigas += parseInt(m.package_gigas || m.gb || 0));
        } else {
            updatedMembers += 1;
            updatedUsedGigas += parseInt(b.package_gigas || b.gb || 0);
        }
    });

    const isFull = (updatedUsedGigas >= targetLine.total_gigas) || (updatedMembers >= targetLine.max_members);
    targetLine.status = isFull ? 'full' : 'available';
    
    saveLines(lines);
    saveWaitingList(waiting);
    
    renderManualAllocationModal();
    refreshActiveView();
}

// -------------------------------------------------------------
// DEBOUNCE HELPER
// -------------------------------------------------------------
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// -------------------------------------------------------------
// IMMEDIATE LAYOUT INITIALIZATION
// -------------------------------------------------------------
(function initLayout() {
    initLocalStorage();
    const storedLang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
    document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = storedLang;
})();

// -------------------------------------------------------------
// DOM RENDERING & INTERACTIONS INIT
// -------------------------------------------------------------
function mainAppInit() {
    document.body.classList.add('loaded');
    triggerCloudLoad();
    
    const storedTheme = localStorage.getItem('theme') || 'dark';
    if (storedTheme === 'light') {
        document.body.classList.add('light-mode');
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.innerText = '☀️';
    }
    
    const storedLang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
    applyLanguage(storedLang);
    
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeBtn.innerText = isLight ? '☀️' : '🌙';
        });
    }

    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const currentLang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
            const nextLang = currentLang === 'en' ? 'ar' : 'en';
            applyLanguage(nextLang);
        });
    }

    const toggleBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.style.display = 'block';
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    const logoutBtn = document.getElementById('navLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('admin_logged_in');
            window.location.replace('login.html');
        });
    }

    // INDEX.HTML (DASHBOARD) CONTROLLER
    if (document.getElementById('kpiTotalLines') || document.getElementById('overallPercentage')) {
        renderDashboard();

        const btnTriggerAllocation = document.getElementById('btnTriggerAllocation');
        if (btnTriggerAllocation) {
            btnTriggerAllocation.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                showLoading(MESSAGES[lang].runningSolver || 'Executing Smart Allocation...');
                setTimeout(() => {
                    const res = triggerSmartAllocation();
                    hideLoading();
                    if (res.success) {
                        alert(MESSAGES[lang].solvingSuccess + '\n' + res.assigned_count + ' customer lines bound.');
                        refreshActiveView();
                    } else {
                        alert('No pending bookings or telecom lines available for allocation.');
                    }
                }, 300);
            });
        }

        // Destructive reset action retains confirmation for safety
        const btnResetData = document.getElementById('btnResetData');
        if (btnResetData) {
            btnResetData.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                if (confirm(MESSAGES[lang].confirmReset)) {
                    showLoading('Resetting Allocations...');
                    setTimeout(() => {
                        resetAllocations();
                        hideLoading();
                        alert(MESSAGES[lang].resetSuccess);
                        refreshActiveView();
                    }, 400);
                }
            });
        }

        // Bulk Delete All Bookings Handler
        const btnDeleteAllBookings = document.getElementById('btnDeleteAllBookings');
        if (btnDeleteAllBookings) {
            btnDeleteAllBookings.addEventListener('click', (e) => {
                e.preventDefault();
                const confirmMsg = "هل أنت تأكد من حذف جميع الأرقام والباقات المحجوزة بالكامل؟";
                if (confirm(confirmMsg)) {
                    showLoading('جاري حذف جميع الحجوزات...');
                    setTimeout(() => {
                        deleteAllBookings();
                        hideLoading();
                        alert('✅ تم حذف جميع الأرقام والباقات المحجوزة بنجاح.');
                    }, 400);
                }
            });
        }

        // Manual Allocation Trigger & Modal Binds
        const btnManualAllocation = document.getElementById('btnManualAllocation');
        const manualModal = document.getElementById('manualAllocationModal');
        const btnCloseManualModal = document.getElementById('btnCloseManualModal');

        if (btnManualAllocation && manualModal) {
            btnManualAllocation.addEventListener('click', (e) => {
                e.preventDefault();
                manualModal.style.display = 'flex';
                renderManualAllocationModal();
            });
        }

        if (btnCloseManualModal && manualModal) {
            btnCloseManualModal.addEventListener('click', (e) => {
                e.preventDefault();
                manualModal.style.display = 'none';
            });
        }

        if (manualModal) {
            manualModal.addEventListener('click', (e) => {
                if (e.target === manualModal) {
                    manualModal.style.display = 'none';
                }
            });
        }

        const manualModalBody = document.getElementById('manualModalBody');
        if (manualModalBody) {
            manualModalBody.addEventListener('click', (e) => {
                // Name badge selection click
                const badge = e.target.closest('.line-name-badge');
                if (badge && !badge.disabled) {
                    const row = badge.closest('.manual-alloc-row');
                    if (row) {
                        row.querySelectorAll('.line-name-badge').forEach(b => b.classList.remove('active'));
                        badge.classList.add('active');
                        row.setAttribute('data-selected-line-id', badge.getAttribute('data-line-id'));
                    }
                    return;
                }

                // Assign button click
                const btnAssign = e.target.closest('.btn-do-manual-assign');
                if (btnAssign && !btnAssign.disabled) {
                    const bookingId = parseInt(btnAssign.getAttribute('data-booking-id'));
                    const row = btnAssign.closest('.manual-alloc-row');
                    if (row) {
                        const lineId = parseInt(row.getAttribute('data-selected-line-id') || '0');
                        if (!lineId || isNaN(lineId)) {
                            const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                            alert(lang === 'ar' ? 'يرجى الضغط على اسم الخط المطلوب تخصيصه أولاً!' : 'Please click a line name badge to select it first!');
                            return;
                        }
                        
                        btnAssign.disabled = true;
                        const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                        btnAssign.innerHTML = lang === 'ar' ? '✅ تم الربط' : '✅ Assigned';
                        btnAssign.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        
                        row.classList.add('fade-out-left');
                        
                        setTimeout(() => {
                            manualAssignBooking(bookingId, lineId);
                        }, 400);
                    }
                }
            });
        }

        const btnNewMonth = document.getElementById('btnStartNewMonth');
        if (btnNewMonth) {
            btnNewMonth.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                const confirmMsg = MESSAGES[lang]?.confirmNewMonth || '🧹 هل أنت متأكد من تصفير الحجوزات وبدء شهر جديد؟';
                if (confirm(confirmMsg)) {
                    showLoading('جاري أرشفة الشهر وبدء شهر جديد...');
                    setTimeout(() => {
                        try {
                            const res = archiveMonthData();
                            hideLoading();
                            if (res.success) {
                                alert('تم بدء شهر جديد بنجاح');
                                refreshActiveView();
                            } else {
                                alert(res.message || 'حدث خطأ أثناء بدء شهر جديد.');
                            }
                        } catch(err) {
                            hideLoading();
                            console.error('Error starting new month:', err);
                            alert('حدث خطأ أثناء بدء شهر جديد: ' + err.message);
                        }
                    }, 400);
                }
            });
        }

        const btnClearWaiting = document.getElementById('btnClearWaitingList');
        if (btnClearWaiting) {
            btnClearWaiting.addEventListener('click', (e) => {
                e.preventDefault();
                saveWaitingList([]);
                refreshActiveView();
                if (document.getElementById('manualAllocationModal') && document.getElementById('manualAllocationModal').style.display === 'flex') {
                    renderManualAllocationModal();
                }
            });
        }

        const btnCopyWaiting = document.getElementById('btnCopyWaitingList');
        if (btnCopyWaiting) {
            btnCopyWaiting.addEventListener('click', () => {
                const copySource = document.getElementById('waitingListCopySource');
                if (copySource && copySource.value.trim()) {
                    navigator.clipboard.writeText(copySource.value).then(() => {
                        const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                        const originalText = btnCopyWaiting.innerText;
                        btnCopyWaiting.innerText = lang === 'ar' ? '✅ تم نسخ القائمة!' : '✅ List Copied!';
                        btnCopyWaiting.style.color = 'var(--color-success)';
                        setTimeout(() => {
                            btnCopyWaiting.innerText = originalText;
                            btnCopyWaiting.style.color = '';
                        }, 1500);
                    }).catch(err => {
                        alert('Clipboard write failure: ' + err);
                    });
                } else {
                    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                    alert(lang === 'ar' ? 'قائمة الانتظار فارغة!' : 'Waiting list is empty!');
                }
            });
        }

        const linesGrid = document.querySelector('.lines-grid');
        if (linesGrid) {
            linesGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.line-card');
                if (card) {
                    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
                    const container = card.querySelector('.assigned-members-container');
                    if (container) {
                        const verticalList = container.querySelector('.member-vertical-list');
                        const hasMembers = verticalList && verticalList.querySelector('.member-row') !== null;
                        if (hasMembers) {
                            card.classList.toggle('expanded');
                            container.classList.toggle('show');
                        }
                    }
                }
            });
        }
    }

    if (document.getElementById('linesTableBody')) {
        renderLinesDirectory();
    }

    if (document.getElementById('chatForm')) {
        renderChatPage();
    }

    if (document.getElementById('gigaSearchInput')) {
        renderSearchPage();
    }

    if (document.getElementById('archivesTableBody')) {
        renderArchivesPage();
    }

    if (document.getElementById('loginForm')) {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('loginError');

            if (username === 'admin' && password === '1111') {
                localStorage.setItem('admin_logged_in', 'true');
                if (db) {
                    db.collection('users').doc('admin').set({ id: 'admin', username: 'admin', password: '1111', role: 'master' }, { merge: true }).catch(err => console.warn('Firestore admin login sync err:', err));
                }
                window.location.replace('index.html');
            } else {
                if (errorEl) {
                    errorEl.style.display = 'block';
                    errorEl.innerText = '⚠️ خطأ في اسم المستخدم أو كلمة المرور!';
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        const unassignBtn = e.target.closest('.btn-unassign-single');
        if (unassignBtn) {
            e.stopPropagation();
            const phone = unassignBtn.getAttribute('data-phone');
            const lineId = unassignBtn.getAttribute('data-line-id');
            const bookingId = unassignBtn.getAttribute('data-booking-id');
            const memberIdx = unassignBtn.getAttribute('data-member-index');
            const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';

            const confirmMsg = lang === 'ar'
                ? `هل أنت متأكد من إلغاء تخصيص الرقم ${phone || ''} وإعادته لقائمة الانتظار؟`
                : `Are you sure you want to unassign ${phone || 'this number'} and return it to the waiting list?`;

            if (confirm(confirmMsg)) {
                unassignOrderFromLine(phone, lineId, bookingId, memberIdx !== null && memberIdx !== undefined ? parseInt(memberIdx) : undefined);
            }
            return;
        }

        const copyBtn = e.target.closest('.btn-copy-single');
        if (copyBtn) {
            e.stopPropagation();
            const phone = copyBtn.getAttribute('data-phone');
            if (phone) {
                navigator.clipboard.writeText(phone).then(() => {
                    localStorage.setItem('copied_' + phone, Date.now());
                    const row = copyBtn.closest('.member-row');
                    if (row) {
                        const checkmark = row.querySelector('.copy-checkmark-icon');
                        if (checkmark) checkmark.style.display = 'inline';
                    }
                    const originalIcon = copyBtn.innerText;
                    copyBtn.innerText = '✅';
                    copyBtn.style.color = 'var(--color-success)';
                    setTimeout(() => {
                        copyBtn.innerText = originalIcon;
                        copyBtn.style.color = '';
                    }, 1500);
                }).catch(err => alert('Clipboard error: ' + err));
            }
        }
    });

    initPersistedCheckmarks();

    if (document.getElementById('reservedBundlesTable')) {
        renderReservedBundlesPage();
    }
}

// Immediate + DOMContentLoaded execution guard
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mainAppInit);
} else {
    mainAppInit();
}

// -------------------------------------------------------------
// PAGE IMPLEMENTATION FUNCTIONS
// -------------------------------------------------------------

function renderDashboard() {
    const lines = getLines();
    const waiting = getWaitingList();
    const archives = getArchivedMonths();
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';

    const totalLinesCount = lines.length;
    const fullLinesCount = lines.filter(l => l.status === 'full').length;
    let pendingCount = 0;
    let pendingGigas = 0;
    let grandTotal = 0;
    const currentPricing = getPricing();
    const groupedWaiting = {};
    const bundleBookings = [];

    waiting.forEach(b => {
        if (b.isBundle && b.members && b.members.length > 0) {
            bundleBookings.push(b);
            pendingCount += b.members.length;
            b.members.forEach(m => {
                const gb = parseInt(m.package_gigas || m.gb || 0);
                const price = m.package_price || m.price || currentPricing[gb] || 0;
                pendingGigas += gb;
                grandTotal += price;
            });
        } else {
            pendingCount += 1;
            const gb = parseInt(b.package_gigas || b.gb || 0);
            const price = b.package_price || b.price || currentPricing[gb] || 0;
            pendingGigas += gb;
            grandTotal += price;

            if (!groupedWaiting[gb]) groupedWaiting[gb] = [];
            groupedWaiting[gb].push(b.customer_number || b.phone);
        }
    });

    const elTotal = document.getElementById('kpiTotalLines');
    if (elTotal) elTotal.innerText = totalLinesCount;
    
    const elFull = document.getElementById('kpiFullLinesCount');
    if (elFull) elFull.innerText = fullLinesCount;
    
    const elFullTot = document.getElementById('kpiFullLinesTotal');
    if (elFullTot) elFullTot.innerText = `/ ${totalLinesCount}`;
    
    const elPend = document.getElementById('kpiPendingCount');
    if (elPend) elPend.innerText = pendingCount;
    
    const elPendVol = document.getElementById('kpiPendingVolume');
    if (elPendVol) elPendVol.innerText = `${pendingGigas} GB`;

    const elCalcTotal = document.getElementById('waitingCalcGrandTotal');
    if (elCalcTotal) elCalcTotal.innerText = grandTotal.toLocaleString();

    const elArch = document.getElementById('kpiArchivesCount');
    if (elArch) elArch.innerText = archives.length;

    let totalCapacityGigas = lines.reduce((sum, l) => sum + parseInt(l.total_gigas || 0), 0);
    let totalUsedGigas = 0;
    lines.forEach(line => {
        const bookings = line.bookings || [];
        bookings.forEach(b => {
            if (b.isBundle && (b.members || b.items || b.numbers)) {
                const subs = b.members || b.items || b.numbers;
                subs.forEach(m => totalUsedGigas += parseInt(m.package_gigas || m.gb || 0));
            } else {
                totalUsedGigas += parseInt(b.package_gigas || b.gb || 0);
            }
        });
    });
    const overallPercentage = totalCapacityGigas > 0 ? Math.round((totalUsedGigas / totalCapacityGigas) * 100) : 0;

    const elPerc = document.getElementById('overallPercentage');
    if (elPerc) elPerc.innerText = `${overallPercentage}%`;
    
    const elBar = document.getElementById('overallProgressBar');
    if (elBar) elBar.style.width = `${Math.min(100, overallPercentage)}%`;
    
    const elUsedText = document.getElementById('overallUsedText');
    if (elUsedText) elUsedText.innerText = `${TRANSLATIONS[lang] ? TRANSLATIONS[lang].used : 'Used:'} ${totalUsedGigas} GB`;
    
    const elTotText = document.getElementById('overallTotalText');
    if (elTotText) elTotText.innerText = `${TRANSLATIONS[lang] ? TRANSLATIONS[lang].totalCapacity : 'Total Capacity:'} ${totalCapacityGigas} GB`;

    const linesGrid = document.getElementById('dashboardLinesGrid');
    if (linesGrid) {
        linesGrid.innerHTML = '';
        if (lines.length === 0) {
            linesGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1;">
                    <div class="no-results-icon">📶</div>
                    <p data-i18n="noLines">${TRANSLATIONS[lang] ? TRANSLATIONS[lang].noLines : 'No billing lines registered.'}</p>
                </div>
            `;
        } else {
            lines.forEach(line => {
                const bookings = line.bookings || [];
                let currentMembers = 0;
                let usedGigas = 0;
                let usedMinutes = 0;

                bookings.forEach(b => {
                    if (b.isBundle && (b.members || b.items || b.numbers)) {
                        const subs = b.members || b.items || b.numbers;
                        currentMembers += subs.length;
                        subs.forEach(m => {
                            usedGigas += parseInt(m.package_gigas || m.gb || m.gigas || 0);
                            usedMinutes += parseInt(m.package_minutes || m.minutes || 0);
                        });
                    } else {
                        currentMembers += 1;
                        usedGigas += parseInt(b.package_gigas || b.gb || b.gigas || 0);
                        usedMinutes += parseInt(b.package_minutes || b.minutes || 0);
                    }
                });
                
                const gigaPercentage = line.total_gigas > 0 ? Math.round((usedGigas / line.total_gigas) * 100) : 0;
                const memberPercentage = line.max_members > 0 ? Math.round((currentMembers / line.max_members) * 100) : 0;
                const minutesPercentage = line.total_minutes > 0 ? Math.round((usedMinutes / line.total_minutes) * 100) : 0;
                
                const remGigas = line.total_gigas - usedGigas;
                const remMinutes = line.total_minutes - usedMinutes;

                const card = document.createElement('div');
                card.className = `line-card ${line.status === 'full' ? 'expanded-override-none' : ''}`;
                card.setAttribute('data-line-id', line.id);
                
                let memberRowsHtml = '';
                bookings.forEach(b => {
                    if (b.isBundle && (b.members || b.items || b.numbers)) {
                        const subs = b.members || b.items || b.numbers;
                        subs.forEach((m, mIdx) => {
                            const phoneVal = escapeHtml(m.customer_number || m.phone || '');
                            const gbVal = m.package_gigas || m.gb || m.gigas || 0;
                            memberRowsHtml += `
                                <div class="member-row bundle-member-row" style="display: flex; justify-content: space-between; align-items: center; background: rgba(167, 139, 250, 0.06); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 8px; padding: 6px 12px;">
                                    <span class="member-phone-val" style="font-family: monospace; font-size: 0.9rem; font-weight: 600; user-select: text !important; -webkit-user-select: text !important; display: flex; align-items: center; gap: 6px;">
                                        📱 ${phoneVal}
                                        <span style="font-size: 0.7rem; background: rgba(167, 139, 250, 0.2); color: #a78bfa; padding: 1px 6px; border-radius: 6px; font-weight: 600;">👥 مجموعة</span>
                                        <span class="copy-checkmark-icon" data-phone="${phoneVal}" style="color: var(--color-success); margin-left: 4px; margin-right: 4px; display: none;">✔️</span>
                                    </span>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 0.85rem; color: #c084fc; font-weight: 700;">${gbVal} GB</span>
                                        <button class="btn-copy-single" data-phone="${phoneVal}" style="background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 0.95rem; padding: 2px 6px; transition: var(--transition-smooth); display: inline-flex; align-items: center;" title="Copy number">📋</button>
                                        <button class="btn-unassign-single" data-phone="${phoneVal}" data-booking-id="${b.id}" data-member-index="${mIdx}" data-line-id="${line.id}" style="background: none; border: none; color: var(--color-danger); cursor: pointer; font-size: 0.95rem; padding: 2px 6px; transition: var(--transition-smooth); display: inline-flex; align-items: center;" title="Unassign / Remove Number">🗑️</button>
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        const phoneVal = escapeHtml(b.customer_number || b.phone || '');
                        const gbVal = b.package_gigas || b.gb || b.gigas || 0;
                        memberRowsHtml += `
                            <div class="member-row" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-radius: 8px; padding: 6px 12px;">
                                <span class="member-phone-val" style="font-family: monospace; font-size: 0.9rem; font-weight: 600; user-select: text !important; -webkit-user-select: text !important;">
                                    📱 ${phoneVal}
                                    <span class="copy-checkmark-icon" data-phone="${phoneVal}" style="color: var(--color-success); margin-left: 6px; margin-right: 6px; display: none;">✔️</span>
                                </span>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">${gbVal} GB</span>
                                    <button class="btn-copy-single" data-phone="${phoneVal}" style="background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 0.95rem; padding: 2px 6px; transition: var(--transition-smooth); display: inline-flex; align-items: center;" title="Copy number">📋</button>
                                    <button class="btn-unassign-single" data-phone="${phoneVal}" data-booking-id="${b.id || ''}" data-line-id="${line.id}" style="background: none; border: none; color: var(--color-danger); cursor: pointer; font-size: 0.95rem; padding: 2px 6px; transition: var(--transition-smooth); display: inline-flex; align-items: center;" title="Unassign / Remove Number">🗑️</button>
                                </div>
                            </div>
                        `;
                    }
                });

                card.innerHTML = `
                    <div class="line-card-header" style="margin-bottom: 15px;">
                        <span class="line-badge">${escapeHtml(line.line_number)}</span>
                        <span class="status-tag ${line.status} status-text">
                            ${line.status === 'full' ? TRANSLATIONS[lang].full : TRANSLATIONS[lang].available}
                        </span>
                    </div>
                    
                    <div class="line-card-body" style="gap: 12px;">
                        <div class="progress-container">
                            <div class="progress-header" style="margin-bottom: 4px;">
                                <span data-i18n="gigaQuota">${TRANSLATIONS[lang].gigaQuota}</span>
                                <span class="line-meta-value giga-text">${usedGigas} / ${line.total_gigas} GB</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill giga-bar purple" style="width: ${Math.min(100, gigaPercentage)}%;"></div>
                            </div>
                        </div>
                        
                        <div class="progress-container">
                            <div class="progress-header" style="margin-bottom: 4px;">
                                <span data-i18n="callMinutes">${TRANSLATIONS[lang].callMinutes}</span>
                                <span class="line-meta-value minutes-text">${new Intl.NumberFormat().format(usedMinutes)} / ${new Intl.NumberFormat().format(line.total_minutes)} Min</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill minutes-bar purple" style="width: ${Math.min(100, minutesPercentage)}%;"></div>
                            </div>
                        </div>
                        
                        <div class="progress-container">
                            <div class="progress-header" style="margin-bottom: 4px;">
                                <span data-i18n="splitMembers">${TRANSLATIONS[lang].splitMembers}</span>
                                <span class="line-meta-value member-text">${currentMembers} / ${line.max_members} Seats</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill member-bar orange" style="width: ${Math.min(100, memberPercentage)}%;"></div>
                            </div>
                        </div>

                        <div class="line-metrics-breakdown" style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--text-muted); border-top: 1px dashed var(--border-glass); padding-top: 10px; margin-top: 5px;">
                            <div class="metric-row" style="display: flex; align-items: center; gap: 6px;">
                                <span>🌐</span>
                                <span class="quota-rem-simple" 
                                      data-en="Remaining Internet: ${remGigas} GB" 
                                      data-ar="المتبقي من الإنترنت: ${remGigas} جيجا">
                                      ${lang === 'ar' ? `المتبقي من الإنترنت: ${remGigas} جيجا` : `Remaining Internet: ${remGigas} GB`}
                                </span>
                            </div>
                            <div class="metric-row" style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                <span>📞</span>
                                <span class="minutes-rem-simple" 
                                      data-en="Remaining Minutes: ${new Intl.NumberFormat().format(maxZero(remMinutes))} Min" 
                                      data-ar="المتبقي من الدقائق: ${new Intl.NumberFormat().format(maxZero(remMinutes))} دقيقة">
                                      ${lang === 'ar' ? `المتبقي من الدقائق: ${new Intl.NumberFormat().format(maxZero(remMinutes))} دقيقة` : `Remaining Minutes: ${new Intl.NumberFormat().format(maxZero(remMinutes))} Min`}
                                </span>
                            </div>
                        </div>

                        <div class="assigned-members-container" style="margin-top: 0; padding-top: 0;">
                            <h4 data-i18n="assignedMembers" style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${TRANSLATIONS[lang].assignedMembers}</h4>
                            <div class="member-vertical-list" style="display: flex; flex-direction: column; gap: 8px;">
                                ${memberRowsHtml}
                            </div>
                        </div>
                    </div>
                `;
                linesGrid.appendChild(card);
            });
        }
    }

    const sortedGbs = Object.keys(groupedWaiting).map(Number).sort((a, b) => a - b);
    const waitingCopyParts = [];
    sortedGbs.forEach(gb => {
        const section = `⭐⭐⭐ ${gb} GB ⭐⭐⭐\n` + groupedWaiting[gb].join('\n');
        waitingCopyParts.push(section);
    });

    if (bundleBookings.length > 0) {
        bundleBookings.forEach(b => {
            const bLines = ["مجموعة واحدة"];
            b.members.forEach(m => {
                const gbVal = (m.package_gigas || m.gb || m.gigas || 0) + 'GB';
                const phoneVal = m.customer_number || m.phone || '';
                bLines.push(gbVal);
                bLines.push(phoneVal);
            });
            bLines.push("***********");
            waitingCopyParts.push(bLines.join('\n'));
        });
    }
    
    const elCopySrc = document.getElementById('waitingListCopySource');
    if (elCopySrc) elCopySrc.value = waitingCopyParts.join('\n\n');

    const listGroups = document.getElementById('waitingListGroups');
    if (listGroups) {
        listGroups.innerHTML = '';
        if (sortedGbs.length === 0 && bundleBookings.length === 0) {
            listGroups.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 30px 0;" data-i18n="noWaitingItems">${TRANSLATIONS[lang] ? TRANSLATIONS[lang].noWaitingItems : 'No pending bookings.'}</div>`;
        } else {
            const gridDiv = document.createElement('div');
            gridDiv.className = 'waiting-grid';

            sortedGbs.forEach(gb => {
                const grpCard = document.createElement('div');
                grpCard.className = 'waiting-group-card';
                
                let capsulesHtml = '';
                groupedWaiting[gb].forEach(num => {
                    capsulesHtml += `<div class="waiting-phone-capsule">${escapeHtml(num)}</div>`;
                });

                const count = groupedWaiting[gb].length;
                const headerTitle = lang === 'en'
                    ? `${gb} GB Package (${count} ${count === 1 ? 'Number' : 'Numbers'})`
                    : `باقة ${gb} جيجا (${count} ${count === 1 ? 'رقم' : 'أرقام'})`;

                grpCard.innerHTML = `
                    <div class="waiting-card-header" style="display: flex; align-items: center; justify-content: center; gap: 8px; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px; margin-bottom: 5px;">
                        <span style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary); white-space: nowrap;">⭐ ${escapeHtml(headerTitle)} ⭐</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${capsulesHtml}
                    </div>
                `;
                gridDiv.appendChild(grpCard);
            });

            if (bundleBookings.length > 0) {
                const bundleCard = document.createElement('div');
                bundleCard.className = 'waiting-group-card bundle-group-card';
                bundleCard.style.borderTop = '3px solid #a78bfa';

                let totalBundleMembersCount = 0;
                let bundleItemsHtml = '';

                bundleBookings.forEach((b, bIdx) => {
                    totalBundleMembersCount += b.members.length;
                    let subCards = '';
                    b.members.forEach(m => {
                        const gbText = (m.package_gigas || m.gb || m.gigas || 0) + ' GB';
                        const phoneText = escapeHtml(m.customer_number || m.phone || '');
                        subCards += `
                            <div class="bundle-member-card">
                                <div class="bundle-member-gb">${gbText}</div>
                                <div class="bundle-member-divider"></div>
                                <div class="bundle-member-phone">${phoneText}</div>
                            </div>
                        `;
                    });

                    bundleItemsHtml += `
                        <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 12px; border: 1px dashed rgba(167, 139, 250, 0.25);">
                            <div style="font-size: 0.82rem; color: #a78bfa; font-weight: 700; text-align: center; margin-bottom: 2px;">
                                👥 مجموعة ${bIdx + 1}
                            </div>
                            ${subCards}
                        </div>
                    `;
                });

                const bundleHeaderTitle = lang === 'en'
                    ? `Group Bundles (${totalBundleMembersCount} Numbers)`
                    : `⭐ مجموعة واحدة (${totalBundleMembersCount} رقم) ⭐`;

                bundleCard.innerHTML = `
                    <div class="waiting-card-header" style="display: flex; align-items: center; justify-content: center; gap: 8px; border-bottom: 1px solid rgba(167, 139, 250, 0.3); padding-bottom: 10px; margin-bottom: 5px;">
                        <span style="font-size: 0.95rem; font-weight: 700; color: #a78bfa; white-space: nowrap;">${escapeHtml(bundleHeaderTitle)}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${bundleItemsHtml}
                    </div>
                `;
                gridDiv.appendChild(bundleCard);
            }

            listGroups.appendChild(gridDiv);
        }
    }
    
    initPersistedCheckmarks();
}

function renderLinesDirectory() {
    const lines = getLines();
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
    
    const urlParams = new URLSearchParams(window.location.search);
    const editId = parseInt(urlParams.get('edit_id') || '0');
    const isEdit = editId > 0;

    const formPanel = document.getElementById('formPanel');
    if (formPanel) {
        if (isEdit) {
            const line = lines.find(l => l.id === editId);
            if (line) {
                formPanel.innerHTML = `
                    <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 20px;" data-i18n="editLineTitle">Edit Line Properties</h3>
                    <form id="editLineForm">
                        <div class="form-group">
                            <label data-i18n="lblLineNum">Cellular Line Number</label>
                            <input type="text" id="edit_line_number" class="form-control" value="${escapeHtml(line.line_number)}" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="lblGigaCap">Total Giga Capacity (GB)</label>
                            <input type="number" id="edit_total_gigas" class="form-control" value="${line.total_gigas}" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="lblMinsCap">Total Minutes Capacity</label>
                            <input type="number" id="edit_total_minutes" class="form-control" value="${line.total_minutes}" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="lblMaxMembers">Max Split Member Seats</label>
                            <input type="number" id="edit_max_members" class="form-control" value="${line.max_members || 5}" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;" data-i18n="btnUpdateLine">Update Line Details</button>
                        <a href="lines.html" class="btn btn-secondary" style="width: 100%; margin-top: 10px; text-align: center; display: block;" data-i18n="btnCancel">Cancel</a>
                    </form>
                `;

                const form = document.getElementById('editLineForm');
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const line_number = document.getElementById('edit_line_number').value.trim();
                        const total_gigas = parseInt(document.getElementById('edit_total_gigas').value);
                        const total_minutes = parseInt(document.getElementById('edit_total_minutes').value);
                        const max_members = parseInt(document.getElementById('edit_max_members').value);

                        line.line_number = line_number;
                        line.total_gigas = total_gigas;
                        line.total_minutes = total_minutes;
                        line.max_members = max_members;

                        let usedGigas = (line.bookings || []).reduce((sum, b) => {
                            if (b.isBundle && (b.members || b.items)) {
                                return sum + (b.members || b.items).reduce((s, m) => s + parseInt(m.package_gigas || m.gb || 0), 0);
                            }
                            return sum + parseInt(b.package_gigas || b.gb || 0);
                        }, 0);
                        let usedMembers = (line.bookings || []).length;
                        line.status = (usedGigas >= line.total_gigas || usedMembers >= line.max_members) ? 'full' : 'available';

                        saveLines(lines);
                        alert(TRANSLATIONS[lang].lineUpdated || 'Line updated successfully!');
                        try { history.pushState(null, '', 'lines.html'); } catch(e) {}
                        renderLinesDirectory();
                        refreshActiveView();
                    });
                }
            }
        } else {
            formPanel.innerHTML = `
                <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 20px;" data-i18n="createLineTitle">Register New Line</h3>
                <form id="createLineForm">
                    <div class="form-group">
                        <label data-i18n="lblLineNum">Cellular Line Number</label>
                        <input type="text" id="line_number" class="form-control" placeholder="e.g. 01012345678" required>
                    </div>
                    <div class="form-group">
                        <label data-i18n="lblGigaCap">Total Giga Capacity (GB)</label>
                        <input type="number" id="total_gigas" class="form-control" placeholder="e.g. 70" required>
                    </div>
                    <div class="form-group">
                        <label data-i18n="lblMinsCap">Total Minutes Capacity</label>
                        <input type="number" id="total_minutes" class="form-control" placeholder="e.g. 9000" required>
                    </div>
                    <div class="form-group">
                        <label data-i18n="lblMaxMembers">Max Split Member Seats</label>
                        <input type="number" id="max_members" class="form-control" placeholder="e.g. 5" value="5" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;" data-i18n="btnSaveLine">Save Cellular Line</button>
                </form>
            `;

            const form = document.getElementById('createLineForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const line_number = document.getElementById('line_number').value.trim();
                    const total_gigas = parseInt(document.getElementById('total_gigas').value);
                    const total_minutes = parseInt(document.getElementById('total_minutes').value);
                    const max_members = parseInt(document.getElementById('max_members').value);

                    const newLine = {
                        id: Date.now(),
                        line_number: line_number,
                        total_gigas: total_gigas,
                        total_minutes: total_minutes,
                        max_members: max_members,
                        status: 'available',
                        bookings: []
                    };

                    lines.push(newLine);
                    saveLines(lines);
                    alert(TRANSLATIONS[lang].lineAdded || 'Line added successfully!');
                    renderLinesDirectory();
                    
                    document.getElementById('line_number').value = '';
                    document.getElementById('total_gigas').value = '';
                    document.getElementById('total_minutes').value = '';
                    document.getElementById('max_members').value = '';
                });
            }
        }
    }

    const tableBody = document.getElementById('linesTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        if (lines.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-dim); padding: 40px 0;" data-i18n="noReportLines">No active cellular lines registered in this workspace.</td>
                </tr>
            `;
        } else {
            lines.forEach(line => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${escapeHtml(line.line_number)}</td>
                    <td style="white-space: nowrap;">
                        <input type="number" class="form-control inline-line-gb-input" data-id="${line.id}" value="${line.total_gigas}" min="1" style="width: 82px; padding: 4px 6px; font-weight: 700; font-size: 0.9rem; display: inline-block;"> GB
                    </td>
                    <td>${new Intl.NumberFormat().format(line.total_minutes)} Min</td>
                    <td>${line.max_members} Max</td>
                    <td>
                        <span class="status-tag ${line.status}" style="padding: 2px 8px; font-size: 0.7rem;">
                            ${line.status === 'full' ? TRANSLATIONS[lang].full : TRANSLATIONS[lang].available}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <a href="lines.html?edit_id=${line.id}" class="btn btn-secondary btn-icon-only btn-sm" title="Edit line properties">✏️</a>
                        <button class="btn btn-danger btn-icon-only btn-sm btn-delete-line" data-id="${line.id}" title="Delete line">🗑️</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            tableBody.addEventListener('change', (e) => {
                if (e.target && e.target.classList.contains('inline-line-gb-input')) {
                    const lineId = parseInt(e.target.getAttribute('data-id'));
                    const newGB = parseInt(e.target.value, 10);
                    if (isNaN(newGB) || newGB <= 0) return;

                    let freshLines = getLines();
                    const targetLine = freshLines.find(l => l.id === lineId);
                    if (targetLine) {
                        targetLine.total_gigas = newGB;

                        let usedGigas = (targetLine.bookings || []).reduce((sum, b) => {
                            if (b.isBundle && (b.members || b.items)) {
                                return sum + (b.members || b.items).reduce((s, m) => s + parseInt(m.package_gigas || m.gb || 0), 0);
                            }
                            return sum + parseInt(b.package_gigas || b.gb || 0);
                        }, 0);
                        let usedMembers = (targetLine.bookings || []).length;
                        targetLine.status = (usedGigas >= targetLine.total_gigas || usedMembers >= targetLine.max_members) ? 'full' : 'available';

                        saveLines(freshLines);
                        refreshActiveView();
                    }
                }
            });

            document.querySelectorAll('.btn-delete-line').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    if (confirm('Wiping this line will return all assigned bookings back to the pending pool. Proceed?')) {
                        let freshLines = getLines();
                        const lineIdx = freshLines.findIndex(l => l.id === id);
                        if (lineIdx !== -1) {
                            const deletedLine = freshLines.splice(lineIdx, 1)[0];
                            let waiting = getWaitingList();
                            
                            if (deletedLine.bookings && deletedLine.bookings.length > 0) {
                                deletedLine.bookings.forEach(b => {
                                    b.assigned_line_id = null;
                                    waiting.push(b);
                                });
                            }

                            if (db) {
                                db.collection('lines').doc(String(id)).delete()
                                  .catch(err => console.error(`Firestore delete line [${id}] error:`, err));
                            }
                            
                            saveLines(freshLines);
                            saveWaitingList(waiting);
                            alert('Line deleted successfully. Assigned members returned to pending pool.');
                            renderLinesDirectory();
                        }
                    }
                });
            });
        }
    }

    const pricingConfigPanel = document.getElementById('pricingConfigPanel');
    if (pricingConfigPanel) {
        const pricing = getPricing();
        const allTiers = Object.keys(pricing).map(Number).sort((a, b) => a - b);
        
        let rowsHtml = '';
        allTiers.forEach(tier => {
            const val = pricing[tier] || 0;
            rowsHtml += `
                <tr>
                    <td style="font-weight: 600; padding: 10px 5px;">${tier} GB</td>
                    <td style="padding: 5px;">
                        <input type="number" class="form-control pricing-waiting-input" data-tier="${tier}" value="${val}" min="0" style="padding: 6px 10px; font-size: 0.85rem; width: 120px;">
                    </td>
                </tr>
            `;
        });

        pricingConfigPanel.innerHTML = `
            <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 20px;">💰 Package Pricing Configuration</h3>
            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                <table class="custom-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Package Size</th>
                            <th>Price (EGP)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
            <button id="btnSavePricing" class="btn btn-primary btn-sm" style="width: 100%; margin-top: 20px;">Save Pricing Configurations</button>
        `;

        const btnSavePricing = document.getElementById('btnSavePricing');
        if (btnSavePricing) {
            btnSavePricing.addEventListener('click', () => {
                const newPricing = {};
                
                document.querySelectorAll('.pricing-waiting-input').forEach(input => {
                    const tier = parseInt(input.getAttribute('data-tier'));
                    const val = parseInt(input.value) || 0;
                    newPricing[tier] = val;
                });

                // 1. Persist new pricing configuration
                savePricing(newPricing);

                // 2. Dynamically update prices for all pending orders in waiting queue
                let waiting = getWaitingList();
                if (waiting && waiting.length > 0) {
                    waiting.forEach(item => {
                        const itemGB = parseInt(item.package_gigas || 0);
                        if (newPricing[itemGB] !== undefined) {
                            item.package_price = newPricing[itemGB];
                        }
                    });
                    saveWaitingList(waiting);
                }

                // 3. Inform user and refresh active views instantaneously without reload
                const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                alert(lang === 'ar' ? 'تم تحديث أسعار الباقات بنجاح وتعديل قائمة الانتظار!' : 'Package pricing updated successfully across all pending bookings!');
                
                refreshActiveView();
                if (document.getElementById('manualAllocationModal') && document.getElementById('manualAllocationModal').style.display === 'flex') {
                    renderManualAllocationModal();
                }
            });
        }
    }
}

function renderChatPage() {
    const chatFeed = document.getElementById('chatFeed');
    const poolList = document.getElementById('poolList');
    const poolCount = document.getElementById('poolCount');
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';

    // Side Drawer Open / Close Logic
    const drawer = document.getElementById('pendingDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const btnToggleDrawer = document.getElementById('btnTogglePendingDrawer');
    const btnCloseDrawer = document.getElementById('btnClosePendingDrawer');

    const openDrawer = () => {
        if (drawer) drawer.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
    };
    const closeDrawer = () => {
        if (drawer) drawer.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
    };

    if (btnToggleDrawer) btnToggleDrawer.addEventListener('click', openDrawer);
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    if (chatFeed) {
        const history = getChatHistory();
        chatFeed.innerHTML = '';
        if (history.length === 0) {
            const welcome = lang === 'ar' ? 
                "👋 تم تشغيل شات الحجوزات السريعة. اختر نوع الحجز واكتب رقم العميل." :
                "👋 System Initialized. Choose booking mode and enter customer phone.";
            appendChatMessage(welcome, 'system');
        } else {
            history.forEach(msg => {
                appendChatMessage(msg.text, msg.type);
            });
        }
    }

    const renderPoolList = () => {
        const waiting = getWaitingList();
        let totalCount = 0;
        let totalGB = 0;

        waiting.forEach(item => {
            if (item.isBundle && item.members) {
                totalCount += item.members.length;
                totalGB += item.members.reduce((s, m) => s + parseInt(m.package_gigas || 0), 0);
            } else {
                totalCount += 1;
                totalGB += parseInt(item.package_gigas || 0);
            }
        });

        if (poolCount) poolCount.innerText = totalCount;
        const subtext = document.getElementById('drawerStatsSubtext');
        if (subtext) {
            subtext.innerText = lang === 'ar'
                ? `إجمالي ${totalCount} حجز | ${totalGB} GB`
                : `Total ${totalCount} bookings | ${totalGB} GB`;
        }

        if (poolList) {
            poolList.innerHTML = '';
            if (waiting.length === 0) {
                poolList.innerHTML = `<div style="color: var(--text-dim); text-align: center; padding: 30px; font-size: 0.9rem;" data-i18n="noPendingBookings">${TRANSLATIONS[lang] ? TRANSLATIONS[lang].noPendingBookings : 'No pending bookings.'}</div>`;
            } else {
                waiting.forEach(item => {
                    if (item.isBundle && item.members) {
                        const div = document.createElement('div');
                        div.className = 'bundle-pool-card';
                        let membersHtml = '';
                        item.members.forEach(m => {
                            const priceLabel = isMasterAdmin() ? ` (${m.package_price} EGP)` : '';
                            membersHtml += `
                                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                                    <span>📱 ${escapeHtml(m.customer_number)}</span>
                                    <span style="font-weight: 700; color: var(--color-primary);">${m.package_gigas} GB${priceLabel}</span>
                                </div>
                            `;
                        });

                        const totalStr = isMasterAdmin() ? ` | ${item.total_price} EGP` : '';
                        div.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 6px;">
                                <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary);">👨‍👩‍👧‍👦 مجموعة واحدة (${item.members.length} أرقام)</span>
                                <button class="pool-item-action delete-booking" data-id="${item.id}" title="Remove bundle" style="background: none; border: none; cursor: pointer;">🗑️</button>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                ${membersHtml}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-align: right; font-weight: 600;">
                                إجمالي: ${item.total_gigas} GB${totalStr}
                            </div>
                        `;
                        poolList.appendChild(div);
                    } else {
                        const div = document.createElement('div');
                        div.className = 'pool-item';
                        const priceLabel = isMasterAdmin() ? ` - ${item.package_price} EGP` : '';
                        div.innerHTML = `
                            <div class="pool-item-info">
                                <h4>${escapeHtml(item.customer_number)}</h4>
                                <p>${item.package_gigas} GB${priceLabel}</p>
                            </div>
                            <button class="pool-item-action delete-booking" data-id="${item.id}" title="Remove booking">🗑️</button>
                        `;
                        poolList.appendChild(div);
                    }
                });
            }
        }
    };
    renderPoolList();

    // Mode Switcher & Quick Pills Controller
    let activeMode = 'new';
    let activePackage = 10;
    let editPackage = 10;

    // Central Main Chat Page Mode Switcher
    const modeSwitcher = document.getElementById('modeSwitcher');
    if (modeSwitcher) {
        modeSwitcher.addEventListener('click', (e) => {
            const btn = e.target.closest('.mode-btn');
            if (btn) {
                modeSwitcher.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeMode = btn.getAttribute('data-mode') || 'new';

                document.querySelectorAll('.chat-mode-pane').forEach(p => p.style.display = 'none');
                if (activeMode === 'new') {
                    const p = document.getElementById('paneSingle');
                    if (p) p.style.display = 'flex';
                } else if (activeMode === 'bundle') {
                    const p = document.getElementById('paneBundle');
                    if (p) p.style.display = 'flex';
                } else if (activeMode === 'edit') {
                    const p = document.getElementById('paneEdit');
                    if (p) p.style.display = 'flex';
                }
            }
        });
    }

    const singlePkgPills = document.getElementById('singlePkgPills');
    if (singlePkgPills) {
        singlePkgPills.addEventListener('click', (e) => {
            const pill = e.target.closest('.pkg-pill');
            if (pill) {
                singlePkgPills.querySelectorAll('.pkg-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activePackage = parseInt(pill.getAttribute('data-gb') || '10', 10);
            }
        });
    }

    const editPkgPills = document.getElementById('editPkgPills');
    if (editPkgPills) {
        editPkgPills.addEventListener('click', (e) => {
            const pill = e.target.closest('.pkg-pill');
            if (pill) {
                editPkgPills.querySelectorAll('.pkg-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                editPackage = parseInt(pill.getAttribute('data-gb') || '10', 10);
            }
        });
    }

    const chatForm = document.getElementById('chatForm');
    const chatInputPhone = document.getElementById('chatInputPhone');
    if (chatForm && chatInputPhone) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = chatInputPhone.value.trim();
            if (!val) return;
            processBookingSubmission(val, activePackage, false);
            chatInputPhone.value = '';
        });
    }

    const editChatForm = document.getElementById('editChatForm');
    const editInputPhone = document.getElementById('editInputPhone');
    if (editChatForm && editInputPhone) {
        editChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = editInputPhone.value.trim();
            if (!val) return;
            processBookingSubmission(val, editPackage, true);
            editInputPhone.value = '';
        });
    }

    // -------------------------------------------------------------
    // FLOATING LAUNCHER (FAB), POPOVER & POPUP MODULAR WINDOW
    // -------------------------------------------------------------
    const floatingChatFab = document.getElementById('floatingChatFab');
    const fabPopoverMenu = document.getElementById('fabPopoverMenu');
    const floatingChatWidget = document.getElementById('floatingChatWidget');
    const chatModalBackdrop = document.getElementById('chatModalBackdrop');
    const btnCloseFloatingChat = document.getElementById('btnCloseFloatingChat');

    const closeWidgetModal = () => {
        const widget = document.getElementById('floatingChatWidget');
        const backdrop = document.getElementById('chatModalBackdrop');
        if (widget) {
            widget.classList.remove('active');
            widget.style.display = 'none';
        }
        if (backdrop) {
            backdrop.classList.remove('active');
            backdrop.style.display = 'none';
        }
    };

    window.openWidgetInTab = function(tabKey) {
        const widget = document.getElementById('floatingChatWidget');
        const popover = document.getElementById('fabPopoverMenu');
        const backdrop = document.getElementById('chatModalBackdrop');
        if (!widget) return;

        if (backdrop) {
            backdrop.classList.add('active');
            backdrop.style.display = 'flex';
        }

        widget.classList.add('active');
        widget.style.display = 'flex';
        widget.style.opacity = '1';
        widget.style.visibility = 'visible';
        widget.style.transform = 'scale(1)';
        
        if (popover) popover.classList.remove('active');

        const widgetTabBar = document.getElementById('widgetTabBar');
        if (widgetTabBar) {
            widgetTabBar.querySelectorAll('.widget-tab-btn').forEach(b => b.classList.remove('active'));
            const targetBtn = widgetTabBar.querySelector(`[data-widget-tab="${tabKey}"]`);
            if (targetBtn) targetBtn.classList.add('active');
        }

        document.querySelectorAll('.widget-tab-pane').forEach(pane => {
            pane.classList.remove('active');
            pane.style.display = 'none';
        });

        if (tabKey === 'new') {
            const p = document.getElementById('paneNewBooking');
            if (p) {
                p.classList.add('active');
                p.style.display = 'flex';
            }
        } else if (tabKey === 'bundle') {
            const p = document.getElementById('paneBundleBooking');
            if (p) {
                p.classList.add('active');
                p.style.display = 'flex';
            }
        } else if (tabKey === 'edit') {
            const p = document.getElementById('paneEditBooking');
            if (p) {
                p.classList.add('active');
                p.style.display = 'flex';
            }
        }
    };

    if (floatingChatFab) {
        floatingChatFab.addEventListener('click', (e) => {
            e.stopPropagation();
            const widget = document.getElementById('floatingChatWidget');
            const popover = document.getElementById('fabPopoverMenu');
            if (popover && fabPopoverMenu) {
                fabPopoverMenu.classList.toggle('active');
            } else if (widget) {
                if (widget.classList.contains('active') || widget.style.display === 'flex') {
                    closeWidgetModal();
                } else {
                    window.openWidgetInTab('new');
                }
            }
        });
    }

    if (btnCloseFloatingChat) {
        btnCloseFloatingChat.addEventListener('click', (e) => {
            e.stopPropagation();
            closeWidgetModal();
        });
    }

    if (chatModalBackdrop) {
        chatModalBackdrop.addEventListener('click', (e) => {
            if (e.target === chatModalBackdrop) {
                closeWidgetModal();
            }
        });
    }

    // Global listener for launcher buttons (cards or popover options)
    document.addEventListener('click', (e) => {
        const launcherBtn = e.target.closest('[data-open-widget-tab]');
        if (launcherBtn) {
            e.preventDefault();
            const tabKey = launcherBtn.getAttribute('data-open-widget-tab');
            window.openWidgetInTab(tabKey);
        } else if (fabPopoverMenu && !e.target.closest('#floatingChatFab') && !e.target.closest('#fabPopoverMenu')) {
            fabPopoverMenu.classList.remove('active');
        }
    });

    // 3-Tab Context Switcher in Popup Widget
    const widgetTabBar = document.getElementById('widgetTabBar');
    if (widgetTabBar) {
        widgetTabBar.addEventListener('click', (e) => {
            const btn = e.target.closest('.widget-tab-btn');
            if (btn) {
                const tabKey = btn.getAttribute('data-widget-tab');
                window.openWidgetInTab(tabKey);
            }
        });
    }

    let widgetPackageNew = 10;
    let widgetPackageEdit = 10;

    const widgetPillsNew = document.getElementById('widgetPillsNew');
    if (widgetPillsNew) {
        widgetPillsNew.addEventListener('click', (e) => {
            const pill = e.target.closest('.pkg-pill');
            if (pill) {
                widgetPillsNew.querySelectorAll('.pkg-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                widgetPackageNew = parseInt(pill.getAttribute('data-gb') || '10', 10);
            }
        });
    }

    const widgetPillsEdit = document.getElementById('widgetPillsEdit');
    if (widgetPillsEdit) {
        widgetPillsEdit.addEventListener('click', (e) => {
            const pill = e.target.closest('.pkg-pill');
            if (pill) {
                widgetPillsEdit.querySelectorAll('.pkg-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                widgetPackageEdit = parseInt(pill.getAttribute('data-gb') || '10', 10);
            }
        });
    }

    // Process Booking Helper Function
    function processBookingSubmission(rawPhone, gigas, isEdit) {
        let phone = rawPhone.trim().replace(/[\s\-]/g, '');
        if (phone.startsWith('+20')) phone = '0' + phone.substring(3);
        else if (phone.startsWith('0020')) phone = '0' + phone.substring(4);
        else if (phone.startsWith('20') && phone.length > 11) phone = '0' + phone.substring(2);
        if (!phone.startsWith('0')) phone = '0' + phone;

        if (!/^[0-9]+$/.test(phone) || phone.length !== 11 || !phone.startsWith('01')) {
            appendChatMessageAndSave("❌ Invalid phone number. Must be exactly 11 digits starting with 01.", 'error');
            return;
        }

        const labelPrefix = isEdit ? 'تعديل حجز' : 'حجز جديد';
        appendChatMessageAndSave(`⚡ [${labelPrefix}] ${phone} ➔ ${gigas} GB`, 'sent');

        setTimeout(() => {
            const packages = getPackages();
            if (!packages[gigas]) {
                const available = Object.keys(packages).join(', ');
                appendChatMessageAndSave(`❌ Invalid package size '${gigas} GB'. Available sizes are: ${available} GB.`, 'error');
                return;
            }

            const price = packages[gigas];
            let minutes = 1000;
            if (gigas === 5) minutes = 500;
            else if (gigas >= 20 && gigas <= 40) minutes = 1500;
            else if (gigas >= 50) minutes = 2000;

            let lines = getLines();
            let waiting = getWaitingList();

            if (isEdit) {
                const idx = waiting.findIndex(b => b.customer_number === phone);
                if (idx === -1) {
                    let assignedLine = null;
                    let bookingIdx = -1;
                    lines.forEach(l => {
                        if (l.bookings) {
                            const bIdx = l.bookings.findIndex(b => b.customer_number === phone);
                            if (bIdx !== -1) {
                                assignedLine = l;
                                bookingIdx = bIdx;
                            }
                        }
                    });

                    if (assignedLine && bookingIdx !== -1) {
                        assignedLine.bookings[bookingIdx].package_gigas = gigas;
                        assignedLine.bookings[bookingIdx].package_price = price;
                        assignedLine.bookings[bookingIdx].package_minutes = minutes;
                        saveLines(lines);
                        appendChatMessageAndSave(`✏️ Booking Updated for ${phone}: ${gigas} GB on line ${assignedLine.line_number}`, 'system');
                    } else {
                        appendChatMessageAndSave(`❌ Phone number ${phone} not found in waiting queue or active lines!`, 'error');
                    }
                } else {
                    waiting[idx].package_gigas = gigas;
                    waiting[idx].package_price = price;
                    waiting[idx].package_minutes = minutes;
                    saveWaitingList(waiting);
                    appendChatMessageAndSave(`✏️ Booking Updated for ${phone}: ${gigas} GB (Waiting List)`, 'system');
                }
            } else {
                const dupInPool = waiting.some(b => b.customer_number === phone || (b.isBundle && b.members && b.members.some(m => m.customer_number === phone)));
                const dupInLines = lines.some(l => (l.bookings || []).some(b => b.customer_number === phone));

                if (dupInPool || dupInLines) {
                    appendChatMessageAndSave(`هذا الرقم محجوز بالفعل سابقاً!`, 'error');
                    return;
                }

                const newBooking = {
                    id: Date.now(),
                    customer_number: phone,
                    package_gigas: gigas,
                    package_price: price,
                    package_minutes: minutes,
                    assigned_line_id: null,
                    booking_date: new Date().toISOString()
                };

                waiting.push(newBooking);
                saveWaitingList(waiting);

                appendChatMessageAndSave(`✅ Booking Registered: ${phone} - ${gigas} GB`, 'system');
            }

            renderPoolList();
            openDrawer();
        }, 300);
    }

    // Submit Widget Single New Booking
    const widgetFormNew = document.getElementById('widgetFormNew');
    const widgetInputPhoneNew = document.getElementById('widgetInputPhoneNew');
    if (widgetFormNew && widgetInputPhoneNew) {
        widgetFormNew.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = widgetInputPhoneNew.value.trim();
            if (!val) return;
            processBookingSubmission(val, widgetPackageNew, false);
            widgetInputPhoneNew.value = '';
        });
    }

    // Submit Widget Edit Booking
    const widgetFormEdit = document.getElementById('widgetFormEdit');
    const widgetInputPhoneEdit = document.getElementById('widgetInputPhoneEdit');
    if (widgetFormEdit && widgetInputPhoneEdit) {
        widgetFormEdit.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = widgetInputPhoneEdit.value.trim();
            if (!val) return;
            processBookingSubmission(val, widgetPackageEdit, true);
            widgetInputPhoneEdit.value = '';
        });
    }

    // Submit Bundle Booking Action
    const bundleFieldsList = document.getElementById('bundleFieldsList');
    const btnSubmitBundleBooking = document.getElementById('btnSubmitBundleBooking');
    if (btnSubmitBundleBooking) {
        btnSubmitBundleBooking.addEventListener('click', () => {
            const rows = bundleFieldsList ? bundleFieldsList.querySelectorAll('.bundle-row') : [];
            const packages = getPackages();
            const members = [];
            let isValid = true;
            let totalGigas = 0;
            let totalPrice = 0;

            rows.forEach(row => {
                const phoneInput = row.querySelector('.bundle-phone-input');
                const gbSelect = row.querySelector('.bundle-gb-select');
                let phone = phoneInput ? phoneInput.value.trim() : '';
                const gigas = gbSelect ? parseInt(gbSelect.value) : 10;

                // Ignore empty optional inputs without invalidating the form
                if (!phone) {
                    return;
                }

                if (phone.startsWith('+20')) phone = '0' + phone.substring(3);
                else if (phone.startsWith('0020')) phone = '0' + phone.substring(4);
                else if (phone.startsWith('20') && phone.length > 11) phone = '0' + phone.substring(2);
                if (!phone.startsWith('0')) phone = '0' + phone;

                if (!/^[0-9]+$/.test(phone) || phone.length !== 11 || !phone.startsWith('01')) {
                    alert(`Invalid phone number: ${phone}. Must be 11 digits starting with 01.`);
                    isValid = false;
                    return;
                }

                const price = packages[gigas] || 0;
                let minutes = 1000;
                if (gigas === 5) minutes = 500;
                else if (gigas >= 20 && gigas <= 40) minutes = 1500;
                else if (gigas >= 50) minutes = 2000;

                totalGigas += gigas;
                totalPrice += price;

                members.push({
                    customer_number: phone,
                    package_gigas: gigas,
                    package_price: price,
                    package_minutes: minutes
                });
            });

            if (!isValid || members.length < 2) {
                if (isValid && members.length < 2) {
                    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';
                    alert(lang === 'ar' ? 'يرجى إدخال رقمين صحيحين على الأقل للمجموعة.' : 'Please enter at least 2 valid phone numbers for the bundle.');
                }
                return;
            }

            let waiting = getWaitingList();
            let lines = getLines();

            // Check duplicates
            for (let m of members) {
                const dupInPool = waiting.some(b => b.customer_number === m.customer_number || (b.isBundle && b.members && b.members.some(bm => bm.customer_number === m.customer_number)));
                const dupInLines = lines.some(l => (l.bookings || []).some(b => b.customer_number === m.customer_number));
                if (dupInPool || dupInLines) {
                    alert(`الرقم ${m.customer_number} محجوز بالفعل سابقاً!`);
                    return;
                }
            }

            const bundleBooking = {
                id: Date.now(),
                isBundle: true,
                total_gigas: totalGigas,
                total_price: totalPrice,
                members: members,
                booking_date: new Date().toISOString()
            };

            waiting.push(bundleBooking);
            saveWaitingList(waiting);

            const summary = members.map(m => `${m.customer_number} (${m.package_gigas}GB)`).join('\n');
            appendChatMessageAndSave(summary, 'sent');

            // Reset bundle input fields
            const inputs = bundleFieldsList ? bundleFieldsList.querySelectorAll('.bundle-phone-input') : [];
            inputs.forEach(inp => inp.value = '');

            renderPoolList();
            openDrawer();
        });
    }

    if (poolList) {
        poolList.addEventListener('click', (e) => {
            const btnDel = e.target.closest('.delete-booking');
            if (btnDel) {
                const id = parseInt(btnDel.getAttribute('data-id'));
                let waiting = getWaitingList();
                waiting = waiting.filter(b => b.id !== id);
                saveWaitingList(waiting);
                renderPoolList();
            }
        });
    }
}

function appendChatMessageAndSave(text, type) {
    appendChatMessage(text, type);
    const history = getChatHistory();
    history.push({ text: text, type: type });
    saveChatHistory(history);
}

function renderSearchPage() {
    const searchInput = document.getElementById('gigaSearchInput');
    const resultsContainer = document.getElementById('searchResults');
    const reportContent = document.querySelector('.report-content');
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            const gigas = parseInt(searchInput.value.trim(), 10);
            if (!resultsContainer) return;
            
            if (isNaN(gigas) || gigas <= 0) {
                resultsContainer.innerHTML = `
                    <div class="no-results">
                        <div class="no-results-icon">🔍</div>
                        <p>Enter package size in GB to display live line slots...</p>
                    </div>
                `;
                return;
            }

            const lines = getLines();
            const matchingLines = [];

            lines.forEach(line => {
                const bookings = line.bookings || [];
                const usedGigas = bookings.reduce((sum, b) => sum + parseInt(b.package_gigas || 0), 0);
                const remGigas = line.total_gigas - usedGigas;
                const remSlots = line.max_members - bookings.length;

                if (remGigas >= gigas && remSlots >= 1) {
                    line.remaining_gigas = remGigas;
                    line.member_count = bookings.length;
                    matchingLines.push(line);
                }
            });

            resultsContainer.innerHTML = '';
            if (matchingLines.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="no-results">
                        <div class="no-results-icon">⚠️</div>
                        <p>No available slots found for a ${gigas} GB package. All lines are either full or exceed member limits.</p>
                    </div>
                `;
                return;
            }

            matchingLines.forEach(line => {
                const card = document.createElement('div');
                card.className = 'line-card';
                card.innerHTML = `
                    <div class="line-card-header">
                        <span class="line-badge">${escapeHtml(line.line_number)}</span>
                        <span class="status-tag available">Available</span>
                    </div>
                    <div class="line-card-body">
                        <div class="line-meta-item">
                            <span>Remaining Quota:</span>
                            <span class="line-meta-value">${line.remaining_gigas} GB / ${line.total_gigas} GB</span>
                        </div>
                        <div class="line-meta-item">
                            <span>Member Capacity:</span>
                            <span class="line-meta-value">${line.member_count} / ${line.max_members} Members</span>
                        </div>
                    </div>
                    <div class="line-card-footer" style="flex-wrap: wrap; gap: 8px;">
                        <input type="text" placeholder="Customer Number" class="form-control customer-number-input" style="width: 58%; padding: 8px; font-size: 0.85rem;">
                        <button class="btn btn-primary btn-sm btn-assign-slot" data-line-id="${line.id}" data-gigas="${gigas}" style="width: 38%; padding: 8px;">Assign</button>
                    </div>
                `;
                resultsContainer.appendChild(card);
            });

        }, 250));

        if (resultsContainer) {
            resultsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-assign-slot')) {
                    const lineId = parseInt(e.target.getAttribute('data-line-id'));
                    const gigas = parseInt(e.target.getAttribute('data-gigas'));
                    const cardFooter = e.target.parentElement;
                    const customerInput = cardFooter.querySelector('.customer-number-input');
                    let customerNumber = customerInput ? customerInput.value.trim() : '';

                    if (!customerNumber) {
                        alert('Please enter a customer number.');
                        if (customerInput) customerInput.focus();
                        return;
                    }

                    if (customerNumber.startsWith('+20')) {
                        customerNumber = '0' + customerNumber.substring(3);
                    } else if (customerNumber.startsWith('0020')) {
                        customerNumber = '0' + customerNumber.substring(4);
                    } else if (customerNumber.startsWith('20') && customerNumber.length > 11) {
                        customerNumber = '0' + customerNumber.substring(2);
                    }
                    
                    if (!customerNumber.startsWith('0')) {
                        customerNumber = '0' + customerNumber;
                    }

                    if (!/^[0-9]+$/.test(customerNumber) || customerNumber.length !== 11 || !customerNumber.startsWith('01')) {
                        alert('Invalid phone number. Must be exactly 11 digits starting with 01.');
                        if (customerInput) customerInput.focus();
                        return;
                    }

                    showLoading('Assigning slot...');
                    setTimeout(() => {
                        let lines = getLines();
                        const line = lines.find(l => l.id === lineId);
                        if (!line) {
                            hideLoading();
                            alert('Line not found.');
                            return;
                        }

                        const bookings = line.bookings || [];
                        const usedGigas = bookings.reduce((sum, b) => sum + parseInt(b.package_gigas || 0), 0);
                        const remGigas = line.total_gigas - usedGigas;
                        const remSlots = line.max_members - bookings.length;

                        if (remGigas < gigas || remSlots < 1) {
                            hideLoading();
                            alert(`Cannot assign ${gigas} GB package to this line. Not enough capacity or available slots.`);
                            return;
                        }

                        const dupInLines = lines.some(l => (l.bookings || []).some(b => b.customer_number === customerNumber));
                        const waiting = getWaitingList();
                        const dupInPool = waiting.some(b => b.customer_number === customerNumber);
                        
                        if (dupInLines || dupInPool) {
                            hideLoading();
                            alert('This phone number already has a registered booking.');
                            return;
                        }

                        const price = getPackages()[gigas] || 0;
                        let minutes = 0;
                        if (gigas === 5) {
                            minutes = 500;
                        } else if (gigas === 10 || gigas === 15) {
                            minutes = 1000;
                        } else if (gigas >= 20 && gigas <= 40) {
                            minutes = 1500;
                        } else if (gigas >= 50 && gigas <= 100) {
                            minutes = 2000;
                        }

                        const newBooking = {
                            id: Date.now(),
                            customer_number: customerNumber,
                            package_gigas: gigas,
                            package_price: price,
                            package_minutes: minutes,
                            assigned_line_id: line.id,
                            booking_date: new Date().toISOString()
                        };

                        line.bookings = bookings;
                        line.bookings.push(newBooking);

                        const currentMembers = line.bookings.length;
                        const updatedUsedGigas = line.bookings.reduce((sum, b) => sum + parseInt(b.package_gigas || 0), 0);
                        const isFull = (updatedUsedGigas >= line.total_gigas) || (currentMembers >= line.max_members);
                        line.status = isFull ? 'full' : 'available';

                        saveLines(lines);
                        hideLoading();
                        alert('Customer assigned successfully to line!');
                        
                        searchInput.dispatchEvent(new Event('input'));
                        renderReportBreakdown();
                    }, 400);
                }
            });
        }
    }

    const renderReportBreakdown = () => {
        if (!reportContent) return;
        const lines = getLines();
        reportContent.innerHTML = '';
        if (lines.length === 0) {
            reportContent.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 40px 0;" data-i18n="noReportLines">No active cellular lines registered.</div>`;
            return;
        }

        lines.forEach(line => {
            const bookings = line.bookings || [];
            const currentMembers = bookings.length;
            const usedGigas = bookings.reduce((sum, b) => sum + parseInt(b.package_gigas || 0), 0);
            const usedMinutes = bookings.reduce((sum, b) => sum + parseInt(b.package_minutes || 0), 0);

            const div = document.createElement('div');
            div.className = 'line-breakdown';
            
            let membersHtml = '';
            if (bookings.length === 0) {
                membersHtml = `<div style="font-size: 0.85rem; color: var(--text-dim); font-style: italic; padding: 5px 0;">No customers assigned to this line.</div>`;
            } else {
                bookings.forEach(b => {
                    membersHtml += `
                        <div class="member-tag">
                            <span>📱 ${escapeHtml(b.customer_number)}</span>
                            <span class="tag-gigas">${b.package_gigas} GB</span>
                            <span style="color: var(--text-dim); font-size: 0.85rem;">(${b.package_price} EGP)</span>
                        </div>
                    `;
                });
            }

            div.innerHTML = `
                <div class="breakdown-header">
                    <span class="breakdown-line-num">📶 Line: ${escapeHtml(line.line_number)}</span>
                    <span class="breakdown-line-stats">
                        GB Quota: <strong>${usedGigas} GB / ${line.total_gigas} GB</strong>
                        &nbsp;|&nbsp;
                        Members: <strong>${currentMembers} / ${line.max_members} Seats</strong>
                        &nbsp;|&nbsp;
                        Minutes: <strong>${new Intl.NumberFormat().format(line.total_minutes)} Min</strong>
                        &nbsp;|&nbsp;
                        Status: <strong style="color: ${line.status === 'full' ? 'var(--color-danger)' : 'var(--color-success)'};">${line.status.toUpperCase()}</strong>
                    </span>
                </div>
                <div class="member-tag-list">
                    ${membersHtml}
                </div>
            `;
            reportContent.appendChild(div);
        });
    };
    renderReportBreakdown();

    const phoneSearchInput = document.getElementById('phoneSearchInput');
    const phoneResultsContainer = document.getElementById('phoneSearchResults');
    if (phoneSearchInput && phoneResultsContainer) {
        phoneSearchInput.addEventListener('input', debounce(() => {
            const phone = phoneSearchInput.value.trim();
            if (!phone) {
                phoneResultsContainer.innerHTML = `
                    <div class="no-results">
                        <div class="no-results-icon">📱</div>
                        <p>Enter customer phone number to search which cellular line they are assigned to...</p>
                    </div>
                `;
                return;
            }

            let cleanPhone = phone.replace(/[\s\-]/g, '');
            if (cleanPhone.startsWith('+20')) {
                cleanPhone = '0' + cleanPhone.substring(3);
            } else if (cleanPhone.startsWith('0020')) {
                cleanPhone = '0' + cleanPhone.substring(4);
            } else if (cleanPhone.startsWith('20') && cleanPhone.length > 11) {
                cleanPhone = '0' + cleanPhone.substring(2);
            }
            if (!cleanPhone.startsWith('0') && cleanPhone.length > 0) {
                cleanPhone = '0' + cleanPhone;
            }

            const lines = getLines();
            let foundBooking = null;
            let foundLine = null;

            lines.forEach(l => {
                const b = (l.bookings || []).find(booking => booking.customer_number === cleanPhone);
                if (b) {
                    foundBooking = b;
                    foundLine = l;
                }
            });

            if (foundBooking && foundLine) {
                phoneResultsContainer.innerHTML = `
                    <div class="line-card" style="border-color: var(--color-success); cursor: default; min-height: auto; width: 100%;">
                        <div class="line-card-header" style="margin-bottom: 10px; padding-right: 0;">
                            <span class="line-badge">${escapeHtml(foundLine.line_number)}</span>
                            <span class="status-tag available" style="text-transform: uppercase;">Assigned</span>
                        </div>
                        <div class="line-card-body" style="gap: 8px;">
                            <p style="font-size: 1rem; font-weight: 700; color: var(--color-success); margin-bottom: 5px;">Customer Allocated!</p>
                            <div class="line-meta-item">
                                <span>Phone Number:</span>
                                <span class="line-meta-value">${escapeHtml(foundBooking.customer_number)}</span>
                            </div>
                            <div class="line-meta-item">
                                <span>Assigned Package:</span>
                                <span class="line-meta-value">${foundBooking.package_gigas} GB</span>
                            </div>
                            <div class="line-meta-item">
                                <span>Package Price:</span>
                                <span class="line-meta-value">${foundBooking.package_price} EGP</span>
                            </div>
                            <div class="line-meta-item">
                                <span>Package Minutes:</span>
                                <span class="line-meta-value">${foundBooking.package_minutes || 0} Min</span>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            const waiting = getWaitingList();
            const waitingBooking = waiting.find(b => b.customer_number === cleanPhone);
            if (waitingBooking) {
                phoneResultsContainer.innerHTML = `
                    <div class="line-card" style="border-color: var(--color-warning); cursor: default; min-height: auto; width: 100%;">
                        <div class="line-card-header" style="margin-bottom: 10px; padding-right: 0;">
                            <span class="line-badge">Pending Pool</span>
                            <span class="status-tag available" style="background-color: rgba(245, 158, 11, 0.1); color: var(--color-warning); border-color: rgba(245, 158, 11, 0.2); text-transform: uppercase;">Pending</span>
                        </div>
                        <div class="line-card-body" style="gap: 8px;">
                            <p style="font-size: 1rem; font-weight: 700; color: var(--color-warning); margin-bottom: 5px;">Customer in Pending Pool!</p>
                            <div class="line-meta-item">
                                <span>Phone Number:</span>
                                <span class="line-meta-value">${escapeHtml(waitingBooking.customer_number)}</span>
                            </div>
                            <div class="line-meta-item">
                                <span>Requested Package:</span>
                                <span class="line-meta-value">${waitingBooking.package_gigas} GB</span>
                            </div>
                            <div class="line-meta-item">
                                <span>Package Price:</span>
                                <span class="line-meta-value">${waitingBooking.package_price} EGP</span>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            phoneResultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">⚠️</div>
                    <p>Number not found in active lines or pending pool.</p>
                </div>
            `;
        }, 250));
    }
}

function renderArchivesPage() {
    const archives = getArchivedMonths();
    const tableBody = document.getElementById('archivesTableBody');
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';

    if (tableBody) {
        tableBody.innerHTML = '';
        if (archives.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 35px; color: var(--text-dim);" data-i18n="noArchivesFound">
                        ${TRANSLATIONS[lang] ? TRANSLATIONS[lang].noArchivesFound : 'No archives found.'}
                    </td>
                </tr>
            `;
        } else {
            const sorted = [...archives].sort((a, b) => new Date(b.date) - new Date(a.date));
            sorted.forEach(archive => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-glass)';
                tr.innerHTML = `
                    <td style="padding: 18px; font-weight: 600; color: var(--text-main);">
                        📅 ${escapeHtml(archive.name)}
                    </td>
                    <td style="padding: 18px; text-align: center;">
                        <span class="status-tag available" style="font-size: 0.75rem; padding: 4px 10px; margin: 2px; border-radius: 6px;">CSV (Excel)</span>
                        <span class="status-tag full" style="font-size: 0.75rem; padding: 4px 10px; margin: 2px; border-radius: 6px; background: rgba(168, 85, 247, 0.1); color: #c084fc; border-color: rgba(168, 85, 247, 0.2);">TXT</span>
                    </td>
                    <td style="padding: 18px; text-align: center;">
                        <div style="display: inline-flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                            <button class="btn btn-secondary btn-sm btn-download-csv" data-month-year="${escapeHtml(archive.month_year)}" title="Download CSV">
                                📊 <span data-i18n="btnExcel">${TRANSLATIONS[lang] ? (TRANSLATIONS[lang].btnExcel || 'Excel (CSV)') : 'Excel (CSV)'}</span>
                            </button>
                            <button class="btn btn-secondary btn-sm btn-download-txt" data-month-year="${escapeHtml(archive.month_year)}" title="Download TXT">
                                📝 <span data-i18n="btnText">${TRANSLATIONS[lang] ? (TRANSLATIONS[lang].btnText || 'Text (TXT)') : 'Text (TXT)'}</span>
                            </button>
                            <button class="btn btn-danger btn-sm btn-delete-archive" data-month-year="${escapeHtml(archive.month_year)}" style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);" title="Delete Archive">
                                🗑️ <span data-i18n="btnDelete">${TRANSLATIONS[lang] ? (TRANSLATIONS[lang].btnDelete || 'Delete') : 'Delete'}</span>
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            tableBody.addEventListener('click', (e) => {
                const btnCsv = e.target.closest('.btn-download-csv');
                const btnTxt = e.target.closest('.btn-download-txt');
                const btnDelete = e.target.closest('.btn-delete-archive');

                if (btnCsv) {
                    const key = btnCsv.getAttribute('data-month-year');
                    downloadArchiveFile(key, 'csv');
                } else if (btnTxt) {
                    const key = btnTxt.getAttribute('data-month-year');
                    downloadArchiveFile(key, 'txt');
                } else if (btnDelete) {
                    const key = btnDelete.getAttribute('data-month-year');
                    const confirmMsg = lang === 'ar' ? 
                        "هل أنت متأكد من حذف ملف هذا الشهر نهائياً؟ لا يمكن التراجع عن هذا الإجراء." :
                        "Are you sure you want to permanently delete this month's archive? This action cannot be undone.";
                    
                    if (confirm(confirmMsg)) {
                        let list = getArchivedMonths();
                        list = list.filter(item => item.month_year !== key);
                        saveArchivedMonths(list);
                        alert(lang === 'ar' ? 'تم حذف الأرشيف بنجاح!' : 'Archive deleted successfully!');
                        renderArchivesPage();
                    }
                }
            });
        }
    }
}

function downloadArchiveFile(monthYear, type) {
    const archives = getArchivedMonths();
    const archive = archives.find(item => item.month_year === monthYear);
    if (!archive) {
        alert('Archive data not found!');
        return;
    }

    const bookings = archive.bookings || [];
    let filename = '';
    let blobContent = '';
    let mimeType = '';

    if (type === 'txt') {
        filename = `archive_${monthYear}.txt`;
        mimeType = 'text/plain;charset=utf-8';
        
        const grouped = {};
        bookings.forEach(b => {
            const gb = parseInt(b.package_gigas || 0);
            if (!grouped[gb]) grouped[gb] = [];
            grouped[gb].push(b.customer_number);
        });
        
        const sortedGbs = Object.keys(grouped).map(Number).sort((a, b) => a - b);
        const sections = [];
        sortedGbs.forEach(gb => {
            sections.push(`*** ${gb} GB ***\n` + grouped[gb].join('\n'));
        });
        blobContent = sections.join('\n\n');

    } else if (type === 'csv') {
        filename = `archive_${monthYear}.csv`;
        mimeType = 'text/csv;charset=utf-8';
        
        const lines = [['Phone Number', 'Gigabytes (GB)', 'Price (EGP)', 'Minutes', 'Assigned Line']];
        bookings.forEach(b => {
            lines.push([
                b.customer_number,
                b.package_gigas,
                b.package_price,
                b.package_minutes,
                b.line_number || 'N/A'
            ]);
        });
        
        const csvRows = lines.map(row => 
            row.map(val => {
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            }).join(',')
        );
        blobContent = '\uFEFF' + csvRows.join('\r\n');
    }

    const blob = new Blob([blobContent], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// -------------------------------------------------------------
// RESERVED BUNDLES MANAGEMENT PAGE IMPLEMENTATION
// -------------------------------------------------------------

function renderReservedBundlesPage() {
    const tableBody = document.getElementById('reservedBundlesTbody');
    if (!tableBody) return;

    const searchInput = document.getElementById('reservedSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const lines = getLines();
    const waiting = getWaitingList();
    const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';

    const allItems = [];

    // Collect from waiting list
    waiting.forEach(b => {
        if (b.isBundle && (b.members || b.items)) {
            const subs = b.members || b.items;
            subs.forEach((m, mIdx) => {
                allItems.push({
                    phone: m.customer_number || m.phone || '',
                    gigas: parseInt(m.package_gigas || m.gb || 0),
                    date: b.booking_date || new Date().toISOString(),
                    isAssigned: false,
                    assignedText: lang === 'ar' ? '⏳ قائمة الانتظار (مجموعة)' : '⏳ Waiting List (Group)',
                    source: 'waiting_bundle',
                    bookingId: b.id,
                    memberIndex: mIdx
                });
            });
        } else {
            allItems.push({
                phone: b.customer_number || b.phone || '',
                gigas: parseInt(b.package_gigas || b.gb || 0),
                date: b.booking_date || new Date().toISOString(),
                isAssigned: false,
                assignedText: lang === 'ar' ? '⏳ قائمة الانتظار' : '⏳ Waiting List',
                source: 'waiting_single',
                bookingId: b.id
            });
        }
    });

    // Collect from assigned lines
    lines.forEach(line => {
        const bookings = line.bookings || [];
        bookings.forEach(b => {
            if (b.isBundle && (b.members || b.items)) {
                const subs = b.members || b.items;
                subs.forEach((m, mIdx) => {
                    allItems.push({
                        phone: m.customer_number || m.phone || '',
                        gigas: parseInt(m.package_gigas || m.gb || 0),
                        date: b.booking_date || line.created_at || new Date().toISOString(),
                        isAssigned: true,
                        assignedText: `🔗 ${line.line_number}`,
                        lineId: line.id,
                        source: 'line_bundle',
                        bookingId: b.id,
                        memberIndex: mIdx
                    });
                });
            } else {
                allItems.push({
                    phone: b.customer_number || b.phone || '',
                    gigas: parseInt(b.package_gigas || b.gb || 0),
                    date: b.booking_date || line.created_at || new Date().toISOString(),
                    isAssigned: true,
                    assignedText: `🔗 ${line.line_number}`,
                    lineId: line.id,
                    source: 'line_single',
                    bookingId: b.id
                });
            }
        });
    });

    // Update KPI stats
    const totalNumbers = allItems.length;
    const totalGB = allItems.reduce((sum, item) => sum + item.gigas, 0);
    const pendingCount = allItems.filter(item => !item.isAssigned).length;
    const assignedCount = allItems.filter(item => item.isAssigned).length;

    const elTotNum = document.getElementById('kpiTotalReservedNumbers');
    if (elTotNum) elTotNum.innerText = totalNumbers;

    const elTotGB = document.getElementById('kpiTotalAllocatedGB');
    if (elTotGB) elTotGB.innerText = `${totalGB} GB`;

    const elPend = document.getElementById('kpiPendingReserved');
    if (elPend) elPend.innerText = pendingCount;

    const elAssigned = document.getElementById('kpiAssignedReserved');
    if (elAssigned) elAssigned.innerText = assignedCount;

    // Filter items if query exists
    const filteredItems = query
        ? allItems.filter(item => item.phone.toLowerCase().includes(query) || (item.gigas + 'gb').includes(query) || item.assignedText.toLowerCase().includes(query))
        : allItems;

    tableBody.innerHTML = '';

    if (filteredItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-dim); padding: 30px 0;">
                    ${query ? 'لا توجد أرقام تطابق البحث' : 'لا توجد باقات محجوزة حتي الآن.'}
                </td>
            </tr>
        `;
        return;
    }

    filteredItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-glass)';

        let formattedDate = '-';
        try {
            formattedDate = new Date(item.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            formattedDate = item.date;
        }

        tr.innerHTML = `
            <td style="padding: 14px 18px; font-family: monospace; font-weight: 600; font-size: 0.95rem; color: var(--text-main);">
                📱 ${escapeHtml(item.phone)}
            </td>
            <td style="padding: 14px 18px;">
                <span style="background: rgba(167, 139, 250, 0.15); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.3); padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.85rem;">
                    ${item.gigas} GB
                </span>
            </td>
            <td style="padding: 14px 18px;">
                <span class="status-tag ${item.isAssigned ? 'available' : 'full'}" style="font-size: 0.82rem; padding: 4px 10px;">
                    ${escapeHtml(item.assignedText)}
                </span>
            </td>
            <td style="padding: 14px 18px; font-size: 0.82rem; color: var(--text-muted);">
                ${formattedDate}
            </td>
            <td style="padding: 14px 18px; text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="btn btn-secondary btn-sm btn-edit-reserved" 
                        data-phone="${escapeHtml(item.phone)}" 
                        data-gb="${item.gigas}" 
                        data-source="${item.source}" 
                        data-booking-id="${item.bookingId || ''}" 
                        data-line-id="${item.lineId || ''}" 
                        data-member-index="${item.memberIndex !== undefined ? item.memberIndex : ''}"
                        style="padding: 6px 12px; font-size: 0.85rem; font-weight: 600;">
                        ✏️ تعديل
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete-reserved" 
                        data-phone="${escapeHtml(item.phone)}" 
                        data-source="${item.source}" 
                        data-booking-id="${item.bookingId || ''}" 
                        data-line-id="${item.lineId || ''}" 
                        data-member-index="${item.memberIndex !== undefined ? item.memberIndex : ''}"
                        style="padding: 6px 12px; font-size: 0.85rem; font-weight: 600;">
                        🗑️ حذف
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Bind search input real-time filtering
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'reservedSearchInput') {
        renderReservedBundlesPage();
    }
});

// Reserved table Action Delegates (Edit & Delete)
document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit-reserved');
    if (editBtn) {
        const phone = editBtn.getAttribute('data-phone');
        const gb = editBtn.getAttribute('data-gb');
        const bookingId = editBtn.getAttribute('data-booking-id');
        const lineId = editBtn.getAttribute('data-line-id');
        const memberIndex = editBtn.getAttribute('data-member-index');

        const modal = document.getElementById('editReservedModal');
        if (modal) {
            document.getElementById('editReservedPhone').value = phone || '';
            document.getElementById('editReservedGB').value = gb || '10';
            document.getElementById('editReservedBookingId').value = bookingId || '';
            document.getElementById('editReservedLineId').value = lineId || '';
            document.getElementById('editReservedMemberIdx').value = memberIndex !== null && memberIndex !== undefined ? memberIndex : '';
            modal.style.display = 'flex';
        }
        return;
    }

    const deleteBtn = e.target.closest('.btn-delete-reserved');
    if (deleteBtn) {
        const phone = deleteBtn.getAttribute('data-phone');
        const lineId = deleteBtn.getAttribute('data-line-id');
        const bookingId = deleteBtn.getAttribute('data-booking-id');
        const memberIdx = deleteBtn.getAttribute('data-member-index');
        const lang = localStorage.getItem('selected_lang') || localStorage.getItem('lang') || 'en';

        const confirmMsg = lang === 'ar'
            ? `هل أنت متأكد من حذف الحجز للرقم ${phone}؟`
            : `Are you sure you want to delete reservation for ${phone}?`;

        if (confirm(confirmMsg)) {
            if (lineId) {
                unassignOrderFromLine(phone, lineId, bookingId, memberIdx !== '' ? parseInt(memberIdx) : undefined);
            } else if (bookingId) {
                let waiting = getWaitingList();
                const bIdx = waiting.findIndex(b => String(b.id) === String(bookingId));
                if (bIdx !== -1) {
                    const booking = waiting[bIdx];
                    if (booking.isBundle && booking.members && memberIdx !== '') {
                        booking.members.splice(parseInt(memberIdx), 1);
                        if (booking.members.length === 0) {
                            waiting.splice(bIdx, 1);
                        }
                    } else {
                        waiting.splice(bIdx, 1);
                    }
                    saveWaitingList(waiting);
                }
            }
            renderReservedBundlesPage();
            refreshActiveView();
        }
        return;
    }

    // Modal Close Buttons
    if (e.target.id === 'btnCloseEditModal' || e.target.id === 'btnCancelEditModal') {
        const modal = document.getElementById('editReservedModal');
        if (modal) modal.style.display = 'none';
    }
});

// Submit Edit Form Handler
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'editReservedForm') {
        e.preventDefault();
        const phone = document.getElementById('editReservedPhone').value.trim();
        const newGB = parseInt(document.getElementById('editReservedGB').value, 10);
        const bookingId = document.getElementById('editReservedBookingId').value;
        const lineId = document.getElementById('editReservedLineId').value;
        const memberIdxStr = document.getElementById('editReservedMemberIdx').value;
        const memberIdx = memberIdxStr !== '' ? parseInt(memberIdxStr) : null;

        if (!phone) return;

        const packages = getPackages();
        const price = packages[newGB] || 0;
        let minutes = 1000;
        if (newGB === 5) minutes = 500;
        else if (newGB >= 20 && newGB <= 40) minutes = 1500;
        else if (newGB >= 50) minutes = 2000;

        if (lineId) {
            let lines = getLines();
            const targetLine = lines.find(l => String(l.id) === String(lineId));
            if (targetLine && targetLine.bookings) {
                const bObj = targetLine.bookings.find(b => String(b.id) === String(bookingId));
                if (bObj) {
                    if (bObj.isBundle && bObj.members && memberIdx !== null) {
                        if (bObj.members[memberIdx]) {
                            bObj.members[memberIdx].customer_number = phone;
                            bObj.members[memberIdx].package_gigas = newGB;
                            bObj.members[memberIdx].package_price = price;
                            bObj.members[memberIdx].package_minutes = minutes;
                        }
                    } else {
                        bObj.customer_number = phone;
                        bObj.package_gigas = newGB;
                        bObj.package_price = price;
                        bObj.package_minutes = minutes;
                    }
                    saveLines(lines);
                }
            }
        } else if (bookingId) {
            let waiting = getWaitingList();
            const bObj = waiting.find(b => String(b.id) === String(bookingId));
            if (bObj) {
                if (bObj.isBundle && bObj.members && memberIdx !== null) {
                    if (bObj.members[memberIdx]) {
                        bObj.members[memberIdx].customer_number = phone;
                        bObj.members[memberIdx].package_gigas = newGB;
                        bObj.members[memberIdx].package_price = price;
                        bObj.members[memberIdx].package_minutes = minutes;
                    }
                } else {
                    bObj.customer_number = phone;
                    bObj.package_gigas = newGB;
                    bObj.package_price = price;
                    bObj.package_minutes = minutes;
                }
                saveWaitingList(waiting);
            }
        }

        const modal = document.getElementById('editReservedModal');
        if (modal) modal.style.display = 'none';

        renderReservedBundlesPage();
        refreshActiveView();
    }
});

// CSV Export for Reserved Bundles
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btnExportReservedCSV') {
        const lines = getLines();
        const waiting = getWaitingList();
        const csvRows = [['Customer Number', 'Package GB', 'Status / Line', 'Booking Date']];

        waiting.forEach(b => {
            if (b.isBundle && (b.members || b.items)) {
                (b.members || b.items).forEach(m => {
                    csvRows.push([m.customer_number || m.phone, m.package_gigas || m.gb, 'Waiting List (Bundle)', b.booking_date || '']);
                });
            } else {
                csvRows.push([b.customer_number || b.phone, b.package_gigas || b.gb, 'Waiting List', b.booking_date || '']);
            }
        });

        lines.forEach(line => {
            (line.bookings || []).forEach(b => {
                if (b.isBundle && (b.members || b.items)) {
                    (b.members || b.items).forEach(m => {
                        csvRows.push([m.customer_number || m.phone, m.package_gigas || m.gb, line.line_number, b.booking_date || '']);
                    });
                } else {
                    csvRows.push([b.customer_number || b.phone, b.package_gigas || b.gb, line.line_number, b.booking_date || '']);
                }
            });
        });

        const csvContent = csvRows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `reserved_bundles_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

// -------------------------------------------------------------
// PAYMENTS & ACCOUNTS MANAGEMENT MODULE
// -------------------------------------------------------------

const PAYMENTS_OFFICIAL_PRICING_MAP = {
    "GB 10": 210,
    "GB 15": 250,
    "GB 20": 290,
    "GB 30": 370,
    "GB 40": 450,
    "GB 50": 540,
    "GB 60": 670,
    "GB 70": 750,
    "GB 100": 770,
    "GB 130": 950,
    "GB 140": 1000,
    "GB 200": 1400
};

function getSubUserPricing() {
    const key = getWorkspaceKey('sub_user_pricing');
    try {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
    } catch(e) {}

    // Master admin gets official default pricing if not set
    if (isMasterAdmin()) {
        return { ...PAYMENTS_OFFICIAL_PRICING_MAP };
    }
    // Sub-users start completely empty
    return {};
}

function saveSubUserPricing(pricingMap) {
    const key = getWorkspaceKey('sub_user_pricing');
    localStorage.setItem(key, JSON.stringify(pricingMap));
    saveToFirestore(key, pricingMap);
}

function getPaymentDefaultPrice(gbVal) {
    if (gbVal === null || gbVal === undefined) return 0;
    const subPricing = getSubUserPricing();
    const systemPricing = getPricing();

    const rawStr = String(gbVal).trim();
    const num = parseInt(rawStr.replace(/[^0-9]/g, ''), 10);
    const gbKey = `GB ${num}`;

    if (!isNaN(num)) {
        if (subPricing && subPricing[gbKey] !== undefined && subPricing[gbKey] !== "") return parseInt(subPricing[gbKey], 10);
        if (subPricing && subPricing[num] !== undefined && subPricing[num] !== "") return parseInt(subPricing[num], 10);
        if (systemPricing && systemPricing[num] !== undefined && systemPricing[num] !== "") return parseInt(systemPricing[num], 10);
        if (isMasterAdmin() && PAYMENTS_OFFICIAL_PRICING_MAP[gbKey] !== undefined) return PAYMENTS_OFFICIAL_PRICING_MAP[gbKey];
    }
    return 0;
}

function getCustomersDb() {
    const key = getWorkspaceKey('customers_db');
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch(e) {
        return {};
    }
}

function saveCustomerName(phone, name) {
    if (!phone) return;
    const cleanPhone = String(phone).trim();
    const cleanName = String(name || '').trim();
    if (!cleanPhone) return;

    const dbObj = getCustomersDb();
    if (cleanName) {
        dbObj[cleanPhone] = cleanName;
    } else {
        delete dbObj[cleanPhone];
    }
    const key = getWorkspaceKey('customers_db');
    localStorage.setItem(key, JSON.stringify(dbObj));
    saveToFirestore(key, dbObj);
}

function getCustomerName(phone) {
    if (!phone) return '';
    const cleanPhone = String(phone).trim();
    const dbObj = getCustomersDb();
    if (dbObj[cleanPhone]) return dbObj[cleanPhone];

    // Fallback: search in payments records
    const records = typeof getPaymentsRecords === 'function' ? getPaymentsRecords() : {};
    if (records[cleanPhone] && records[cleanPhone].client_name) {
        return records[cleanPhone].client_name;
    }
    return '';
}

function getCustomerPhoneByName(name) {
    if (!name) return '';
    const cleanName = String(name).trim().toLowerCase();
    if (!cleanName) return '';

    const dbObj = getCustomersDb();
    for (let phone in dbObj) {
        if (dbObj[phone] && String(dbObj[phone]).trim().toLowerCase() === cleanName) {
            return phone;
        }
    }

    // Search in payments records
    const records = typeof getPaymentsRecords === 'function' ? getPaymentsRecords() : {};
    for (let key in records) {
        const r = records[key];
        if (r && r.client_name && String(r.client_name).trim().toLowerCase() === cleanName && r.phone) {
            return r.phone;
        }
    }

    // Search in archived months history
    const archives = typeof getArchivedMonths === 'function' ? getArchivedMonths() : [];
    for (let arch of archives) {
        if (arch.bookings) {
            for (let b of arch.bookings) {
                if (b.client_name && String(b.client_name).trim().toLowerCase() === cleanName && (b.customer_number || b.phone)) {
                    return b.customer_number || b.phone;
                }
            }
        }
    }
    return '';
}

function populateCustomerDatalist() {
    const datalist = document.getElementById('existingCustomersList');
    if (!datalist) return;

    const namesSet = new Set();
    const dbObj = getCustomersDb();
    for (let phone in dbObj) {
        if (dbObj[phone]) namesSet.add(String(dbObj[phone]).trim());
    }

    const records = typeof getPaymentsRecords === 'function' ? getPaymentsRecords() : {};
    for (let key in records) {
        if (records[key] && records[key].client_name) {
            namesSet.add(String(records[key].client_name).trim());
        }
    }

    datalist.innerHTML = Array.from(namesSet).map(name => `<option value="${escapeHtml(name)}"></option>`).join('');
}

function getAdminBillsData() {
    const key = getWorkspaceKey('admin_bills_data');
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch(e) {
        return {};
    }
}

function saveAdminBillsData(data) {
    const key = getWorkspaceKey('admin_bills_data');
    localStorage.setItem(key, JSON.stringify(data));
    saveToFirestore(key, data);
}

function getPaymentsRecords() {
    const key = getWorkspaceKey('payments_records');
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch(e) {
        return {};
    }
}

function savePaymentsRecords(records) {
    const key = getWorkspaceKey('payments_records');
    localStorage.setItem(key, JSON.stringify(records));
    saveToFirestore(key, records);
    if (db) {
        try {
            if (typeof records === 'object' && records !== null) {
                Object.keys(records).forEach(recId => {
                    db.collection('payments').doc(String(recId)).set(records[recId], { merge: true })
                      .catch(err => console.error(`Firestore payment sync error [${recId}]:`, err));
                });
            }
        } catch(e) {
            console.error('Firestore savePaymentsRecords error:', e);
        }
    }
}

function getAllPaymentItems() {
    const lines = getLines();
    const waiting = getWaitingList();
    const pricing = getPricing();
    const customRecords = getPaymentsRecords();

    const rawItems = [];
    const seenMap = new Map();

    const processBooking = (b, lineId = null, lineNum = null) => {
        if (!b) return;
        if (b.isBundle && (b.members || b.items || b.numbers)) {
            const subMembers = b.members || b.items || b.numbers;
            subMembers.forEach((m, idx) => {
                const phone = m.customer_number || m.phone;
                if (!phone) return;
                const gbRaw = m.package_gigas || m.gb || 10;
                const gb = parseInt(gbRaw, 10) || 10;
                const defaultPrice = getPaymentDefaultPrice(gbRaw) || getPaymentDefaultPrice(gb) || parseInt(m.package_price || m.price || pricing[gb] || 0, 10);
                const uniqueKey = `${phone}_bundle_${b.id || 'b'}_${idx}`;

                const custom = customRecords[uniqueKey] || customRecords[phone] || {};
                const globalName = getCustomerName(phone);
                const clientName = custom.client_name || globalName || m.client_name || b.client_name || '';
                const totalPrice = custom.total_price !== undefined ? parseInt(custom.total_price, 10) : defaultPrice;
                const paidAmount = custom.paid_amount !== undefined ? parseInt(custom.paid_amount, 10) : 0;
                const remainingAmount = Math.max(0, totalPrice - paidAmount);

                let status = 'unpaid';
                if (paidAmount >= totalPrice && totalPrice > 0) {
                    status = 'paid';
                } else if (paidAmount > 0) {
                    status = 'partial';
                }

                const itemObj = {
                    id: uniqueKey,
                    phone: phone,
                    client_name: clientName,
                    package_gigas: gb,
                    total_price: totalPrice,
                    paid_amount: paidAmount,
                    remaining_amount: remainingAmount,
                    status: status,
                    line_number: lineNum || 'قائمة الانتظار',
                    booking_date: b.booking_date || new Date().toISOString()
                };

                if (seenMap.has(phone)) {
                    const existingIdx = seenMap.get(phone);
                    if (lineNum && (!rawItems[existingIdx].line_number || rawItems[existingIdx].line_number === 'قائمة الانتظار')) {
                        rawItems[existingIdx] = itemObj;
                    }
                } else {
                    seenMap.set(phone, rawItems.length);
                    rawItems.push(itemObj);
                }
            });
        } else {
            const phone = b.customer_number || b.phone;
            if (!phone) return;
            const gbRaw = b.package_gigas || b.gb || 10;
            const gb = parseInt(gbRaw, 10) || 10;
            const defaultPrice = getPaymentDefaultPrice(gbRaw) || getPaymentDefaultPrice(gb) || parseInt(b.package_price || b.price || pricing[gb] || 0, 10);
            const uniqueKey = String(b.id || phone);

            const custom = customRecords[uniqueKey] || customRecords[phone] || {};
            const globalName = getCustomerName(phone);
            const clientName = custom.client_name || globalName || b.client_name || '';
            const totalPrice = custom.total_price !== undefined ? parseInt(custom.total_price, 10) : defaultPrice;
            const paidAmount = custom.paid_amount !== undefined ? parseInt(custom.paid_amount, 10) : 0;
            const remainingAmount = Math.max(0, totalPrice - paidAmount);

            let status = 'unpaid';
            if (paidAmount >= totalPrice && totalPrice > 0) {
                status = 'paid';
            } else if (paidAmount > 0) {
                status = 'partial';
            }

            const itemObj = {
                id: uniqueKey,
                phone: phone,
                client_name: clientName,
                package_gigas: gb,
                total_price: totalPrice,
                paid_amount: paidAmount,
                remaining_amount: remainingAmount,
                status: status,
                line_number: lineNum || 'قائمة الانتظار',
                booking_date: b.booking_date || new Date().toISOString()
            };

            if (seenMap.has(phone)) {
                const existingIdx = seenMap.get(phone);
                if (lineNum && (!rawItems[existingIdx].line_number || rawItems[existingIdx].line_number === 'قائمة الانتظار')) {
                    rawItems[existingIdx] = itemObj;
                }
            } else {
                seenMap.set(phone, rawItems.length);
                rawItems.push(itemObj);
            }
        }
    };

    // 1. Process waiting list
    waiting.forEach(b => processBooking(b));

    // 2. Process assigned lines (overrides waiting items for same phone)
    lines.forEach(line => {
        (line.bookings || line.allocatedNumbers || []).forEach(b => processBooking(b, line.id, line.line_number));
    });

    // 3. Process custom manual payments (isManual: true)
    for (let key in customRecords) {
        const record = customRecords[key];
        if (record && record.isManual && !rawItems.some(i => i.id === record.id)) {
            const phone = record.phone || '';
            const clientName = record.client_name || (phone ? getCustomerName(phone) : '') || 'عميل يدوي';
            const gbTitle = record.package_gigas || 'خدمة مباشرة';
            const totalPrice = parseInt(record.total_price || 0, 10);
            const paidAmount = parseInt(record.paid_amount || 0, 10);
            const remainingAmount = Math.max(0, totalPrice - paidAmount);

            let status = 'unpaid';
            if (paidAmount >= totalPrice && totalPrice > 0) {
                status = 'paid';
            } else if (paidAmount > 0) {
                status = 'partial';
            }

            rawItems.push({
                id: record.id,
                isManual: true,
                phone: phone || 'بدون رقم',
                client_name: clientName,
                package_gigas: gbTitle,
                total_price: totalPrice,
                paid_amount: paidAmount,
                remaining_amount: remainingAmount,
                status: status,
                line_number: 'خدمة مباشرة',
                booking_date: record.updated_at || new Date().toISOString()
            });
        }
    }

    return rawItems;
}

window.currentPaymentStatusFilter = 'all';

function renderPaymentsPage() {
    const tbody = document.getElementById('paymentsTbody');
    if (!tbody) return;

    populateCustomerDatalist();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('open_bills') === 'true') {
        setTimeout(() => {
            if (typeof openBillsModal === 'function') openBillsModal();
        }, 150);
    }

    const allItems = getAllPaymentItems();
    const searchVal = (document.getElementById('paymentsSearchInput')?.value || '').trim().toLowerCase();
    const activeFilter = window.currentPaymentStatusFilter || 'all';

    // Calculate KPI Totals
    let totalCollected = 0;
    let totalRemaining = 0;
    let totalBookingsValue = 0;

    let countAll = allItems.length;
    let countPaid = 0;
    let countPartial = 0;
    let countUnpaid = 0;

    allItems.forEach(item => {
        totalCollected += item.paid_amount;
        totalRemaining += item.remaining_amount;
        totalBookingsValue += item.total_price;

        if (item.status === 'paid') countPaid++;
        else if (item.status === 'partial') countPartial++;
        else countUnpaid++;
    });

    // Calculate Bills & Estimated Profit
    const lines = getLines();
    const billsData = getAdminBillsData();
    const outsideExpenses = parseInt(billsData.outside_expenses || '0', 10);
    const lineBillsSum = lines.reduce((sum, line) => {
        const val = billsData[line.id] !== undefined ? billsData[line.id] : (billsData[line.line_number] || 0);
        return sum + parseInt(val || '0', 10);
    }, 0);
    const totalBills = lineBillsSum + outsideExpenses;
    const estimatedProfit = totalBookingsValue - totalBills;

    // Render KPIs
    const elCollected = document.getElementById('kpiTotalCollected');
    const elRemaining = document.getElementById('kpiTotalRemaining');
    const elValue = document.getElementById('kpiTotalBookingsValue');
    const elSubtext = document.getElementById('kpiTotalCountSubtext');

    if (elCollected) elCollected.textContent = `${totalCollected.toLocaleString()} EGP`;
    if (elRemaining) elRemaining.textContent = `${totalRemaining.toLocaleString()} EGP`;
    if (elValue) elValue.textContent = `${totalBookingsValue.toLocaleString()} EGP`;
    if (elSubtext) elSubtext.textContent = `${countAll} عميل محجوز`;

    // Render Bills & Profit KPI
    const elTotalBills = document.getElementById('kpiTotalBills');
    const elProfit = document.getElementById('kpiEstimatedProfit');
    const elProfitTag = document.getElementById('kpiProfitStatusTag');

    if (elTotalBills) elTotalBills.textContent = `${totalBills.toLocaleString()} EGP`;
    if (elProfit) {
        elProfit.textContent = `${estimatedProfit.toLocaleString()} EGP`;
        if (estimatedProfit > 0) {
            elProfit.style.color = '#34d399';
            if (elProfitTag) {
                elProfitTag.textContent = 'صافي ربح ممتاز ↗';
                elProfitTag.style.color = '#34d399';
            }
        } else if (estimatedProfit < 0) {
            elProfit.style.color = '#f87171';
            if (elProfitTag) {
                elProfitTag.textContent = 'عجز / خسارة ↘';
                elProfitTag.style.color = '#f87171';
            }
        } else {
            elProfit.style.color = 'var(--text-main)';
            if (elProfitTag) {
                elProfitTag.textContent = 'نقطة التعادل';
                elProfitTag.style.color = 'var(--text-muted)';
            }
        }
    }

    // Filter Counters
    const cAll = document.getElementById('countFilterAll');
    const cPaid = document.getElementById('countFilterPaid');
    const cPartial = document.getElementById('countFilterPartial');
    const cUnpaid = document.getElementById('countFilterUnpaid');

    if (cAll) cAll.textContent = countAll;
    if (cPaid) cPaid.textContent = countPaid;
    if (cPartial) cPartial.textContent = countPartial;
    if (cUnpaid) cUnpaid.textContent = countUnpaid;

    // Apply Filters
    const filteredItems = allItems.filter(item => {
        const matchesStatus = activeFilter === 'all' || item.status === activeFilter;
        const matchesSearch = !searchVal || 
            item.phone.toLowerCase().includes(searchVal) || 
            (item.client_name && item.client_name.toLowerCase().includes(searchVal));
        return matchesStatus && matchesSearch;
    });

    if (filteredItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">💳</div>
                    <div>لا توجد سجلات دفع مطابقة للفلتر المحدد.</div>
                </td>
            </tr>
        `;
        return;
    }

function formatEgyptianWhatsAppNumber(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('01') && digits.length === 11) {
        digits = '2' + digits;
    } else if (digits.startsWith('1') && digits.length === 10) {
        digits = '20' + digits;
    } else if (!digits.startsWith('20') && digits.length === 10) {
        digits = '20' + digits;
    }
    return digits;
}

function buildWhatsAppReminderUrl(phone, clientName, packageName, totalPrice, paidAmount, remainingAmount) {
    const formattedPhone = formatEgyptianWhatsAppNumber(phone);
    if (!formattedPhone) return '#';

    const greetingName = clientName && clientName.trim() ? clientName.trim() : 'العميل الكريم';
    const pkg = packageName || 'الإنترنت';
    const totalStr = `${totalPrice.toLocaleString()} جنيه`;
    const paidStr = `${paidAmount.toLocaleString()} جنيه`;
    const remStr = `${remainingAmount.toLocaleString()} جنيه`;

    const message = `مرحباً أ/ ${greetingName} 👋\n` +
        `تذكير لطيف بمتبقي اشتراك باقة الإنترنت (${pkg}):\n\n` +
        `• إجمالي سعر الباقة: ${totalStr}\n` +
        `• المدفوع: ${paidStr}\n` +
        `• 🔴 المبلغ المتبقي: ${remStr}\n\n` +
        `برجاء تكرم السداد عبر (فودافون كاش / إنستا باي).\n` +
        `شاكرين ومقدرين لكم تعاملكم معنا! ⚡`;

    const encodedMsg = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
}

    tbody.innerHTML = filteredItems.map(item => {
        let badgeHtml = '';
        if (item.status === 'paid') {
            badgeHtml = `<span class="payment-badge badge-paid">✓ تم الدفع بالكامل</span>`;
        } else if (item.status === 'partial') {
            badgeHtml = `<span class="payment-badge badge-partial">⏳ دفع جزئي (متبقي ${item.remaining_amount.toLocaleString()} EGP)</span>`;
        } else {
            badgeHtml = `<span class="payment-badge badge-unpaid">✖ غير مدفوع</span>`;
        }

        const nameDisplay = item.client_name 
            ? `<div style="font-size: 0.82rem; font-weight: 600; color: var(--color-primary); margin-top: 2px;">👤 ${item.client_name}</div>` 
            : '';

        const payFullBtnHtml = item.remaining_amount > 0 ? `
            <button type="button" class="btn btn-primary btn-sm btn-pay-full" 
                data-id="${item.id}"
                data-phone="${item.phone}"
                data-client-name="${item.client_name || ''}"
                data-total-price="${item.total_price}"
                style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 14px; font-size: 0.82rem; font-weight: 700; border: none; border-radius: 8px;"
                title="تسجيل المبلغ بالكامل واستيفاء الدفع">
                ✅ دفع بالكامل
            </button>
        ` : '';

        return `
            <tr style="border-bottom: 1px solid var(--border-glass);">
                <td style="padding: 16px 20px;">
                    <div style="font-family: monospace; font-weight: 700; font-size: 1rem; color: var(--text-main); font-variant-numeric: tabular-nums;">${item.phone}</div>
                    ${nameDisplay}
                </td>
                <td style="padding: 16px 20px;">
                    <span class="line-badge">${item.package_gigas} GB</span>
                </td>
                <td style="padding: 16px 20px; font-weight: 700; font-variant-numeric: tabular-nums;">
                    ${item.total_price.toLocaleString()} EGP
                </td>
                <td style="padding: 16px 20px; font-weight: 700; color: var(--color-success); font-variant-numeric: tabular-nums;">
                    ${item.paid_amount.toLocaleString()} EGP
                </td>
                <td style="padding: 16px 20px; font-weight: 700; color: ${item.remaining_amount > 0 ? 'var(--color-warning)' : 'var(--text-muted)'}; font-variant-numeric: tabular-nums;">
                    ${item.remaining_amount.toLocaleString()} EGP
                </td>
                <td style="padding: 16px 20px;">
                    ${badgeHtml}
                </td>
                <td style="padding: 16px 20px; text-align: center; white-space: nowrap; display: flex; gap: 8px; justify-content: center; align-items: center;">
                    ${payFullBtnHtml}
                    <button type="button" class="btn btn-secondary btn-sm btn-edit-payment" 
                        data-id="${item.id}"
                        data-phone="${item.phone}"
                        data-client-name="${item.client_name || ''}"
                        data-total-price="${item.total_price}"
                        data-paid-amount="${item.paid_amount}"
                        style="padding: 6px 14px; font-size: 0.82rem; font-weight: 600;">
                        💳 تعديل
                    </button>
                    <button type="button" class="btn btn-danger btn-sm delete-customer-btn" 
                        data-id="${item.id}"
                        data-phone="${item.phone}"
                        data-client-name="${item.client_name || ''}"
                        style="padding: 6px 12px; font-size: 0.82rem; font-weight: 700; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 8px;"
                        title="حذف العميل نهائياً">
                        🗑️ حذف
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Delete Customer Action Handler (Firestore Direct Delete & Cache Cleanup)
document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-customer-btn');
    if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        const phone = deleteBtn.getAttribute('data-phone');
        const clientName = deleteBtn.getAttribute('data-client-name') || phone || 'العميل';

        if (confirm(`هل أنت تأكد من حذف العميل (${clientName}) نهائياً من قاعدة البيانات السحابية والنظام؟`)) {
            // 1. Direct Firestore Deletions across collections
            if (db) {
                try {
                    if (id) {
                        db.collection('payments').doc(String(id)).delete().catch(err => console.error('Firestore delete payment err:', err));
                        db.collection('bookings').doc(String(id)).delete().catch(err => console.error('Firestore delete booking err:', err));
                        db.collection('customers_db').doc(String(id)).delete().catch(err => console.error('Firestore delete customer err:', err));
                        db.collection('subscriptions').doc(String(id)).delete().catch(err => console.error('Firestore delete subscription err:', err));
                    }
                    if (phone && phone !== id) {
                        db.collection('payments').doc(String(phone)).delete().catch(err => console.error('Firestore delete payment phone err:', err));
                        db.collection('customers_db').doc(String(phone)).delete().catch(err => console.error('Firestore delete customer phone err:', err));
                        db.collection('subscriptions').doc(String(phone)).delete().catch(err => console.error('Firestore delete sub phone err:', err));
                    }
                } catch(err) {
                    console.error('Firestore customer deletion error:', err);
                }
            }

            // 2. Remove orphan data from Local Storage payments_records
            const records = getPaymentsRecords();
            if (id && records[id]) delete records[id];
            if (phone && records[phone]) delete records[phone];
            savePaymentsRecords(records);

            // 3. Remove from waiting list
            let waiting = getWaitingList();
            waiting = waiting.filter(b => b.id !== id && String(b.id) !== String(id) && b.customer_number !== phone && b.phone !== phone);
            saveWaitingList(waiting);

            // 4. Remove from active cellular line bookings if allocated
            let lines = getLines();
            let lineChanged = false;
            lines.forEach(line => {
                if (line.bookings && line.bookings.length > 0) {
                    const prevLen = line.bookings.length;
                    line.bookings = line.bookings.filter(b => b.id !== id && String(b.id) !== String(id) && b.customer_number !== phone && b.phone !== phone);
                    if (line.bookings.length !== prevLen) {
                        lineChanged = true;
                        const usedGigas = line.bookings.reduce((sum, b) => sum + parseInt(b.package_gigas || 0), 0);
                        const isFull = (usedGigas >= line.total_gigas) || (line.bookings.length >= line.max_members);
                        line.status = isFull ? 'full' : 'available';
                    }
                }
            });
            if (lineChanged) saveLines(lines);

            // 5. Trigger live UI re-render
            refreshActiveView();
            if (typeof renderPaymentsPage === 'function') renderPaymentsPage();
        }
    }
});

// Payment Filter Tabs Delegate
document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.payment-filter-tabs .filter-tab');
    if (tabBtn) {
        document.querySelectorAll('.payment-filter-tabs .filter-tab').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');
        window.currentPaymentStatusFilter = tabBtn.getAttribute('data-status') || 'all';
        renderPaymentsPage();
    }
});

// Real-time search for payments
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'paymentsSearchInput') {
        renderPaymentsPage();
    }
});

// One-Click Full Payment Button Handler ("دفع بالكامل")
document.addEventListener('click', (e) => {
    const fullPayBtn = e.target.closest('.btn-pay-full');
    if (fullPayBtn) {
        const id = fullPayBtn.getAttribute('data-id');
        const phone = fullPayBtn.getAttribute('data-phone');
        const totalPrice = parseInt(fullPayBtn.getAttribute('data-total-price') || '0', 10);
        const clientName = fullPayBtn.getAttribute('data-client-name') || getCustomerName(phone) || '';

        const records = getPaymentsRecords();
        records[id] = {
            ...records[id],
            id: id,
            phone: phone,
            client_name: clientName,
            total_price: totalPrice,
            paid_amount: totalPrice,
            remaining_amount: 0,
            status: 'paid',
            updated_at: new Date().toISOString()
        };

        if (phone) {
            records[phone] = { ...records[id] };
            if (clientName) saveCustomerName(phone, clientName);
        }

        savePaymentsRecords(records);

        if (db) {
            db.collection('payments').doc(String(id)).set(records[id], { merge: true }).catch(err => console.warn('Firestore payment sync err:', err));
        }

        renderPaymentsPage();
    }
});

// Open Edit Payment Modal
document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit-payment');
    if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const phone = editBtn.getAttribute('data-phone');
        const globalName = getCustomerName(phone);
        const clientName = editBtn.getAttribute('data-client-name') || globalName || '';
        const totalPrice = parseInt(editBtn.getAttribute('data-total-price') || '0', 10);
        const paidAmount = parseInt(editBtn.getAttribute('data-paid-amount') || '0', 10);

        const modal = document.getElementById('editPaymentModal');
        if (modal) {
            document.getElementById('editPaymentId').value = id;
            document.getElementById('editPaymentPhone').value = phone;
            document.getElementById('editPaymentSubhead').textContent = `رقم: ${phone}`;
            document.getElementById('editPaymentClientName').value = clientName;
            document.getElementById('editPaymentTotalPrice').value = totalPrice;
            document.getElementById('editPaymentPaidAmount').value = paidAmount;

            updatePaymentPreview();
            modal.style.display = 'flex';
        }
    }

    if (e.target && (e.target.id === 'btnClosePaymentModal' || e.target.id === 'btnCancelPaymentModal')) {
        const modal = document.getElementById('editPaymentModal');
        if (modal) modal.style.display = 'none';
    }
});

// Live update dynamic preview in Payment Modal
function updatePaymentPreview() {
    const totalPrice = Math.max(0, parseInt(document.getElementById('editPaymentTotalPrice')?.value || '0', 10));
    const paidAmount = Math.max(0, parseInt(document.getElementById('editPaymentPaidAmount')?.value || '0', 10));
    const remaining = Math.max(0, totalPrice - paidAmount);

    const elRem = document.getElementById('previewRemainingAmount');
    const elBadge = document.getElementById('previewStatusBadge');

    if (elRem) elRem.textContent = `${remaining.toLocaleString()} EGP`;

    if (elBadge) {
        if (paidAmount >= totalPrice && totalPrice > 0) {
            elBadge.innerHTML = `<span class="payment-badge badge-paid">✓ تم الدفع بالكامل</span>`;
        } else if (paidAmount > 0) {
            elBadge.innerHTML = `<span class="payment-badge badge-partial">⏳ دفع جزئي (متبقي ${remaining.toLocaleString()} EGP)</span>`;
        } else {
            elBadge.innerHTML = `<span class="payment-badge badge-unpaid">✖ غير مدفوع</span>`;
        }
    }
}

document.addEventListener('input', (e) => {
    if (e.target && (e.target.id === 'editPaymentTotalPrice' || e.target.id === 'editPaymentPaidAmount')) {
        updatePaymentPreview();
    }
});

// Submit Payment Edit Form
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'editPaymentForm') {
        e.preventDefault();
        const id = document.getElementById('editPaymentId').value;
        const phone = document.getElementById('editPaymentPhone').value;
        const clientName = document.getElementById('editPaymentClientName').value.trim();
        const totalPrice = parseInt(document.getElementById('editPaymentTotalPrice').value || '0', 10);
        const paidAmount = parseInt(document.getElementById('editPaymentPaidAmount').value || '0', 10);

        const records = getPaymentsRecords();
        records[id] = {
            ...records[id],
            id: id,
            phone: phone,
            client_name: clientName,
            total_price: totalPrice,
            paid_amount: paidAmount,
            remaining_amount: Math.max(0, totalPrice - paidAmount),
            status: paidAmount >= totalPrice && totalPrice > 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'),
            updated_at: new Date().toISOString()
        };
        // Also map by phone for fallback
        if (phone) {
            records[phone] = { ...records[id] };
            saveCustomerName(phone, clientName);
        }

        savePaymentsRecords(records);

        if (db) {
            db.collection('payments').doc(String(id)).set(records[id], { merge: true }).catch(err => console.warn('Firestore payment sync err:', err));
        }

        const modal = document.getElementById('editPaymentModal');
        if (modal) modal.style.display = 'none';

        renderPaymentsPage();
    }
});

// Export Payments CSV Handler
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btnExportPaymentsCSV') {
        const allItems = getAllPaymentItems();
        const csvRows = [['Customer Phone', 'Client Name', 'Package GB', 'Total Price (EGP)', 'Paid Amount (EGP)', 'Remaining (EGP)', 'Payment Status']];

        allItems.forEach(item => {
            let statusText = 'Unpaid';
            if (item.status === 'paid') statusText = 'Fully Paid';
            else if (item.status === 'partial') statusText = 'Partially Paid';

            csvRows.push([
                `"${item.phone}"`,
                `"${item.client_name || ''}"`,
                item.package_gigas,
                item.total_price,
                item.paid_amount,
                item.remaining_amount,
                statusText
            ]);
        });

        const csvContent = csvRows.map(r => r.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `payments_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

// Package Selling Pricing Modal Handlers & Cloud Persistence
const ALL_PACKAGE_TIERS = [
    { gb: "GB 10", defaultPrice: 210 },
    { gb: "GB 15", defaultPrice: 250 },
    { gb: "GB 20", defaultPrice: 290 },
    { gb: "GB 30", defaultPrice: 370 },
    { gb: "GB 40", defaultPrice: 450 },
    { gb: "GB 50", defaultPrice: 540 },
    { gb: "GB 60", defaultPrice: 670 },
    { gb: "GB 70", defaultPrice: 750 },
    { gb: "GB 100", defaultPrice: 770 },
    { gb: "GB 130", defaultPrice: 950 },
    { gb: "GB 140", defaultPrice: 1000 },
    { gb: "GB 200", defaultPrice: 1400 }
];

function openSellingPricesModal() {
    const modal = document.getElementById('sellingPricesModal') || document.getElementById('pricingModal') || document.getElementById('subUserPricingModal');
    const container = document.getElementById('pricingTiersGrid');
    if (!modal) return;

    const subPricing = getSubUserPricing() || {};
    const isMaster = isMasterAdmin();

    if (container) {
        container.innerHTML = ALL_PACKAGE_TIERS.map(tier => {
            const gbKey = tier.gb;
            const currentVal = subPricing[gbKey] !== undefined 
                ? subPricing[gbKey] 
                : (isMaster ? (PAYMENTS_OFFICIAL_PRICING_MAP[gbKey] || tier.defaultPrice) : "");
            return `
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">باقة ${gbKey} (سعر البيع - جنيه):</label>
                    <input type="number" min="0" class="form-control input-tier-price" data-gb="${gbKey}" value="${currentVal}" placeholder="أدخل سعر البيع" style="height: 42px; font-weight: 700; font-variant-numeric: tabular-nums;">
                </div>
            `;
        }).join('');
    }

    modal.style.display = 'flex';
}

document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'btnOpenSubUserPricingModal' || e.target.closest('#btnOpenSubUserPricingModal') || e.target.id === 'btnOpenSellingPricesModal' || e.target.closest('#btnOpenSellingPricesModal'))) {
        openSellingPricesModal();
    }
    if (e.target && (e.target.id === 'btnClosePricingModal' || e.target.id === 'btnCancelPricingModal' || e.target.id === 'btnCloseSellingPricesModal')) {
        const modal = document.getElementById('sellingPricesModal') || document.getElementById('pricingModal') || document.getElementById('subUserPricingModal');
        if (modal) modal.style.display = 'none';
    }
});

document.addEventListener('submit', (e) => {
    if (e.target && (e.target.id === 'sellingPricesForm' || e.target.id === 'pricingModalForm' || e.target.id === 'subUserPricingForm')) {
        e.preventDefault();
        const pricingMap = {};
        document.querySelectorAll('.input-tier-price').forEach(input => {
            const gbKey = input.getAttribute('data-gb');
            const valStr = (input.value || '').trim();
            if (gbKey && valStr !== '') {
                pricingMap[gbKey] = Math.max(0, parseInt(valStr, 10));
            }
        });

        saveSubUserPricing(pricingMap);

        const modal = document.getElementById('sellingPricesModal') || document.getElementById('pricingModal') || document.getElementById('subUserPricingModal');
        if (modal) modal.style.display = 'none';

        renderPaymentsPage();
    }
});

// Interactive Bills & Profit Calculator Modal Handlers inside payments.html
function openBillsModal() {
    const modal = document.getElementById('billsModal');
    const container = document.getElementById('modalLinesBillsContainer');
    const outsideInput = document.getElementById('inputOutsideExpensesModal');
    if (!modal) return;

    const lines = getLines();
    const billsData = getAdminBillsData();

    if (container) {
        if (lines.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 16px;">لا توجد خطوط مسجلة حالياً في مساحة العمل.</div>`;
        } else {
            container.innerHTML = lines.map(line => {
                const val = billsData[line.id] !== undefined ? billsData[line.id] : (billsData[line.line_number] || 0);
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-glass);">
                        <div>
                            <strong style="font-family: monospace; font-size: 0.95rem; color: var(--text-main); font-variant-numeric: tabular-nums;">${line.line_number}</strong>
                            <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">سعة الخط: ${line.total_gigas} GB</span>
                        </div>
                        <div style="width: 130px;">
                            <input type="number" min="0" class="form-control modal-line-bill" data-line-id="${line.id}" data-line-num="${line.line_number}" value="${val}" placeholder="0" style="height: 38px; font-weight: 700; font-variant-numeric: tabular-nums;">
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    if (outsideInput) {
        outsideInput.value = billsData.outside_expenses !== undefined ? billsData.outside_expenses : 0;
    }

    modal.style.display = 'flex';
    updateBillsModalPreview();
}

function updateBillsModalPreview() {
    const allItems = getAllPaymentItems();
    const totalBookingsValue = allItems.reduce((sum, item) => sum + (parseInt(item.total_price, 10) || 0), 0);

    let totalLineBills = 0;
    document.querySelectorAll('.modal-line-bill').forEach(input => {
        totalLineBills += Math.max(0, parseInt(input.value || '0', 10));
    });
    const outsideExpenses = Math.max(0, parseInt(document.getElementById('inputOutsideExpensesModal')?.value || '0', 10));
    const totalBillsAndExpenses = totalLineBills + outsideExpenses;

    const profit = totalBookingsValue - totalBillsAndExpenses;

    const elBookings = document.getElementById('modalBookingsTotal');
    const elBills = document.getElementById('modalBillsTotal');
    const elProfit = document.getElementById('modalEstimatedProfit');

    if (elBookings) elBookings.textContent = `${totalBookingsValue.toLocaleString()} EGP`;
    if (elBills) elBills.textContent = `${totalBillsAndExpenses.toLocaleString()} EGP`;
    if (elProfit) {
        elProfit.textContent = `${profit.toLocaleString()} EGP`;
        if (profit > 0) elProfit.style.color = '#34d399';
        else if (profit < 0) elProfit.style.color = '#f87171';
        else elProfit.style.color = 'var(--text-main)';
    }
}

document.addEventListener('click', (e) => {
    const kpiBillsCard = e.target.closest('#kpiCardBillsProfit');
    if (kpiBillsCard) {
        openBillsModal();
    }
    if (e.target && (e.target.id === 'btnCloseBillsModal' || e.target.id === 'btnCancelBillsModal')) {
        const modal = document.getElementById('billsModal');
        if (modal) modal.style.display = 'none';
    }
});

document.addEventListener('input', (e) => {
    if (e.target && (e.target.classList.contains('modal-line-bill') || e.target.id === 'inputOutsideExpensesModal')) {
        updateBillsModalPreview();
    }
});

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'billsModalForm') {
        e.preventDefault();
        const billsData = getAdminBillsData();

        document.querySelectorAll('.modal-line-bill').forEach(input => {
            const lineId = input.getAttribute('data-line-id');
            const lineNum = input.getAttribute('data-line-num');
            const val = Math.max(0, parseInt(input.value || '0', 10));
            if (lineId) billsData[lineId] = val;
            if (lineNum) billsData[lineNum] = val;
        });

        const outsideVal = Math.max(0, parseInt(document.getElementById('inputOutsideExpensesModal')?.value || '0', 10));
        billsData.outside_expenses = outsideVal;

        saveAdminBillsData(billsData);

        const modal = document.getElementById('billsModal');
        if (modal) modal.style.display = 'none';

        renderPaymentsPage();
    }
});

// Manual Payment Modal Handlers
document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'btnOpenManualPaymentModal' || e.target.closest('#btnOpenManualPaymentModal'))) {
        const modal = document.getElementById('manualPaymentModal');
        if (modal) {
            updateManualPaymentPreview();
            modal.style.display = 'flex';
        }
    }
    if (e.target && (e.target.id === 'btnCloseManualPaymentModal' || e.target.id === 'btnCancelManualPaymentModal')) {
        const modal = document.getElementById('manualPaymentModal');
        if (modal) modal.style.display = 'none';
    }
});

function updateManualPaymentPreview() {
    const totalAmount = Math.max(0, parseInt(document.getElementById('manualTotalAmount')?.value || '0', 10));
    const paidAmount = Math.max(0, parseInt(document.getElementById('manualPaidAmount')?.value || '0', 10));
    const remaining = Math.max(0, totalAmount - paidAmount);

    const elRemaining = document.getElementById('manualPreviewRemaining');
    const elBadge = document.getElementById('manualPreviewStatusBadge');

    if (elRemaining) elRemaining.textContent = `${remaining.toLocaleString()} EGP`;
    if (elBadge) {
        if (paidAmount >= totalAmount && totalAmount > 0) {
            elBadge.innerHTML = `<span class="payment-badge badge-paid">✓ تم الدفع بالكامل</span>`;
        } else if (paidAmount > 0) {
            elBadge.innerHTML = `<span class="payment-badge badge-partial">⏳ دفع جزئي (متبقي ${remaining.toLocaleString()} EGP)</span>`;
        } else {
            elBadge.innerHTML = `<span class="payment-badge badge-unpaid">✖ غير مدفوع</span>`;
        }
    }
}

document.addEventListener('input', (e) => {
    if (e.target && (e.target.id === 'manualTotalAmount' || e.target.id === 'manualPaidAmount')) {
        updateManualPaymentPreview();
    }

    // Dynamic Name -> Phone Lookup (Audio Feature: Typing name auto-fills stored phone number)
    if (e.target && (e.target.id === 'manualClientName' || e.target.id === 'editPaymentClientName')) {
        const typedName = e.target.value.trim();
        if (typedName.length >= 2) {
            const foundPhone = getCustomerPhoneByName(typedName);
            if (foundPhone) {
                if (e.target.id === 'manualClientName') {
                    const phoneEl = document.getElementById('manualClientPhone');
                    if (phoneEl && !phoneEl.value.trim()) phoneEl.value = foundPhone;
                } else if (e.target.id === 'editPaymentClientName') {
                    const phoneEl = document.getElementById('editPaymentPhone');
                    if (phoneEl && !phoneEl.value.trim()) phoneEl.value = foundPhone;
                }
            }
        }
    }

    // Dynamic Phone -> Name Lookup (Typing phone auto-fills stored customer name)
    if (e.target && (e.target.id === 'manualClientPhone' || e.target.id === 'editPaymentPhone')) {
        const typedPhone = e.target.value.trim();
        if (typedPhone.length >= 8) {
            const foundName = getCustomerName(typedPhone);
            if (foundName) {
                if (e.target.id === 'manualClientPhone') {
                    const nameEl = document.getElementById('manualClientName');
                    if (nameEl && !nameEl.value.trim()) nameEl.value = foundName;
                } else if (e.target.id === 'editPaymentPhone') {
                    const nameEl = document.getElementById('editPaymentClientName');
                    if (nameEl && !nameEl.value.trim()) nameEl.value = foundName;
                }
            }
        }
    }
});

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'manualPaymentForm') {
        e.preventDefault();
        const clientName = document.getElementById('manualClientName').value.trim();
        const phone = document.getElementById('manualClientPhone').value.trim();
        const serviceTitle = document.getElementById('manualServiceTitle').value.trim() || 'خدمة جديدة';
        const totalAmount = Math.max(0, parseInt(document.getElementById('manualTotalAmount').value || '0', 10));
        const paidAmount = Math.max(0, parseInt(document.getElementById('manualPaidAmount').value || '0', 10));

        if (!clientName) return;

        const recordId = `manual_${Date.now()}`;
        const records = getPaymentsRecords();

        records[recordId] = {
            id: recordId,
            isManual: true,
            phone: phone || '',
            client_name: clientName,
            package_gigas: serviceTitle,
            total_price: totalAmount,
            paid_amount: paidAmount,
            updated_at: new Date().toISOString()
        };

        if (phone) {
            records[phone] = { ...records[recordId] };
            saveCustomerName(phone, clientName);
        }

        savePaymentsRecords(records);

        const modal = document.getElementById('manualPaymentModal');
        if (modal) modal.style.display = 'none';

        document.getElementById('manualPaymentForm').reset();
        renderPaymentsPage();
    }
});

// Admin System Users & Activity Logs Engine
function getSystemUsers() {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('system_users') || '[]');
    } catch(e) { users = []; }

    let adminUser = users.find(u => u.username === 'admin');
    if (!adminUser) {
        adminUser = { id: 'admin', username: 'admin', password: '1111', role: 'master', created_at: new Date().toISOString() };
        users.unshift(adminUser);
    } else {
        adminUser.password = '1111';
    }
    localStorage.setItem('system_users', JSON.stringify(users));
    if (db) {
        db.collection('users').doc('admin').set({ id: 'admin', username: 'admin', password: '1111', role: 'master' }, { merge: true }).catch(err => console.warn('Firestore set admin err:', err));
    }
    return users;
}

function saveSystemUsers(users) {
    localStorage.setItem('system_users', JSON.stringify(users));
    saveToFirestore('users', users);
}

function getActivityLogs() {
    try {
        return JSON.parse(localStorage.getItem('activity_logs') || '[]');
    } catch(e) {
        return [];
    }
}

window.unsubscribeUsersListener = null;
window.unsubscribeLogsListener = null;

function renderAdminPage() {
    const mainAdminContent = document.getElementById('adminPageMainContainer');
    const accessDeniedBox = document.getElementById('adminAccessDeniedContainer');
    const usersTbody = document.getElementById('usersDirectoryTbody');
    const logsTbody = document.getElementById('activityLogsTbody');
    if (!usersTbody && !logsTbody && !mainAdminContent && !accessDeniedBox) return;

    if (!isMasterAdmin()) {
        if (mainAdminContent) mainAdminContent.style.display = 'none';
        if (accessDeniedBox) accessDeniedBox.style.display = 'block';
        return;
    }

    if (mainAdminContent) mainAdminContent.style.display = 'block';
    if (accessDeniedBox) accessDeniedBox.style.display = 'none';

    const currentUser = getCurrentUser();
    const elActiveUser = document.getElementById('kpiActiveUserDisplay');
    const elActiveRole = document.getElementById('kpiActiveUserRole');

    if (elActiveUser) elActiveUser.textContent = currentUser.username || 'admin';
    if (elActiveRole) elActiveRole.textContent = `الصلاحية: ${currentUser.role === 'master' || currentUser.role === 'admin' ? 'مدير عام (Master Admin)' : 'مستخدم فرعي (Sub-User)'}`;

    // Clean up previous listeners if re-rendering
    if (typeof window.unsubscribeUsersListener === 'function') window.unsubscribeUsersListener();
    if (typeof window.unsubscribeLogsListener === 'function') window.unsubscribeLogsListener();

    // 1. Real-time Users Collection Listener (onSnapshot)
    if (db) {
        window.unsubscribeUsersListener = db.collection('users').onSnapshot(snapshot => {
            const users = [];
            snapshot.forEach(doc => {
                const u = doc.data();
                users.push(u);
            });

            let adminDoc = users.find(u => u.username === 'admin');
            if (!adminDoc) {
                adminDoc = { id: 'admin', username: 'admin', password: '1111', role: 'master' };
                users.unshift(adminDoc);
                if (db) db.collection('users').doc('admin').set(adminDoc, { merge: true }).catch(err => console.warn('Firestore admin doc sync err:', err));
            } else if (adminDoc.password !== '1111') {
                adminDoc.password = '1111';
                if (db) db.collection('users').doc('admin').set({ password: '1111' }, { merge: true }).catch(err => console.warn('Firestore admin password sync err:', err));
            }

            localStorage.setItem('system_users', JSON.stringify(users));

            const elTotalUsers = document.getElementById('kpiTotalUsersCount');
            if (elTotalUsers) elTotalUsers.textContent = users.length;

            if (usersTbody) {
                usersTbody.innerHTML = users.map(u => {
                    const isMaster = u.role === 'master' || u.role === 'admin' || u.username === 'admin';
                    const roleBadge = isMaster 
                        ? `<span class="payment-badge badge-paid">👑 مدير عام (Master)</span>` 
                        : `<span class="payment-badge badge-partial">👤 مستخدم فرعي (Sub-User)</span>`;
                    
                    const workspaceLabel = isMaster ? 'المساحة الرئيسية (Global)' : `workspace_${u.id || u.username}`;
                    const deleteBtn = isMaster ? `<span style="font-size: 0.8rem; color: var(--text-muted);">حساب أساسي</span>` : `
                        <button type="button" class="btn btn-secondary btn-sm btn-delete-user" data-username="${u.username}" style="padding: 4px 10px; font-size: 0.8rem; color: var(--color-danger);">
                            🗑️ حذف الحساب
                        </button>
                    `;

                    return `
                        <tr style="border-bottom: 1px solid var(--border-glass);">
                            <td style="padding: 14px 18px; font-weight: 700; color: var(--text-main); font-family: monospace;">${escapeHtml(u.username)}</td>
                            <td style="padding: 14px 18px;">${roleBadge}</td>
                            <td style="padding: 14px 18px; font-size: 0.82rem; font-family: monospace; color: var(--text-muted);">${workspaceLabel}</td>
                            <td style="padding: 14px 18px; text-align: center;">${deleteBtn}</td>
                        </tr>
                    `;
                }).join('');
            }
        }, err => console.warn('Users onSnapshot fallback notice:', err));

        // 2. Real-time Activity Logs Collection Listener (onSnapshot)
        window.unsubscribeLogsListener = db.collection('activity_logs').orderBy('timestamp', 'desc').limit(100).onSnapshot(snapshot => {
            const logs = [];
            snapshot.forEach(doc => {
                logs.push(doc.data());
            });

            localStorage.setItem('activity_logs', JSON.stringify(logs));

            const elTotalLogs = document.getElementById('kpiTotalLogsCount');
            if (elTotalLogs) elTotalLogs.textContent = logs.length;

            if (logsTbody) {
                if (logs.length === 0) {
                    logsTbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
                                لا توجد نشاطات مسجلة حالياً في قاعدة البيانات السحابية.
                            </td>
                        </tr>
                    `;
                } else {
                    logsTbody.innerHTML = logs.map(log => {
                        const dt = log.timestamp ? new Date(log.timestamp).toLocaleString('ar-EG') : 'الآن';
                        return `
                            <tr style="border-bottom: 1px solid var(--border-glass);">
                                <td style="padding: 14px 18px; font-size: 0.85rem; font-family: monospace; font-variant-numeric: tabular-nums;">${dt}</td>
                                <td style="padding: 14px 18px; font-weight: 700; color: var(--text-main);">${escapeHtml(log.username)} <span style="font-size: 0.78rem; font-weight: normal; color: var(--text-muted);">(${escapeHtml(log.role)})</span></td>
                                <td style="padding: 14px 18px; font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(log.device || 'Windows PC')}</td>
                                <td style="padding: 14px 18px; font-family: monospace; font-size: 0.85rem;">${escapeHtml(log.ip || '127.0.0.1')}</td>
                                <td style="padding: 14px 18px; font-size: 0.85rem;">${escapeHtml(log.location || 'القاهرة، مصر')}</td>
                                <td style="padding: 14px 18px;"><span class="payment-badge badge-paid">${escapeHtml(log.status || 'تسجيل دخول ناجح ✓')}</span></td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        }, err => console.warn('Logs onSnapshot fallback notice:', err));
    } else {
        // Fallback UI rendering when offline / no Firestore SDK
        const users = getSystemUsers();
        const logs = getActivityLogs();

        const elTotalUsers = document.getElementById('kpiTotalUsersCount');
        const elTotalLogs = document.getElementById('kpiTotalLogsCount');
        if (elTotalUsers) elTotalUsers.textContent = users.length;
        if (elTotalLogs) elTotalLogs.textContent = logs.length;

        if (usersTbody) {
            usersTbody.innerHTML = users.map(u => {
                const isMaster = u.role === 'master' || u.role === 'admin' || u.username === 'admin';
                const roleBadge = isMaster 
                    ? `<span class="payment-badge badge-paid">👑 مدير عام (Master)</span>` 
                    : `<span class="payment-badge badge-partial">👤 مستخدم فرعي (Sub-User)</span>`;
                
                const workspaceLabel = isMaster ? 'المساحة الرئيسية (Global)' : `workspace_${u.id || u.username}`;
                const deleteBtn = isMaster ? `<span style="font-size: 0.8rem; color: var(--text-muted);">حساب أساسي</span>` : `
                    <button type="button" class="btn btn-secondary btn-sm btn-delete-user" data-username="${u.username}" style="padding: 4px 10px; font-size: 0.8rem; color: var(--color-danger);">
                        🗑️ حذف الحساب
                    </button>
                `;

                return `
                    <tr style="border-bottom: 1px solid var(--border-glass);">
                        <td style="padding: 14px 18px; font-weight: 700; color: var(--text-main); font-family: monospace;">${escapeHtml(u.username)}</td>
                        <td style="padding: 14px 18px;">${roleBadge}</td>
                        <td style="padding: 14px 18px; font-size: 0.82rem; font-family: monospace; color: var(--text-muted);">${workspaceLabel}</td>
                        <td style="padding: 14px 18px; text-align: center;">${deleteBtn}</td>
                    </tr>
                `;
            }).join('');
        }
    }
}

// Sub-User Creation & Firestore Sync Handler
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'createSubUserForm') {
        e.preventDefault();
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        if (!username || !password) return;

        const users = getSystemUsers();
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            alert('⚠️ اسم المستخدم مسجل بالفعل! اختر اسماً آخر.');
            return;
        }

        const newUser = {
            id: `user_${Date.now()}`,
            username: username,
            password: password,
            role: role,
            created_at: new Date().toISOString()
        };

        if (db) {
            db.collection('users').doc(username).set(newUser, { merge: true }).catch(err => console.error('Firestore save error:', err));
        }

        users.push(newUser);
        saveSystemUsers(users);

        document.getElementById('createSubUserForm').reset();
    }
});
// Delete Sub-User & Clear Logs Handler
document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete-user');
    if (deleteBtn) {
        const username = deleteBtn.getAttribute('data-username');
        if (!username || username === 'admin') return;

        if (confirm(`هل أنت تأكد من حذف حساب المستخدم (${username}) من قاعدة البيانات السحابية؟`)) {
            if (db) {
                db.collection('users').doc(username).delete().catch(err => console.error('Firestore delete error:', err));
            }
            let users = getSystemUsers();
            users = users.filter(u => u.username !== username);
            saveSystemUsers(users);
        }
    }
    if (e.target && e.target.id === 'btnClearActivityLogs') {
        if (confirm('هل أنت تأكد من مسح جميع سجلات النشاطات والزيارات من قاعدة البيانات السحابية؟')) {
            if (db) {
                db.collection('activity_logs').get().then(snapshot => {
                    snapshot.forEach(doc => doc.ref.delete());
                }).catch(err => console.error('Firestore clear logs error:', err));
            }
            localStorage.setItem('activity_logs', JSON.stringify([]));
        }
    }
});

// -------------------------------------------------------------
// SYSTEM AUDIT LOGGER & ACTIVITY STREAM ENGINE
// -------------------------------------------------------------
function logActivity(action, details = '') {
    const logsKey = getWorkspaceKey('activity_logs');
    let logs = [];
    try {
        logs = JSON.parse(localStorage.getItem(logsKey) || '[]');
    } catch(e) { logs = []; }

    const currentUser = getCurrentUser();
    const newLog = {
        id: `log_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        date: new Date().toLocaleString('ar-EG'),
        timestamp: new Date().toISOString(),
        username: currentUser ? currentUser.username : 'admin',
        role: currentUser ? currentUser.role : 'master',
        action: action,
        details: details,
        device: typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop',
        ip: 'Local Workstation'
    };

    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();

    localStorage.setItem(logsKey, JSON.stringify(logs));
    saveToFirestore(logsKey, logs);

    if (db) {
        try {
            db.collection('activity_logs').doc(newLog.id).set(newLog, { merge: true })
              .catch(err => console.error('Firestore log error:', err));
        } catch(e) {}
    }
}

// Render Activity Logs Table in Admin Page
function renderActivityLogsTable() {
    const tbody = document.getElementById('activityLogsTbody');
    const kpiLogsCount = document.getElementById('kpiTotalLogsCount');
    if (!tbody) return;

    const logsKey = getWorkspaceKey('activity_logs');
    let logs = [];
    try {
        logs = JSON.parse(localStorage.getItem(logsKey) || '[]');
    } catch(e) { logs = []; }

    if (kpiLogsCount) kpiLogsCount.textContent = logs.length;

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">لا توجد سجلات نشاطات مسجلة حالياً.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = logs.slice(0, 50).map(log => `
        <tr style="border-bottom: 1px solid var(--border-glass);">
            <td style="padding: 12px 16px; font-size: 0.8rem; font-family: monospace; color: var(--text-muted);">${log.date || ''}</td>
            <td style="padding: 12px 16px; font-weight: 700; color: var(--color-primary);">${escapeHtml(log.username)} (${log.role || 'user'})</td>
            <td style="padding: 12px 16px; font-size: 0.85rem;">${escapeHtml(log.action)}</td>
            <td style="padding: 12px 16px; font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(log.details || '-')}</td>
            <td style="padding: 12px 16px; font-size: 0.8rem;">${log.device || ''}</td>
            <td style="padding: 12px 16px; text-align: center;"><span style="color: #34d399; font-weight: 700; font-size: 0.75rem; background: rgba(52, 211, 153, 0.1); padding: 2px 8px; border-radius: 6px;">✓ ناجحة</span></td>
        </tr>
    `).join('');
}

// -------------------------------------------------------------
// INVOICE & QR CODE & THERMAL PRINT HANDLERS
// -------------------------------------------------------------
document.addEventListener('click', (e) => {
    const invBtn = e.target.closest('.btn-open-invoice');
    if (invBtn) {
        const phone = invBtn.getAttribute('data-phone') || 'بدون رقم';
        const clientName = invBtn.getAttribute('data-client-name') || getCustomerName(phone) || 'عميل محترم';
        const pkgGigas = invBtn.getAttribute('data-package') || '30';
        const totalPrice = parseInt(invBtn.getAttribute('data-total-price') || '0', 10);
        const paidAmount = parseInt(invBtn.getAttribute('data-paid-amount') || '0', 10);
        const remaining = Math.max(0, totalPrice - paidAmount);

        const modal = document.getElementById('invoiceModal');
        if (modal) {
            document.getElementById('invClientName').textContent = clientName;
            document.getElementById('invClientPhone').textContent = phone;
            document.getElementById('invPackageGigas').textContent = `${pkgGigas} GB`;
            document.getElementById('invTotalPrice').textContent = `${totalPrice.toLocaleString()} EGP`;
            document.getElementById('invPaidAmount').textContent = `${paidAmount.toLocaleString()} EGP`;
            document.getElementById('invRemainingAmount').textContent = `${remaining.toLocaleString()} EGP`;
            document.getElementById('invDate').textContent = new Date().toLocaleDateString('ar-EG');

            // Generate QR Code
            const qrCanvas = document.getElementById('qrcodeCanvas');
            if (qrCanvas) {
                qrCanvas.innerHTML = '';
                const qrText = `SmartNet Invoice: ${clientName} | Phone: ${phone} | Pkg: ${pkgGigas}GB | Total: ${totalPrice}EGP | Paid: ${paidAmount}EGP | Rem: ${remaining}EGP`;
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrCanvas, {
                        text: qrText,
                        width: 110,
                        height: 110,
                        colorDark: "#1e1b4b",
                        colorLight: "#ffffff"
                    });
                }
            }

            modal.style.display = 'flex';
            logActivity('عرض فاتورة', `عرض فاتورة للعميل ${clientName} (${phone})`);
        }
    }

    if (e.target && (e.target.id === 'btnCloseInvoiceModal' || e.target.id === 'btnCloseInvoiceModal2')) {
        const modal = document.getElementById('invoiceModal');
        if (modal) modal.style.display = 'none';
    }

    if (e.target && e.target.id === 'btnPrintInvoice') {
        window.print();
        logActivity('طباعة فاتورة حرارية', 'تم تشغيل أمر طباعة الفاتورة');
    }
});

// -------------------------------------------------------------
// ONE-CLICK AUTO-RENEWAL HANDLER
// -------------------------------------------------------------
document.addEventListener('click', (e) => {
    const renewBtn = e.target.closest('.btn-renew-customer');
    if (renewBtn) {
        const id = renewBtn.getAttribute('data-id');
        const phone = renewBtn.getAttribute('data-phone');
        const clientName = renewBtn.getAttribute('data-client-name') || getCustomerName(phone) || phone;

        if (confirm(`هل أنت تأكد من تجديد اشتراك العميل (${clientName}) لشهر جديد وتصفير المدفوعات للبدء مجدداً؟`)) {
            const records = getPaymentsRecords();
            if (records[id]) {
                records[id].paid_amount = 0;
                records[id].remaining_amount = records[id].total_price;
                records[id].status = 'unpaid';
                records[id].updated_at = new Date().toISOString();
                if (phone && records[phone]) {
                    records[phone] = { ...records[id] };
                }
                savePaymentsRecords(records);
            }

            logActivity('تجديد اشتراك تلقائي', `تجديد اشتراك العميل ${clientName} (${phone}) لشهر جديد`);
            alert(`⚡ تم تجديد اشتراك العميل (${clientName}) بنجاح لشهر جديد!`);
            renderPaymentsPage();
        }
    }
});

// -------------------------------------------------------------
// BULK WHATSAPP DISPATCHER MODAL HANDLERS
// -------------------------------------------------------------
document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'btnOpenBulkWhatsappModal' || e.target.closest('#btnOpenBulkWhatsappModal'))) {
        const modal = document.getElementById('bulkWhatsappModal');
        const container = document.getElementById('bulkWhatsappContainer');
        if (!modal || !container) return;

        const allItems = getAllPaymentItems();
        const unpaidItems = allItems.filter(i => i.remaining_amount > 0 && i.phone && i.phone !== 'بدون رقم');

        if (unpaidItems.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">✅ جميع العملاء مسددون بالكامل! لا توجد مستحقات معلقة حالياً.</div>`;
        } else {
            container.innerHTML = unpaidItems.map(item => {
                const url = buildWhatsAppReminderUrl(item.phone, item.client_name, `${item.package_gigas} GB`, item.total_price, item.paid_amount, item.remaining_amount);
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-glass);">
                        <div>
                            <strong style="font-size: 0.95rem; color: var(--text-main); font-family: monospace;">${item.phone}</strong>
                            <span style="font-size: 0.8rem; color: #a78bfa; display: block;">${escapeHtml(item.client_name || 'عميل')} - متبقي: ${item.remaining_amount.toLocaleString()} EGP</span>
                        </div>
                        <a href="${url}" target="_blank" class="btn btn-primary btn-sm" style="background: #25D366; color: white; border: none; font-weight: 700; text-decoration: none; padding: 8px 16px; border-radius: 8px;">
                            💬 إرسال تذكير
                        </a>
                    </div>
                `;
            }).join('');
        }

        modal.style.display = 'flex';
        logActivity('فتح مركز التذكير الجماعي', `استعراض ${unpaidItems.length} عميل متبقي عليهم مستحقات`);
    }

    if (e.target && e.target.id === 'btnCloseBulkWhatsappModal') {
        const modal = document.getElementById('bulkWhatsappModal');
        if (modal) modal.style.display = 'none';
    }
});

// -------------------------------------------------------------
// PWA SERVICE WORKER AUTO-REGISTRATION
// -------------------------------------------------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.warn('Service Worker registration notice:', err));
    });
}

// Auto-initialize page components on page load
function initActivePage() {
    if (document.getElementById('kpiTotalLines') || document.getElementById('dashboardLinesGrid') || document.getElementById('overallPercentage')) {
        renderDashboard();
    }
    if (document.getElementById('linesTableBody') || document.getElementById('formPanel')) {
        renderLinesDirectory();
    }
    if (typeof renderChatPage === 'function' && (document.getElementById('floatingChatWidget') || document.getElementById('floatingChatFab') || document.getElementById('navChat') || document.getElementById('chatForm'))) {
        renderChatPage();
    }
    if (typeof renderPaymentsPage === 'function' && document.getElementById('paymentsTbody')) {
        renderPaymentsPage();
    }
    if (typeof renderAdminPage === 'function' && (document.getElementById('usersDirectoryTbody') || document.getElementById('activityLogsTbody') || document.getElementById('adminAccessDeniedContainer'))) {
        renderAdminPage();
        renderActivityLogsTable();
    }
    if (typeof renderBillsPage === 'function' && (document.getElementById('standaloneLinesBillsContainer') || document.getElementById('inputOutsideExpensesPage'))) {
        renderBillsPage();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initActivePage);
} else {
    initActivePage();
}


