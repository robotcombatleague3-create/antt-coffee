// Cấu hình URL Backend
const API_URL = 'http://localhost:3000/api';

// --- 1. BẢO VỆ TRANG ADMIN ---
function guardAdmin() {
    const u = JSON.parse(localStorage.getItem('currentUser'));
    // Tạm thời check role đơn giản ở frontend
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
                // Xử lý đường dẫn ảnh
                let imgDisplay = p.image;
                if(p.image && p.image.startsWith('/')) imgDisplay = 'http://localhost:3000' + p.image;
                
                return `
                <tr>
                    <td>${p.id}</td>
                    <td><img src="${imgDisplay}" style="width:50px;height:50px;object-fit:cover;border-radius:4px"></td>
                    <td>${p.name}</td>
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

// Điền thông tin vào form khi bấm Sửa
window.fillP = function(p) {
    const f = document.getElementById('prodForm');
    f.pid.value = p.id;
    f.name.value = p.name;
    f.price.value = parseFloat(p.price); // Chuyển string "25000.00" thành số
    // THÊM DÒNG NÀY: Lưu đường dẫn ảnh cũ vào input ẩn
    if(f.currentImage) f.currentImage.value = p.image || '';

    // Hiển thị tên ảnh để người dùng biết
    const imgName = p.image ? p.image.split('/').pop() : 'Chọn ảnh...';
    $('.custom-file-label').html(imgName);
    // Note: Input file không thể gán value bằng JS vì bảo mật, chỉ hiển thị tên ảnh cũ
    $('.custom-file-label').html(p.image || 'Chọn ảnh mới...');
}

// Lưu sản phẩm (Dùng FormData để upload ảnh)
function saveProduct(e) {
    e.preventDefault();
    const form = document.getElementById('prodForm');
    const formData = new FormData(form);

    // Mặc định cate_id = 1 nếu không chọn (DB bắt buộc)
    // Trong thực tế bạn nên thêm select box category vào form admin
    formData.append('cate_id', 1);
    
    // Nếu có ID -> Update, không có -> Create
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
            } else {
                alert('Lỗi: ' + res.message);
            }
        },
        error: function(err) {
            alert('Lỗi kết nối server!');
            console.error(err);
        }
    });
}

// --- 3. QUẢN LÝ VOUCHER ---
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
            if (res.success) {
                alert('Tạo voucher thành công!');
                f.reset();
                renderAdminVouchers();
            } else {
                alert(res.message);
            }
        },
        error: function(xhr) {
            alert('Lỗi: ' + (xhr.responseJSON ? xhr.responseJSON.message : 'Server Error'));
        }
    });
}

// --- 4. QUẢN LÝ ĐƠN HÀNG ---
function renderAdminOrders() {
    $.get(`${API_URL}/orders`, function(res) {
        if (res.success) {
            document.getElementById('adminOrderBody').innerHTML = res.data.map(o => `
                <tr>
                    <td>#${o.Order_id}</td>
                    <td>${o.F_name || 'Khách'} ${o.L_name || 'Lẻ'}</td>
                    <td>${parseFloat(o.Total_amount).toLocaleString()} đ</td>
                    <td>${new Date(o.Order_date).toLocaleDateString('vi-VN')}</td>
                    <td><span class="badge badge-${getStatusBadge(o.Status)}">${o.Status}</span></td>
                    <td>
                        <select class="form-control form-control-sm" onchange="updateStatus(${o.Order_id}, this.value)">
                            <option value="Pending" ${o.Status==='Pending'?'selected':''}>Chờ xử lý</option>
                            <option value="Processing" ${o.Status==='Processing'?'selected':''}>Đang làm</option>
                            <option value="Completed" ${o.Status==='Completed'?'selected':''}>Hoàn thành</option>
                            <option value="Cancelled" ${o.Status==='Cancelled'?'selected':''}>Hủy</option>
                        </select>
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
    return 'warning';
}

window.updateStatus = function(id, status) {
    $.ajax({
        url: `${API_URL}/orders/${id}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ status: status }),
        success: function() { renderAdminOrders(); },
        error: function() { alert('Không thể cập nhật đơn hàng'); }
    });
}

// --- Kich hoat ---
document.addEventListener('DOMContentLoaded', () => {
    guardAdmin();
    
    // Gắn sự kiện submit form
    $('#prodForm').on('submit', saveProduct);
    $('#voucherForm').on('submit', createVoucher);

    // Load dữ liệu
    renderAdminMenu();
    renderAdminOrders();
    renderAdminVouchers();
});