function renderCart() {
  // Lấy và "làm sạch" giỏ: ép kiểu số, bỏ item lỗi
  const cart = (store.get('cart', []) || [])
    .map(it => ({
      name: String(it.name || '').trim(),
      price: Number(it.price || 0),
      qty: Math.max(1, parseInt(it.qty || 1, 10))
    }))
    .filter(it => it.name && Number.isFinite(it.price));

  const wrap = document.getElementById('cartItems');

  if (!cart.length) {
    wrap.innerHTML = '<p>Your cart is empty.</p>';
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '0.00';
    return;
  }

  // HTML danh sách món
  const rowsHtml = cart.map(it => `
    <div class="d-flex justify-content-between align-items-center border p-2 mb-2">
      <div><strong>${it.name}</strong></div>
      <div class="d-flex align-items-center">
        <input type="number" min="1" value="${it.qty}" style="width:80px"
               onchange="changeQty('${it.name.replace(/'/g, "\\'")}', this.value)">
        <button class="btn btn-sm btn-outline-danger ml-2"
                onclick="removeItem('${it.name.replace(/'/g, "\\'")}')">X</button>
      </div>
      <div>$${(it.price * it.qty).toFixed(2)}</div>
    </div>
  `).join('');

  // Lấy code đã lưu ở trang voucher (nếu có)
  let prefillCode = '';
  if (typeof VoucherEngine !== 'undefined' && VoucherEngine.readSelected) {
    prefillCode = VoucherEngine.readSelected() || '';
  }

  // Khối voucher + khu vực giảm giá (VND)
  const voucherHtml = `
    <div class="mt-3 p-3 border rounded">
      <label class="mr-2 mb-2">Voucher:</label>
      <input id="voucherCode" class="form-control d-inline-block mb-2"
             style="width:260px" placeholder="WELCOME25 / HOLIDAY15 / WEEKEND10"
             ${prefillCode ? `value="${prefillCode}"` : ''}>
      <button id="btnApplyVoucher" class="btn btn-sm btn-outline-dark ml-2 mb-2">Apply</button>
      <div class="mt-2">Giảm: <strong><span id="discountVnd">0</span> đ</strong></div>
    </div>
  `;

  wrap.innerHTML = rowsHtml + voucherHtml;

  // Gắn sự kiện Apply + Enter
  document.getElementById('btnApplyVoucher').addEventListener('click', applyVoucher);
  const ip = document.getElementById('voucherCode');
  ip.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); applyVoucher(); }
  });

  // Cập nhật tổng tiền (sẽ tự đọc code đang áp trong dataset nếu có)
  updateTotal();
}

function changeQty(name, v){ const c=store.get('cart',[]); const i=c.findIndex(x=>x.name===name); if(i>=0){ c[i].qty=Math.max(1,parseInt(v||'1',10)); store.set('cart', c); renderCart(); } }
function removeItem(name){ const c=store.get('cart',[]).filter(x=>x.name!==name); store.set('cart', c); renderCart(); }
function cartSubtotalUSD(){
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  return cart.reduce((s,it)=> s + Number(it.price||0) * Number(it.qty||1), 0);
}
function applyVoucher(){
  const code = (document.getElementById('voucherCode').value || '').trim();
  const subtotal = cartSubtotalUSD();
  const result = VoucherEngine.apply(code, { subtotalUSD: subtotal, now: new Date() });

  if(!result.ok){
    alert(result.message || 'Không thể áp dụng voucher');
    document.getElementById('discountVnd').textContent = '0';
    document.getElementById('voucherCode').dataset.applied = '';
    updateTotal();
    return;
  }

  document.getElementById('voucherCode').dataset.applied = result.code;
  const discountVND = Math.round(result.discountUSD * 24000);
  document.getElementById('discountVnd').textContent = discountVND.toLocaleString('vi-VN');
  updateTotal();
}
function updateTotal(){
  const subtotal = cartSubtotalUSD();
  const code = (document.getElementById('voucherCode')?.dataset.applied || '').trim();
  let discountUSD = 0;
  if(code){
    const r = VoucherEngine.apply(code, { subtotalUSD: subtotal, now: new Date() });
    if(r.ok) discountUSD = r.discountUSD;
  }
  const total = Math.max(0, subtotal - discountUSD);
  document.getElementById('cartTotal').textContent = total.toFixed(2);
}
document.addEventListener('DOMContentLoaded', renderCart);
function checkout() {
  const items = store.get('cart', []) || [];
  if (!items.length) {
    alert('Giỏ hàng trống!');
    return;
  }

  // Lấy mã voucher đang áp (nếu có)
  const appliedCode = document.getElementById('voucherCode')?.dataset.applied || '';
  const subtotal = cartSubtotalUSD();
  let discountUSD = 0;

  if (appliedCode) {
    const result = VoucherEngine.apply(appliedCode, { subtotalUSD: subtotal, now: new Date() });
    if (result.ok) discountUSD = result.discountUSD;
  }

  const totalUSD = Math.max(0, subtotal - discountUSD);

  try {
    // Tạo đơn hàng (đưa dữ liệu vào localStorage để hiển thị ở history)
    const orders = store.get('orders', []);
    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString(),
      items,
      subtotalUSD: subtotal,
      discountUSD,
      totalUSD,
      voucher: appliedCode,
      status: 'CREATED'
    };
    orders.push(newOrder);
    store.set('orders', orders);

    alert(`Tạo đơn thành công! Tổng tiền: $${totalUSD.toFixed(2)}`);

    // Xóa giỏ hàng
    store.remove('cart');
    // Xóa voucher đã lưu
    VoucherEngine.clearSelected?.();

    // Chuyển sang trang lịch sử
    location.href = 'history.html';
  } catch (e) {
    console.error(e);
    alert('Lỗi khi tạo đơn hàng!');
  }
}
