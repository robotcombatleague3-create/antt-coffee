function renderMyOrders() {
  const list = api.myOrders();
  const container = document.getElementById('orderList');
  if (!list.length) { container.innerHTML = '<p>Chưa có đơn hàng.</p>'; return; }
  container.innerHTML = list.map(o => `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <div><strong>${o.id}</strong> · ${new Date(o.createdAt).toLocaleString()}</div>
          <div><span class="badge badge-${o.status==='CREATED'?'warning':o.status==='CANCELLED'?'secondary':'success'}">${o.status}</span></div>
        </div>
        <ul class="mt-2 mb-2">
          ${o.items.map(i=>`<li>${i.name} × ${i.qty} — ${(i.price*i.qty).toLocaleString()} đ</li>`).join('')}
        </ul>
        <div>Tạm tính: ${o.subtotal.toLocaleString()} đ · Giảm: ${o.discount.toLocaleString()} đ · <strong>Tổng: ${o.total.toLocaleString()} đ</strong></div>
        ${o.status==='CREATED' ? `<button class="btn btn-sm btn-outline-danger mt-2" onclick="cancelOrder('${o.id}')">Hủy đơn</button>` : ''}
      </div>
    </div>`).join('');
}
function cancelOrder(id) {
  if (!confirm('Bạn chắc chắn hủy đơn?')) return;
  try { api.cancelOrder(id); renderMyOrders(); } catch (e) { alert(e.message); }
}
document.addEventListener('DOMContentLoaded', renderMyOrders);
