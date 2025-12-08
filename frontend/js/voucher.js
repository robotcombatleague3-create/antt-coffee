document.addEventListener('DOMContentLoaded', () => {
    loadVouchersFromAPI();
});

async function loadVouchersFromAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/vouchers');
        const res = await response.json();
        if (res.success) renderVouchers(res.data);
    } catch (error) {
        console.error("Lỗi tải voucher:", error);
    }
}

function renderVouchers(vouchers) {
    const container = document.getElementById('voucher-list');
    if (!container) return;
    
    container.innerHTML = ''; 

    if (vouchers.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Chưa có voucher nào.</p></div>';
        return;
    }

    vouchers.forEach(v => {
        const now = new Date();
        const endDate = new Date(v.Date_end);
        const isExpired = endDate < now;
        
        let discountText = "";
        let isPercent = v.Description && v.Description.toLowerCase().includes('percent');
        if (v.Value <= 100) isPercent = true; 

        discountText = isPercent ? `GIẢM ${v.Value}%` : `GIẢM ${parseInt(v.Value).toLocaleString('vi-VN')}đ`;

        // QUAN TRỌNG: Nút onclick gọi window.saveVoucher
        const html = `
        <div class="col-md-4 mb-4">
            <div class="voucher-card text-center p-4" style="border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); border-radius: 8px;">
                <div class="voucher-content">
                    <div style="color: #c49b63; font-size: 24px; font-weight: bold; margin-bottom: 10px;">${discountText}</div>
                    <h3 style="color: #fff; font-size: 18px;">${v.Voucher_name}</h3>
                    <p class="text-warning font-weight-bold mb-1">${v.Voucher_code}</p>
                    <p style="color: #aaa; font-size: 13px;">Đơn tối thiểu: ${parseInt(v.Min_order_val).toLocaleString('vi-VN')}đ</p>
                    <p style="color: gray; font-size: 13px;">HSD: ${endDate.toLocaleDateString('vi-VN')}</p>
                    
                    ${!isExpired ? 
                        `<button class="btn btn-primary btn-sm" onclick="window.saveVoucher('${v.Voucher_code}')">Lưu Mã</button>` : 
                        `<button class="btn btn-secondary btn-sm" disabled>Đã Hết Hạn</button>`
                    }
                </div>
            </div>
        </div>`;
        
        container.insertAdjacentHTML('beforeend', html);
    });
}

// --- QUAN TRỌNG: Gán hàm vào window để gọi được từ HTML ---
window.saveVoucher = function(code) {
    console.log("Đang lưu mã:", code); // Debug log
    let myVouchers = JSON.parse(localStorage.getItem('myVouchers')) || [];
    
    if (!myVouchers.includes(code)) {
        myVouchers.push(code);
        localStorage.setItem('myVouchers', JSON.stringify(myVouchers));
        alert(`Thành công! Mã ${code} đã được lưu vào ví.`);
    } else {
        alert(`Mã ${code} này bạn đã lưu rồi!`);
    }
};