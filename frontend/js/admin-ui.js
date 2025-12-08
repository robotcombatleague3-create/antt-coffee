// Cấu hình URL Backend
const API_URL = 'http://localhost:3000/api';

// --- 1. BẢO VỆ TRANG ADMIN ---
function guardAdmin() {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u || u.role !== 'admin') {
        alert('Truy cập bị từ chối! Vui lòng đăng nhập quyền Admin.');
        window.location.href = 'login.html';
    }
}

// --- 2. QUẢN LÝ MENU (SẢN PHẨM) ---
function renderAdminMenu() {
    $.get(`${API_URL}/menu`, function(res) {
        if (res.success) {
            const tbody = document.getElementById('adminMenuBody');
            tbody.innerHTML = res.data.map(p => {
                let imgDisplay = p.image;
                if(p.image && p.image.startsWith('/')) imgDisplay = 'http://localhost:3000' + p.image;
                
                return `
                <tr>
                    <td>${p.id}</td>
                    <td><img src="${imgDisplay}" style="width:50px;height:50px;object-fit:cover;border-radius:4px"></td>
                    <td>
                        <strong>${p.name}</strong><br>
                        <small class="text-muted">${p.category || 'Chưa phân loại'}</small>
                    </td>
                    <td>${parseFloat(p.price).toLocaleString()} đ</td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick='fillP(${JSON.stringify(p)})'>Sửa</button>
                    </td>
                </tr>`;
            }).join('');
        }
    }).fail(err => console.error("Lỗi tải menu:", err));
}

window.fillP = function(p) {
    const f = document.getElementById('prodForm');
    f.pid.value = p.id;
    f.name.value = p.name;
    f.price.value = parseFloat(p.price);
    if(p.Cate_id) f.cate_id.value = p.Cate_id; 
    if(f.description) f.description.value = p.description || '';
    if(f.currentImage) f.currentImage.value = p.image || '';
    const imgName = p.image ? p.image.split('/').pop() : 'Chọn ảnh...';
    $('.custom-file-label').html(imgName);
}

function saveProduct(e) {
    e.preventDefault();
    const form = document.getElementById('prodForm');
    const formData = new FormData(form);
    if(form.pid.value) formData.append('id', form.pid.value);

    $.ajax({
        url: `${API_URL}/menu`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(res) {
            if (res.success) {
                alert('Lưu thành công!');
                form.reset();
                form.pid.value = ''; 
                $('.custom-file-label').html('Chọn ảnh...');
                renderAdminMenu();
            } else { alert('Lỗi: ' + res.message); }
        },
        error: function(err) { alert('Lỗi kết nối server!'); }
    });
}

// --- 3. QUẢN LÝ VOUCHER (Giữ nguyên) ---
function renderAdminVouchers() {
    $.get(`${API_URL}/vouchers`, function(res) {
        if (res.success) {
            document.getElementById('adminVoucherBody').innerHTML = res.data.map(v => `
                <tr>
                    <td><b class="text-warning">${v.Voucher_code}</b></td>
                    <td>${v.Description.includes('percent') ? '%' : 'VND'}</td>
                    <td>${parseInt(v.Value).toLocaleString()}</td>
                    <td>${parseInt(v.Min_order_val).toLocaleString()}</td>
                    <td>${new Date(v.Date_end) > new Date() ? '<span class="text-success">✔</span>' : '<span class="text-danger">Hết hạn</span>'}</td>
                </tr>
            `).join('');
        }
    });
}

function createVoucher(e) {
    e.preventDefault();
    const f = e.target;
    const data = {
        code: f.code.value.trim(),
        type: f.type.value,
        value: parseInt(f.value.value),
        min: parseInt(f.min.value)
    };
    if (!data.code || !data.value) return alert('Vui lòng nhập đủ Mã và Giá trị');

    $.ajax({
        url: `${API_URL}/vouchers`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(res) {
            if (res.success) { alert('Tạo voucher thành công!'); f.reset(); renderAdminVouchers(); }
            else { alert(res.message); }
        },
        error: function(xhr) { alert('Lỗi server'); }
    });
}

// --- 4. QUẢN LÝ ĐƠN HÀNG (SỬA PHẦN NÀY) ---
function renderAdminOrders() {
    $.get(`${API_URL}/orders`, function(res) {
        if (res.success) {
            document.getElementById('adminOrderBody').innerHTML = res.data.map(o => `
                <tr>
                    <td>#${o.Order_id}</td>
                    <td>
                        ${o.F_name || 'User'} ${o.L_name || ''}<br>
                        <small class="text-muted">${new Date(o.Order_date).toLocaleString('vi-VN')}</small>
                    </td>
                    <td>${parseFloat(o.Total_amount).toLocaleString()} đ</td>
                    <td><span class="badge badge-${getStatusBadge(o.Status)}">${o.Status}</span></td>
                    <td>
                        <div class="d-flex">
                            <select class="form-control form-control-sm mr-2" id="status-${o.Order_id}" style="width: 130px;">
                                <option value="CREATED" ${o.Status==='CREATED'?'selected':''}>Chờ xác nhận</option>
                                <option value="CONFIRMED" ${o.Status==='CONFIRMED'?'selected':''}>Đã xác nhận</option>
                                <option value="Processing" ${o.Status==='Processing'?'selected':''}>Đang làm</option>
                                <option value="Completed" ${o.Status==='Completed'?'selected':''}>Hoàn thành</option>
                                <option value="Cancelled" ${o.Status==='Cancelled'?'selected':''}>Hủy đơn</option>
                            </select>
                            <button class="btn btn-sm btn-primary" onclick="saveOrderStatus(${o.Order_id})">Lưu</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    });
}

function getStatusBadge(s) {
    if(s === 'Completed') return 'success';
    if(s === 'Cancelled') return 'secondary';
    if(s === 'Processing') return 'info';
    if(s === 'CONFIRMED') return 'primary';
    return 'warning'; // CREATED
}

// Hàm mới: Lưu trạng thái khi bấm nút
window.saveOrderStatus = function(id) {
    // Lấy giá trị từ dropdown tương ứng với ID đơn hàng
    const selectEl = document.getElementById(`status-${id}`);
    const newStatus = selectEl.value;

    if(!confirm(`Bạn muốn đổi trạng thái đơn #${id} sang "${newStatus}"?`)) return;

    $.ajax({
        url: `${API_URL}/orders/${id}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function(res) { 
            if(res.success) {
                alert("Cập nhật thành công!");
                renderAdminOrders(); // Load lại bảng
            } else {
                alert("Lỗi: " + res.message);
            }
        },
        error: function() { alert('Không thể kết nối Server'); }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    guardAdmin();
    $('#prodForm').on('submit', saveProduct);
    $('#voucherForm').on('submit', createVoucher);
    renderAdminMenu();
    renderAdminOrders();
    renderAdminVouchers();
});