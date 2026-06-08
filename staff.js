var currentStaffUser = null;
var staffOrders = [];
var staffOrdersUnsubscribe = null;
var hasRenderedStaffOrders = false;

var STAFF_ROLE_LABELS = {
    worker: 'عامل تغليف',
    driver: 'سائق توصيل'
};

var STAFF_STATUS_LABELS = {
    new: 'جديد',
    packaging: 'قيد التغليف',
    ready: 'جاهز للتوصيل',
    delivering: 'قيد التوصيل',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    processing: 'قيد المعالجة'
};

document.addEventListener('DOMContentLoaded', function () {
    restoreStaffSession();
});

function restoreStaffSession() {
    try {
        var saved = sessionStorage.getItem('sardchocolate_staff');
        if (!saved) return;
        currentStaffUser = JSON.parse(saved);
        if (!currentStaffUser || !currentStaffUser.username) {
            currentStaffUser = null;
            sessionStorage.removeItem('sardchocolate_staff');
            return;
        }
        showStaffPanel();
        initializeStaffPortal();
    } catch (error) {
        console.error(error);
        sessionStorage.removeItem('sardchocolate_staff');
    }
}

function setStaffLoading(loading) {
    var loader = document.getElementById('staffLoading');
    if (loader) loader.style.display = loading ? 'block' : 'none';
}

var _staffStatusTimer = null;
function setStaffStatus(message, type) {
    var status = document.getElementById('staffStatus');
    if (!status) return;
    if (_staffStatusTimer) clearTimeout(_staffStatusTimer);
    status.classList.remove('hidden');
    status.textContent = message;
    status.className = 'admin-status' + (type ? ' ' + type : '');
    if (type === 'success') {
        _staffStatusTimer = setTimeout(function () {
            status.style.opacity = '0';
            setTimeout(function () {
                status.textContent = '';
                status.className = 'admin-status hidden';
                status.style.opacity = '';
            }, 500);
        }, 3500);
    }
}

function showStaffPanel() {
    document.getElementById('staffLoginScreen').style.display = 'none';
    document.getElementById('staffPanel').style.display = 'block';
}

function showLoginScreen() {
    document.getElementById('staffLoginScreen').style.display = 'flex';
    document.getElementById('staffPanel').style.display = 'none';
}

function handleStaffLogin(event) {
    event.preventDefault();
    var username = document.getElementById('staffLoginUser').value.trim();
    var password = document.getElementById('staffLoginPass').value.trim();
    var errorEl = document.getElementById('staffLoginError');
    errorEl.textContent = '';

    if (!username || !password) {
        errorEl.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور.';
        return;
    }

    setStaffLoading(true);
    firebase.database().ref('users/staff').once('value').then(function (snapshot) {
        var entries = snapshot.val() || {};
        var match = null;

        Object.keys(entries).some(function (id) {
            var account = entries[id] || {};
            if (account.username === username && account.password === password) {
                match = {
                    id: id,
                    username: String(account.username || ''),
                    role: account.role === 'driver' ? 'driver' : 'worker',
                    name: String(account.name || account.username || '')
                };
                return true;
            }
            return false;
        });

        if (!match) {
            errorEl.textContent = 'بيانات الدخول غير صحيحة.';
            setStaffLoading(false);
            return;
        }

        currentStaffUser = match;
        sessionStorage.setItem('sardchocolate_staff', JSON.stringify(match));
        showStaffPanel();
        initializeStaffPortal();
    }).catch(function (error) {
        console.error(error);
        errorEl.textContent = 'تعذر الاتصال بفايربيس حالياً.';
        setStaffLoading(false);
    });
}

function logoutStaff() {
    sessionStorage.removeItem('sardchocolate_staff');
    currentStaffUser = null;
    staffOrders = [];
    hasRenderedStaffOrders = false;
    if (typeof staffOrdersUnsubscribe === 'function') {
        staffOrdersUnsubscribe();
        staffOrdersUnsubscribe = null;
    }
    showLoginScreen();
    location.reload();
}

