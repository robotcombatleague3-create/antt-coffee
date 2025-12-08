// Biến lưu voucher từ API
let apiVouchers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadApiVouchers();
    renderCart();
    loadSavedVouchersToSelect(); // Gọi hàm load dropdown
});

async function loadApiVouchers() {
    try {
        const res = await fetch('http://localhost:3000/api/vouchers');
        const data = await res.json();
        if (data.success) apiVouchers = data.data;
    } catch (err) { console.error("Lỗi API Voucher"); }
}

// --- LOGIC LOAD DROPDOWN ---
function loadSavedVouchersToSelect() {
    // Lấy từ localStorage
    const myVouchers = JSON.parse(localStorage.getItem('myVouchers')) || [];
    const selectEl = document.getElementById('savedVouchersSelect');
    
    console.log("Mã đã lưu trong kho:", myVouchers); // Kiểm tra xem có mã nào không

    if (!selectEl) return;

    // Reset option cũ trừ option đầu tiên
    selectEl.innerHTML = '<option value="">-- Kho Voucher của bạn --</option>';

    if (myVouchers.length === 0) {
        const opt = document.createElement('option');
        opt.text = "(Trống)";
        opt.disabled = true;
        selectEl.add(opt);
    } else {
        myVouchers.forEach(code => {
            const opt = document.createElement('option');
            opt.value = code;
            opt.text = code;
            selectEl.add(opt);
        });
    }

    // Sự kiện khi chọn dropdown
    selectEl.onchange = function() {
        if (this.value) {
            document.getElementById('voucherInput').value = this.value;
            // Gọi hàm apply (Global)
            window.applyVoucher();
        }
    };
}

// --- CART RENDERING ---
function getCart() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return [];
    const cartData = JSON.parse(localStorage.getItem('carts')) || {};
    return cartData[currentUser.username] || [];
}

function saveCart(cartItems) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const cartData = JSON.parse(localStorage.getItem('carts')) || {};
    cartData[currentUser.username] = cartItems;
    localStorage.setItem('carts', JSON.stringify(cartData));
    
    // Update badge
    const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cartCount');
    if(countEl) countEl.textContent = totalQty;
}

function renderCart() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const cartData = JSON.parse(localStorage.getItem('carts')) || {};
    const userCart = cartData[currentUser.username] || [];
    const tbody = document.getElementById('cartItems');
    let total = 0;

    tbody.innerHTML = '';
    if(userCart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-white">Giỏ hàng trống</td></tr>';
    } else {
        userCart.forEach((item, index) => {
            let imgUrl = item.image || 'images/menu-1.jpg';
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            tbody.innerHTML += `
            <tr class="text-center">
                <td class="product-remove"><a href="#" class="btn-remove" onclick="window.removeItem(${index}); return false;"><span class="icon-close"></span></a></td>
                <td class="image-prod"><div class="img" style="background-image:url(${imgUrl});"></div></td>
                <td class="product-name"><h3>${item.name}</h3></td>
                <td class="price">${item.price.toLocaleString('vi-VN')} đ</td>
                <td class="quantity">
                    <input type="number" class="form-control text-center mx-auto" style="width:60px; color:white;" value="${item.quantity}" min="1" onchange="window.updateQuantity(${index}, this.value)">
                </td>
                <td class="total">${itemTotal.toLocaleString('vi-VN')} đ</td>
            </tr>`;
        });
    }
    
    document.getElementById('cartTotal').innerText = total.toLocaleString('vi-VN') + ' đ';
    document.getElementById('cartTotal').dataset.value = total;
    document.getElementById('finalTotal').innerText = total.toLocaleString('vi-VN') + ' đ';
    
    // Tính lại voucher nếu đang có mã nhập sẵn
    window.applyVoucher(false);
}

