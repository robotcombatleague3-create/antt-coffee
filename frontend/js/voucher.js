document.addEventListener('DOMContentLoaded', () => {
    loadVouchersFromAPI();
});

async function loadVouchersFromAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/vouchers');
        const res = await response.json();

        if (res.success) {
            renderVouchers(res.data);
        }
    } catch (error) {
        console.error("Lỗi tải voucher:", error);
    }
}

function renderVouchers(vouchers) {
    const container = document.querySelector('.ftco-section .row:nth-child(2)'); // Tìm row chứa danh sách voucher
    if (!container) return;

    container.innerHTML = ''; // Xóa mẫu cũ

    vouchers.forEach(v => {
        // Kiểm tra hạn sử dụng
        const isExpired = new Date(v.Date_end) < new Date();
        const expiryDate = new Date(v.Date_end).toLocaleDateString('vi-VN');
        
        // Xử lý loại giảm giá hiển thị
        let discountText = "";
        if(v.Description.includes('percent')) {
            discountText = `GIẢM ${v.Value}%`;
        } else {
            discountText = `GIẢM ${parseInt(v.Value).toLocaleString()}đ`;
        }

        const html = `
        <div class="col-md-4 mb-4 ftco-animate fadeInUp ftco-animated">
            <div class="voucher-card text-center p-4" style="border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2); opacity: ${isExpired ? 0.5 : 1}">
                <div class="voucher-content">
                    <div class="discount" style="color: #c49b63; font-size: 24px; font-weight: bold; margin-bottom: 15px;">
                        ${discountText}
                    </div>
                    <h3 class="heading" style="color: #fff; font-size: 18px;">${v.Voucher_name}</h3>
                    <p style="color: #ccc;">Đơn tối thiểu: ${parseInt(v.Min_order_val).toLocaleString()}đ</p>
                    <div class="validity mb-3" style="color: gray; font-size: 14px;">
                        HSD: ${expiryDate} ${isExpired ? '(Đã hết hạn)' : ''}
                    </div>
                    
                    ${!isExpired ? 
                        `<button class="btn btn-primary" onclick="getVoucher('${v.Voucher_code}')">Lưu Mã</button>` : 
                        `<button class="btn btn-secondary" disabled>Hết Hạn</button>`
                    }
                </div>
                <div class="voucher-code mt-2" id="code-${v.Voucher_code}" style="color: #fff; font-weight: bold;"></div>
            </div>
        </div>`;
        
        container.insertAdjacentHTML('beforeend', html);
    });
}

function getVoucher(code){
    // Lưu mã vào localStorage để trang Cart tự động điền
    localStorage.setItem('appliedVoucherCode', code);
    
    // Hiển thị code
    const el = document.getElementById('code-' + code);
    if (el) { 
        el.textContent = code; 
        el.style.display = 'block';
    }
    
    // Copy
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    alert(`Đã lưu mã ${code}! Hãy vào giỏ hàng để sử dụng.`);
}