function initializeStaffPortal() {
    if (!currentStaffUser) return;
    hasRenderedStaffOrders = false;
    setStaffLoading(true);
    updateStaffHeader();
    subscribeToStaffOrders();
}

function updateStaffHeader() {
    var roleLabel = STAFF_ROLE_LABELS[currentStaffUser.role] || currentStaffUser.role;
    document.getElementById('staffWelcomeName').textContent = 'أهلاً ' + (currentStaffUser.name || currentStaffUser.username);
    document.getElementById('staffWelcomeRole').textContent = currentStaffUser.role === 'worker'
        ? 'تابع طلبات التغليف الجديدة وأنهِ تجهيز طلباتك.'
        : 'تابع الطلبات الجاهزة للتوصيل وأنهِ عمليات التسليم الخاصة بك.';

    var badge = document.getElementById('staffRoleBadge');
    badge.textContent = roleLabel;
    badge.className = 'role-badge ' + currentStaffUser.role;

    document.getElementById('staffAvailableTitle').textContent = currentStaffUser.role === 'worker' ? 'طلبات جديدة للتغليف' : 'طلبات جاهزة للتوصيل';
    document.getElementById('staffAssignedTitle').textContent = currentStaffUser.role === 'worker' ? 'طلباتي قيد التغليف' : 'طلباتي قيد التوصيل';
}