// --- VOUCHER LOGIC ---
window.applyVoucher = function(showAlert = true) {
    const codeInput = document.getElementById('voucherInput');
    const msgEl = document.getElementById('voucherMessage');
    const subtotal = parseInt(document.getElementById('cartTotal').dataset.value || 0);
    const code = codeInput.value.trim().toUpperCase();

    // Reset message
    if(msgEl) { msgEl.innerText = ''; msgEl.className = ''; }

    function updateView(disc) {
        const final = subtotal - disc;
        document.getElementById('discountAmount').innerText = '- ' + disc.toLocaleString('vi-VN') + ' đ';
        document.getElementById('finalTotal').innerText = final.toLocaleString('vi-VN') + ' đ';
    }

    if (subtotal === 0 || !code) {
        updateView(0);
        return;
    }

    // Tìm voucher
    const voucher = apiVouchers.find(v => v.Voucher_code === code);
    
    if (!voucher) {
        if(showAlert && msgEl) { msgEl.innerText = "Mã không hợp lệ"; msgEl.className = "text-danger"; }
        updateView(0);
        return;
    }

    // Check điều kiện
    if (subtotal < voucher.Min_order_val) {
        if(showAlert && msgEl) { msgEl.innerText = `Cần đơn tối thiểu ${parseInt(voucher.Min_order_val).toLocaleString()}đ`; msgEl.className = "text-danger"; }
        updateView(0);
        return;
    }

    // Tính toán
    let discount = 0;
    let isPercent = (voucher.Value <= 100); 
    if(voucher.Description && voucher.Description.includes('percent')) isPercent = true;

    if (isPercent) discount = subtotal * (voucher.Value / 100);
    else discount = voucher.Value;

    if (discount > subtotal) discount = subtotal;

    if(showAlert && msgEl) { msgEl.innerText = `Áp dụng: ${voucher.Voucher_name}`; msgEl.className = "text-success"; }
    
    updateView(discount);
};
function updateTotals(subtotal, discount) {
    const finalTotal = subtotal - discount;
    document.getElementById('cartTotal').textContent = subtotal.toLocaleString('vi-VN') + ' đ';
    document.getElementById('discountAmount').textContent = '- ' + discount.toLocaleString('vi-VN') + ' đ';
    document.getElementById('finalTotal').textContent = finalTotal.toLocaleString('vi-VN') + ' đ';
    
    // Nếu không giảm giá thì xóa session voucher
    if(discount === 0) localStorage.removeItem('currentAppliedVoucher');
}

// --- GLOBAL ACTIONS ---
window.removeItem = function(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

window.updateQuantity = function(index, newQty) {
    const cart = getCart();
    let qty = parseInt(newQty);
    if(qty < 1) qty = 1;
    cart[index].quantity = qty;
    saveCart(cart);
    renderCart();
}

window.addToCart = function(id, name, price, img) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert("Vui lòng đăng nhập để mua hàng!");
        window.location.href = 'login.html';
        return;
    }
    const cartData = JSON.parse(localStorage.getItem('carts')) || {};
    const userCart = cartData[currentUser.username] || [];
    
    // Tìm sản phẩm dựa trên ID thay vì Name (chính xác hơn)
    const existingItem = userCart.find(i => i.id === id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        // LƯU QUAN TRỌNG: id
        userCart.push({ id: id, name: name, price: price, quantity: 1, image: img });
    }
    
    cartData[currentUser.username] = userCart;
    localStorage.setItem('carts', JSON.stringify(cartData));
    
    const total = userCart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cartCount');
    if(countEl) countEl.textContent = total;
    alert("Đã thêm " + name + " vào giỏ!");
}

// --- XỬ LÝ CHECKOUT ---
async function processCheckout() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert("Vui lòng đăng nhập để thanh toán!");
        window.location.href = 'login.html';
        return;
    }

    const cart = getCart(); // Hàm getCart đã có ở trên
    if (cart.length === 0) {
        alert("Giỏ hàng đang trống!");
        return;
    }

    // Lấy thông tin tính toán
    const subtotal = parseInt(document.getElementById('cartTotal').dataset.value || 0);
    // Lấy voucher từ localStorage (đã lưu ở bước applyVoucher)
    const appliedVoucher = JSON.parse(localStorage.getItem('currentAppliedVoucher'));
    
    const discount = appliedVoucher ? appliedVoucher.discount : 0;
    const voucherCode = appliedVoucher ? appliedVoucher.code : null;
    const total = subtotal - discount;

    // Chuẩn bị dữ liệu gửi lên Server
    // Mapping lại item để khớp với backend (item.name -> lấy ID từ đâu? 
    // Lưu ý: Trong cart hiện tại bạn chỉ lưu name, price. 
    // Tốt nhất lúc addToCart bạn nên lưu cả id món ăn.
    // Giả sử item trong cart có thuộc tính .id (bạn cần check lại lúc addToCart)
    
    // SỬA LẠI API Load Menu một chút để khi addToCart lưu cả ID
    // Tạm thời gửi name lên, nhưng đúng chuẩn DB cần ID.
    // Giả định cart item đã có id.
    
    const orderData = {
        userId: currentUser.Acc_id || currentUser.id, // ID user trong DB
        items: cart, // Gửi cả mảng cart lên
        subtotal: subtotal,
        discount: discount,
        total: total,
        voucherCode: voucherCode
    };

    try {
        const res = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await res.json();

        if (result.success) {
            // 1. Xóa giỏ hàng
            localStorage.removeItem(`cart_${currentUser.username}`); // Hoặc key carts tương ứng
            const carts = JSON.parse(localStorage.getItem('carts')) || {};
            carts[currentUser.username] = [];
            localStorage.setItem('carts', JSON.stringify(carts));

            // 2. Xóa voucher đang áp
            localStorage.removeItem('currentAppliedVoucher');

            // 3. Chuyển hướng trang thành công
            window.location.href = 'checkout.html';
        } else {
            alert("Lỗi đặt hàng: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("Không thể kết nối đến server.");
    }
}