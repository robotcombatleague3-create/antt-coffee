$(document).ready(function() {
    // 1. Bảo vệ trang Admin
    guardAdmin();

    // 2. Load dữ liệu
    renderAdminMenu();
    renderAdminOrders();
    renderAdminVouchers();

    // 3. Sự kiện Menu (Upload ảnh)
    $('#prodForm').on('submit', saveProduct);

    // 4. Sự kiện Voucher
    $('#voucherForm').on('submit', createVoucher);
});

// Kiểm tra quyền
function guardAdmin(){
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if(!u || u.role !== 'admin'){ 
        alert('Truy cập bị từ chối'); 
        window.location.href='login.html'; 
    }
}

// --- QUẢN LÝ MENU (SẢN PHẨM) ---
function renderAdminMenu(){
    $.get('http://localhost:3000/api/menu', function(res) {
        if(res.success) {
            $('#adminMenuBody').html(res.data.map(p => {
                // Xử lý hiển thị ảnh
                let imgUrl = p.image || 'images/no-image.png';
                if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
                    imgUrl = '/images/' + imgUrl; // Fallback
                }
                // Nếu là đường dẫn tương đối từ server backend
                if (imgUrl.startsWith('/')) {
                    imgUrl = 'http://localhost:3000' + imgUrl;
                }

                return `
                <tr>
                    <td>${p.id}</td>
                    <td><img src="${imgUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:4px"></td>
                    <td>${p.name}</td>
                    <td>${parseFloat(p.price).toLocaleString()} đ</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick='fillP(${JSON.stringify(p)})'>Sửa</button>
                    </td>
                </tr>`;
            }).join(''));
        }
    });
}

// Điền form khi bấm Sửa
window.fillP = function(p) {
    const f = document.getElementById('prodForm');
    f.pid.value = p.id;
    f.name.value = p.name;
    f.price.value = p.price;
    f.currentImage.value = p.image || '';
    $('.custom-file-label').html(p.image ? 'Đã có ảnh (Chọn để thay đổi)' : 'Chọn ảnh...');
}

// Lưu sản phẩm (Dùng FormData để gửi file)
function saveProduct(e){
    e.preventDefault();
    const form = document.getElementById('prodForm');
    const formData = new FormData(form);

    // Mặc định cate_id = 1 nếu chưa có logic chọn category
    formData.append('cate_id', 1);
    // Nếu là update thì gửi id
    if(form.pid.value) formData.append('id', form.pid.value);

    $.ajax({
        url: 'http://localhost:3000/api/menu',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(res) {
            if(res.success) {
                alert(res.message);
                form.reset();
                form.pid.value = ''; // Xóa ID sau khi lưu xong
                $('.custom-file-label').html('Chọn ảnh...');
                renderAdminMenu();
            } else {
                alert(res.message);
            }
        },
        error: function(err) { console.error(err); alert('Lỗi kết nối'); }
    });
}

// --- QUẢN LÝ ĐƠN HÀNG ---
function renderAdminOrders(){
    $.get('http://localhost:3000/api/orders', function(res) {
        if(res.success) {
            $('#adminOrderBody').html(res.data.map(o => `
                <tr>
                    <td>#${o.Order_id}</td>
                    <td>${o.F_name} ${o.L_name}</td>
                    <td>${parseFloat(o.Total_amount).toLocaleString()} đ</td>
                    <td><span class="badge badge-${getBadge(o.Status)}">${o.Status}</span></td>
                    <td>
                        <select class="form-control form-control-sm" onchange="updateStatus(${o.Order_id}, this.value)">
                            <option value="Pending" ${o.Status==='Pending'?'selected':''}>Chờ xử lý</option>
                            <option value="Processing" ${o.Status==='Processing'?'selected':''}>Đang làm</option>
                            <option value="Completed" ${o.Status==='Completed'?'selected':''}>Hoàn thành</option>
                            <option value="Cancelled" ${o.Status==='Cancelled'?'selected':''}>Hủy</option>
                        </select>
                    </td>
                </tr>
            `).join(''));
        }
    });
}

function getBadge(status){
    if(status==='Completed') return 'success';
    if(status==='Cancelled') return 'danger';
    if(status==='Processing') return 'info';
    return 'warning';
}

window.updateStatus = function(id, status){
    if(!confirm('Cập nhật trạng thái đơn hàng #' + id + '?')) return;
    $.ajax({
        url: `http://localhost:3000/api/orders/${id}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ status: status }),
        success: function(res) {
            if(res.success) renderAdminOrders();
            else alert(res.message);
        }
    });
}

// --- QUẢN LÝ VOUCHER ---
function renderAdminVouchers(){
    $.get('http://localhost:3000/api/vouchers', function(res) {
        if(res.success) {
            $('#adminVoucherBody').html(res.data.map(v => `
                <tr>
                    <td><b class="text-warning">${v.Voucher_code}</b></td>
                    <td>${v.Description}</td>
                    <td>${parseFloat(v.Value).toLocaleString()}</td>
                    <td>${parseFloat(v.Min_order_val).toLocaleString()} đ</td>
                    <td>${new Date(v.Date_end) > new Date() ? '<span class="text-success">✔</span>' : '<span class="text-danger">Hết hạn</span>'}</td>
                </tr>
            `).join(''));
        }
    });
}

function createVoucher(e){
    e.preventDefault();
    const f = e.target;
    const data = {
        code: f.code.value.trim(),
        type: f.type.value,
        value: parseInt(f.value.value),
        min: parseInt(f.min.value)
    };

    if(!data.code || !data.value) return alert('Nhập thiếu thông tin');

    $.ajax({
        url: 'http://localhost:3000/api/vouchers',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(res) {
            if(res.success) {
                alert('Tạo thành công');
                f.reset();
                renderAdminVouchers();
            } else {
                alert(res.message);
            }
        },
        error: function(xhr) {
            const msg = xhr.responseJSON ? xhr.responseJSON.message : 'Lỗi server';
            alert(msg);
        }
    });
}