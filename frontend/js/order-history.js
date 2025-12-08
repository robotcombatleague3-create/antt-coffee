(function(){
    const API_URL = 'http://localhost:3000/api';
    const vnd = (n) => parseInt(n).toLocaleString('vi-VN') + ' đ';
  
    function statusBadge(s){
        const mapClass = { 'CREATED': 'badge-warning', 'CONFIRMED': 'badge-primary', 'Processing': 'badge-info', 'Completed': 'badge-success', 'Cancelled': 'badge-danger' };
        const mapText = { 'CREATED': 'Chờ xác nhận', 'CONFIRMED': 'Đã xác nhận', 'Processing': 'Đang thực hiện', 'Completed': 'Hoàn thành', 'Cancelled': 'Đã hủy' };
        return `<span class="badge ${mapClass[s]||'badge-secondary'}" style="font-size: 13px; padding: 8px 12px; border-radius: 4px;">${mapText[s]||s}</span>`;
    }
  
    async function fetchOrders() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // --- DEBUG QUAN TRỌNG: Kiểm tra xem User ID là gì ---
        console.log("Current User trong LocalStorage:", user);

        if(!user) {
            console.warn("Chưa đăng nhập -> Chuyển hướng");
            window.location.href = 'login.html';
            return [];
        }

        // Lấy ID: Ưu tiên Acc_id (từ DB thật), fallback sang id (mock cũ)
        const userId = user.Acc_id || user.id;
        
        if (!userId) {
            console.error("LỖI: User object không có Acc_id hoặc id. Hãy Đăng xuất và Đăng nhập lại.");
            alert("Lỗi phiên đăng nhập. Vui lòng đăng nhập lại.");
            return [];
        }

        console.log(`Đang gọi API: ${API_URL}/orders/user/${userId}`);

        try {
            const res = await fetch(`${API_URL}/orders/user/${userId}`);
            const json = await res.json();
            
            console.log("Kết quả từ API:", json); // Xem API trả về gì

            if(json.success) return json.data;
            return [];
        } catch(e) {
            console.error("Lỗi kết nối API:", e);
            return [];
        }
    }
  
    function renderList(list){
        const box = document.getElementById('orderList');
        if(!list || list.length === 0){ 
            box.innerHTML = `<div class="text-center py-5"><h3 class="text-white-50">Không tìm thấy đơn hàng nào.</h3><p class="text-muted">ID của bạn có thể không khớp với đơn hàng trong Database.</p></div>`; 
            return; 
        }
        
        box.innerHTML = list.map(o => {
            const itemsHtml = (o.items||[]).map(i => {
                let img = i.image || 'images/menu-1.jpg';
                if(img.startsWith('/')) img = 'http://localhost:3000' + img;
                return `
                <div class="d-flex align-items-center mb-2" style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <div style="width: 50px; height: 50px; background-image: url('${img}'); background-size: cover; border-radius: 4px; margin-right: 15px;"></div>
                    <div style="flex-grow: 1;">
                        <div class="text-white font-weight-bold">${i.name}</div>
                        <div class="text-white-50 small">x${i.qty}</div>
                    </div>
                    <div style="color: #c49b63;">${vnd(i.price)}</div>
                </div>`;
            }).join('');
  
            return `
            <div class="history-card p-3 mb-3" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                <div class="d-flex justify-content-between mb-3 pb-2 border-bottom border-secondary">
                    <div>
                        <strong class="text-light">Đơn #${o.Order_id}</strong>
                        <div class="small text-muted">${new Date(o.Order_date).toLocaleString('vi-VN')}</div>
                    </div>
                    <div>${statusBadge(o.Status)}</div>
                </div>
                <div>${itemsHtml}</div>
                <div class="d-flex justify-content-between mt-3 pt-2 border-top border-secondary">
                    <span class="text-white-50">Tổng tiền:</span>
                    <strong style="color: #c49b63; font-size: 18px;">${vnd(o.Total_amount)}</strong>
                </div>
            </div>`;
        }).join('');
    }

    function renderStats(list) {
        document.getElementById('stCount').textContent = list.length;
        document.getElementById('stDone').textContent = list.filter(o => o.Status === 'Completed').length;
        document.getElementById('stCancel').textContent = list.filter(o => o.Status === 'Cancelled').length;
        const spent = list.filter(o => o.Status === 'Completed').reduce((sum, o) => sum + parseFloat(o.Total_amount), 0);
        document.getElementById('stSpent').textContent = vnd(spent);
    }

    async function init(){
        const list = await fetchOrders();
        renderStats(list);
        renderList(list);
    }
  
    document.addEventListener('DOMContentLoaded', init);
})();