function subscribeToStaffOrders() {
    if (typeof staffOrdersUnsubscribe === 'function') {
        staffOrdersUnsubscribe();
        staffOrdersUnsubscribe = null;
    }

    staffOrdersUnsubscribe = db.collection('orders').orderBy('date', 'desc').onSnapshot(function (snapshot) {
        staffOrders = snapshot.docs.map(function (docSnap) {
            var data = docSnap.data() || {};
            data._docId = docSnap.id;
            return data;
        }).sort(function (a, b) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        renderStaffDashboard();
        setStaffLoading(false);
        if (!hasRenderedStaffOrders) {
            hasRenderedStaffOrders = true;
            setStaffStatus('تم تحميل الطلبات بنجاح.', 'success');
        }
    }, function (error) {
        console.error(error);
        setStaffLoading(false);
        setStaffStatus('تعذر تحميل الطلبات.', 'error');
    });
}

function renderStaffDashboard() {
    if (!currentStaffUser) return;
    var availableOrders = getAvailableOrders();
    var assignedOrders = getAssignedOrders();
    var completedByUser = staffOrders.filter(function (order) {
        if (currentStaffUser.role === 'worker') {
            return order.packagingWorker === currentStaffUser.username && getEffectiveStaffStatus(order) === 'ready';
        }
        return order.deliveryDriver === currentStaffUser.username && getEffectiveStaffStatus(order) === 'completed';
    });

    document.getElementById('staffAvailableCount').textContent = availableOrders.length;
    document.getElementById('staffAssignedCount').textContent = assignedOrders.length;
    document.getElementById('staffStats').innerHTML = [
        renderStatCard('المتاحة الآن', availableOrders.length),
        renderStatCard('قيد التنفيذ', assignedOrders.length),
        renderStatCard(currentStaffUser.role === 'worker' ? 'مجهزة بواسطتك' : 'تم تسليمها بواسطتك', completedByUser.length)
    ].join('');

    document.getElementById('staffAvailableOrders').innerHTML = renderOrdersCards(availableOrders, 'available');
    document.getElementById('staffAssignedOrders').innerHTML = renderOrdersCards(assignedOrders, 'assigned');
}

function renderStatCard(title, value) {
    return '<div class="staff-stat-card"><span>' + escapeHtml(title) + '</span><strong>' + value + '</strong></div>';
}

function getEffectiveStaffStatus(order) {
    var status = order && order.status;
    return status === 'processing' ? 'packaging' : (status || 'new');
}

function getAvailableOrders() {
    if (currentStaffUser.role === 'worker') {
        return staffOrders.filter(function (order) { return getEffectiveStaffStatus(order) === 'new'; });
    }
    return staffOrders.filter(function (order) { return getEffectiveStaffStatus(order) === 'ready'; });
}

function getAssignedOrders() {
    if (currentStaffUser.role === 'worker') {
        return staffOrders.filter(function (order) {
            return getEffectiveStaffStatus(order) === 'packaging' && order.packagingWorker === currentStaffUser.username;
        });
    }
    return staffOrders.filter(function (order) {
        return getEffectiveStaffStatus(order) === 'delivering' && order.deliveryDriver === currentStaffUser.username;
    });
}

function renderOrdersCards(list, bucket) {
    if (!list.length) {
        return '<div class="staff-empty">لا توجد طلبات في هذا القسم حالياً.</div>';
    }
    return list.map(function (order) {
        return currentStaffUser.role === 'worker'
            ? renderWorkerOrderCard(order, bucket)
            : renderDriverOrderCard(order, bucket);
    }).join('');
}

function renderWorkerOrderCard(order, bucket) {
    var actionButton = bucket === 'available'
        ? '<button class="staff-action-btn primary" onclick="staffUpdateOrder(\'' + getOrderId(order) + '\', \'startPackaging\')">بدء التغليف</button>'
        : '<button class="staff-action-btn primary" onclick="staffUpdateOrder(\'' + getOrderId(order) + '\', \'markReady\')">جاهز للتوصيل</button>';

    return '<article class="staff-order-card">' +
        renderOrderTop(order) +
        '<div class="staff-order-grid">' +
            '<div class="staff-order-box"><strong>تفاصيل الطلب</strong><p>العميل: ' + escapeHtml(order.customerName || '-') + '</p><p>طريقة الاستلام: ' + escapeHtml(getDeliveryTypeLabel(order)) + '</p><p>عدد القطع: ' + getItemsCount(order) + '</p></div>' +
            '<div class="staff-order-box"><strong>المنتجات</strong>' + renderItemsList(order.items || []) + '</div>' +
        '</div>' +
        '<div class="staff-inline-meta">' +
            '<span class="staff-inline-chip">الحالة: ' + escapeHtml(STAFF_STATUS_LABELS[getEffectiveStaffStatus(order)] || getEffectiveStaffStatus(order) || '-') + '</span>' +
            (order.delivery === 'pickup' ? '<span class="staff-inline-chip">استلام من المصنع</span>' : '<span class="staff-inline-chip">' + escapeHtml(DELIVERY_REGION_LABEL(order.region)) + '</span>') +
        '</div>' +
        '<div class="staff-order-actions">' + actionButton + '</div>' +
    '</article>';
}

function renderDriverOrderCard(order, bucket) {
    var actionButton = bucket === 'available'
        ? '<button class="staff-action-btn primary" onclick="staffUpdateOrder(\'' + getOrderId(order) + '\', \'startDelivery\')">استلام للتوصيل</button>'
        : '<button class="staff-action-btn primary" onclick="staffUpdateOrder(\'' + getOrderId(order) + '\', \'completeDelivery\')">تم التوصيل</button>';

    return '<article class="staff-order-card">' +
        renderOrderTop(order) +
        '<div class="staff-order-grid">' +
            '<div class="staff-order-box"><strong>بيانات العميل</strong><p>الاسم: ' + escapeHtml(order.customerName || '-') + '</p><p>الهاتف: ' + escapeHtml(order.customerPhone || '-') + '</p><p>العنوان: ' + escapeHtml(order.address || order.customerLocation || '-') + '</p></div>' +
            '<div class="staff-order-box"><strong>تفاصيل التوصيل</strong><p>المنطقة: ' + escapeHtml(DELIVERY_REGION_LABEL(order.region)) + '</p><p>نوع التوصيل: ' + escapeHtml(getDeliveryTypeLabel(order)) + '</p><p>الإجمالي: ' + formatCurrency(order.total || 0) + '</p></div>' +
        '</div>' +
        '<div class="staff-order-box"><strong>المنتجات</strong>' + renderItemsList(order.items || []) + '</div>' +
        '<div class="staff-order-actions">' + actionButton + '</div>' +
    '</article>';
}

function renderOrderTop(order) {
    var status = getEffectiveStaffStatus(order);
    return '<div class="staff-order-top">' +
        '<div><div class="staff-order-title">طلب ' + escapeHtml(getOrderId(order)) + '</div><div class="staff-order-subtitle">' + escapeHtml(formatDateTime(order.date)) + '</div></div>' +
        '<span class="status-tag ' + escapeHtml(status) + '">' + escapeHtml(STAFF_STATUS_LABELS[status] || status || '-') + '</span>' +
    '</div>';
}

function renderItemsList(items) {
    if (!items.length) {
        return '<p>لا توجد عناصر.</p>';
    }
    return '<ul>' + items.map(function (item) {
        if (item.type === 'custom_package') {
            return '<li>' + escapeHtml(getCustomPackageTitle(item)) + ' • الكمية ' + (parseInt(item.qty, 10) || 1) + '</li>';
        }
        return '<li>' + escapeHtml(item.name || 'منتج') + ' • ' + (parseInt(item.qty, 10) || 0) + ' × ' + escapeHtml(item.sizeLabel || '-') + '</li>';
    }).join('') + '</ul>';
}

function getItemsCount(order) {
    return (order.items || []).reduce(function (sum, item) {
        return sum + (Number(item.qty) || 0);
    }, 0);
}

function getDeliveryTypeLabel(order) {
    return order.delivery === 'pickup' ? 'استلام ذاتي' : 'توصيل';
}

function getOrderId(order) {
    return String(order.id || order._docId || '');
}

function DELIVERY_REGION_LABEL(region) {
    return { pickup: 'استلام', westbank: 'الضفة', jerusalem: 'القدس', inside: 'الداخل' }[region] || '-';
}

function staffUpdateOrder(orderId, action) {
    if (!currentStaffUser) return;
    var order = staffOrders.find(function (entry) { return getOrderId(entry) === String(orderId); });
    if (!order) return;

    var effectiveStatus = getEffectiveStaffStatus(order);
    var payload = null;
    if (action === 'startPackaging' && effectiveStatus === 'new') {
        payload = {
            status: 'packaging',
            packagingWorker: currentStaffUser.username,
            packagingStartTime: Date.now()
        };
    } else if (action === 'markReady' && effectiveStatus === 'packaging' && order.packagingWorker === currentStaffUser.username) {
        payload = {
            status: 'ready',
            packagingEndTime: Date.now()
        };
    } else if (action === 'startDelivery' && effectiveStatus === 'ready') {
        payload = {
            status: 'delivering',
            deliveryDriver: currentStaffUser.username,
            deliveryStartTime: Date.now()
        };
    } else if (action === 'completeDelivery' && effectiveStatus === 'delivering' && order.deliveryDriver === currentStaffUser.username) {
        payload = {
            status: 'completed',
            deliveryEndTime: Date.now()
        };
    }

    if (!payload) {
        setStaffStatus('لا يمكن تنفيذ هذا الإجراء على الطلب حالياً.', 'warning');
        return;
    }

    setStaffLoading(true);
    db.collection('orders').doc(String(orderId)).update(payload).then(function () {
        setStaffLoading(false);
        setStaffStatus('تم تحديث الطلب بنجاح.', 'success');
    }).catch(function (error) {
        console.error(error);
        setStaffLoading(false);
        setStaffStatus('حدث خطأ أثناء تحديث الطلب.', 'error');
    });
}
