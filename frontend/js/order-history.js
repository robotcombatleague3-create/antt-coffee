// orders-history.js — lịch sử đơn nâng cấp: lọc, thống kê, chi tiết, hủy, đặt lại
(function(){
  const $ = (sel) => document.querySelector(sel);

  function vnd(n){ return (n||0).toLocaleString('vi-VN') + ' đ'; }
  function statusBadge(s){
    const map = {
      CREATED:   'badge-warning',
      CONFIRMED: 'badge-info',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-secondary'
    };
    const text = {
      CREATED: 'CHỜ XÁC NHẬN',
      CONFIRMED: 'ĐÃ XÁC NHẬN',
      COMPLETED: 'ĐÃ HOÀN TẤT',
      CANCELLED: 'ĐÃ HỦY'
    }[s] || s;
    return `<span class="badge ${map[s]||'badge-light'} badge-status">${text}</span>`;
  }

  function loadFilter(){
    try{ return JSON.parse(localStorage.getItem('order_filters')||'{}'); }catch{return{}}
  }
  function saveFilter(f){ localStorage.setItem('order_filters', JSON.stringify(f)); }

  function getFilters(){
    return {
      status: $('#fStatus').value,
      from: $('#fFrom').value,
      to: $('#fTo').value,
      q: ($('#fQuery').value||'').trim().toLowerCase()
    };
  }
  function setFilters(f){
    if(f.status) $('#fStatus').value = f.status;
    if(f.from) $('#fFrom').value = f.from;
    if(f.to) $('#fTo').value = f.to;
    if(f.q) $('#fQuery').value = f.q;
  }

  function withinDateRange(d, from, to){
    const t = new Date(d).setHours(0,0,0,0);
    if(from){ const f = new Date(from).setHours(0,0,0,0); if(t < f) return false; }
    if(to){ const e = new Date(to).setHours(23,59,59,999); if(new Date(d) > e) return false; }
    return true;
  }

  function filterOrders(list, f){
    return list.filter(o=>{
      if(f.status && f.status!=='all' && o.status !== f.status) return false;
      if(f.from || f.to) if(!withinDateRange(o.createdAt, f.from, f.to)) return false;
      if(f.q){
        const hitId = (o.id||'').toLowerCase().includes(f.q);
        const hitItem = (o.items || []).some(i => (i.name||'').toLowerCase().includes(f.q));
        if(!hitId && !hitItem) return false;
      }
      return true;
    });
  }

  function renderStats(list){
    $('#stCount').textContent = list.length;
    $('#stDone').textContent  = list.filter(o=>o.status==='COMPLETED').length;
    $('#stCancel').textContent= list.filter(o=>o.status==='CANCELLED').length;
    const spent = list.filter(o=>o.status==='COMPLETED').reduce((s,o)=>s+o.total,0);
    $('#stSpent').textContent = vnd(spent);
  }

  function renderList(list){
    const box = $('#orderList');
    if(!list.length){ box.innerHTML = `<p class="muted">Chưa có đơn hàng.</p>`; return; }
    box.innerHTML = list.map(o=>{
      const items = (o.items||[]).map(i=>`
        <tr>
          <td>${i.name}</td>
          <td class="text-center">${i.qty}</td>
          <td class="text-right">${vnd(i.price)}</td>
          <td class="text-right">${vnd(i.price*i.qty)}</td>
        </tr>`).join('');

      const ops = [
        o.status==='CREATED' ? `<button class="btn btn-sm btn-outline-danger" data-act="cancel" data-id="${o.id}">Hủy đơn</button>` : '',
        `<button class="btn btn-sm btn-outline-primary" data-act="reorder" data-id="${o.id}">Đặt lại</button>`,
        `<button class="btn btn-sm btn-outline-secondary" data-act="copy" data-id="${o.id}">Copy mã</button>`
      ].filter(Boolean).join(' ');

      return `
      <div class="order-card mb-3">
        <div class="order-header">
          <div>
            <strong>${o.id}</strong>
            <span class="muted">• ${new Date(o.createdAt).toLocaleString('vi-VN')}</span>
            ${o.voucher ? `<span class="badge badge-light ml-1">Voucher: ${o.voucher}</span>`:''}
          </div>
          <div>${statusBadge(o.status)}</div>
        </div>
        <div class="order-body">
          <div class="table-responsive">
            <table class="table table-sm mb-2">
              <thead><tr><th>Món</th><th class="text-center">SL</th><th class="text-right">Giá</th><th class="text-right">Thành tiền</th></tr></thead>
              <tbody>${items}</tbody>
            </table>
          </div>
          <div class="d-flex justify-content-between align-items-center flex-wrap">
            <div class="muted">
              Tạm tính: <strong>${vnd(o.subtotal)}</strong>
              &nbsp;•&nbsp; Giảm: <strong>${vnd(o.discount)}</strong>
              &nbsp;•&nbsp; Tổng: <strong>${vnd(o.total)}</strong>
            </div>
            <div class="ops">${ops}</div>
          </div>
        </div>
      </div>`;
    }).join('');

    // gắn event nút thao tác
    box.querySelectorAll('[data-act]').forEach(btn=>{
      const id = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');
      btn.addEventListener('click', ()=>{
        if(act==='cancel'){
          if(confirm('Bạn muốn hủy đơn này?')) {
            try{ api.cancelOrder(id); refresh(); } catch(e){ alert(e.message); }
          }
        } else if(act==='reorder'){
          const order = (api.myOrders()||[]).find(o=>o.id===id);
          if(!order) return;
          // tạo giỏ mới từ đơn cũ
          const items = (order.items||[]).map(i=>({ name:i.name, price:i.price/1000 /* sang USD nếu cart dùng USD */, qty:i.qty }));
          localStorage.setItem('cart', JSON.stringify(items));
          alert('Đã thêm lại các món vào giỏ hàng.');
          location.href = 'cart.html';
        } else if(act==='copy'){
          navigator.clipboard.writeText(id).then(()=>{ btn.textContent='Đã copy'; setTimeout(()=>btn.textContent='Copy mã',1000); });
        }
      });
    });
  }

  function refresh(){
    const user = api.currentUser();
    // Nếu là admin, có thể hiển thị khác; ở đây chỉ thông báo nhẹ
    if(user && user.role==='admin'){
      // admin thường không có đơn cá nhân; vẫn hiển thị rỗng
    }

    const raw = api.myOrders().slice().sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    const f = getFilters(); saveFilter(f);
    const list = filterOrders(raw, f);
    renderStats(list);
    renderList(list);
  }

  function init(){
    // set filter mặc định từ localStorage
    setFilters(loadFilter());

    $('#btnApply').addEventListener('click', refresh);
    $('#btnReset').addEventListener('click', ()=>{
      $('#fStatus').value='all'; $('#fFrom').value=''; $('#fTo').value=''; $('#fQuery').value=''; refresh();
    });

    refresh();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
