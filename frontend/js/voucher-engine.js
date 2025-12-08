const VoucherEngine = (() => {
  // ====== KHAI BÁO VOUCHER (Đơn vị: VND) ======
  // min: giá trị đơn tối thiểu để áp dụng
  const VOUCHERS = [
    { 
        code: 'WELCOME25',  
        type: 'percent', 
        value: 25, 
        min: 0,  
        desc: 'Giảm 25% cho đơn đầu tiên',
        expires: '2025-12-31' 
    },
    { 
        code: 'HOLIDAY15',  
        type: 'percent', 
        value: 15, 
        min: 0, 
        desc: 'Giảm 15% sự kiện lễ hội', 
        expires: '2025-11-30' 
    },
    { 
        code: 'WEEKEND10',  
        type: 'percent', 
        value: 10, 
        min: 50000, // Đơn tối thiểu 50k
        desc: 'Giảm 10% dịp cuối tuần (Đơn > 50k)',
        expires: null, 
        onlyWeekend: true 
    }
  ];

  function find(code){
    return VOUCHERS.find(v => v.code.toUpperCase() === String(code||'').trim().toUpperCase());
  }
  function isWeekend(d){ const n = (d||new Date()).getDay(); return n === 0 || n === 6; } // CN / T7

  // ctx: { subtotal: number, now?: Date }
  function apply(code, ctx){
    const res = { ok:false, code:null, discount:0, message:'' };
    const v = find(code);
    if(!v){ res.message='Mã voucher không tồn tại'; return res; }

    const now = ctx?.now || new Date();
    if(v.expires && new Date(now) > new Date(v.expires+'T23:59:59')) {
      res.message='Voucher đã hết hạn'; return res;
    }
    if(v.onlyWeekend && !isWeekend(now)){
      res.message='Voucher chỉ áp dụng cuối tuần'; return res;
    }
    const subtotal = Number(ctx?.subtotal || 0);
    if(subtotal <= 0){ res.message='Giỏ hàng trống'; return res; }
    
    // Kiểm tra giá trị tối thiểu
    if(subtotal < (v.min||0)){ 
        res.message = `Đơn tối thiểu ${(v.min||0).toLocaleString()}đ để áp dụng`; 
        return res; 
    }

    let discount = 0;
    if(v.type === 'percent') discount = subtotal * (v.value/100);
    else if(v.type === 'amount') discount = v.value;

    discount = Math.min(discount, subtotal); // Không giảm quá giá trị đơn
    res.ok = true; res.code = v.code; res.discount = discount;
    return res;
  }

  // Tiện ích lưu/đọc code đã chọn vào LocalStorage
  function saveSelected(code){ localStorage.setItem('appliedVoucherCode', String(code||'')); }
  function readSelected(){ return localStorage.getItem('appliedVoucherCode') || ''; }
  function clearSelected(){ localStorage.removeItem('appliedVoucherCode'); }

  return { apply, saveSelected, readSelected, clearSelected, _find:find };
})();