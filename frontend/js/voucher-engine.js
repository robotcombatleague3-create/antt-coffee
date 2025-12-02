const VoucherEngine = (() => {
  // ====== KHAI BÁO VOUCHER ======
  // unit: USD, min = giá trị đơn tối thiểu (USD)
  const VOUCHERS = [
    { code: 'WELCOME25',  type: 'percent', value: 25, min: 0,  expires: '2025-12-31' },
    { code: 'HOLIDAY15',  type: 'percent', value: 15, min: 0,  expires: '2025-11-30' },
    { code: 'WEEKEND10',  type: 'percent', value: 10, min: 20, expires: null, onlyWeekend: true }
  ];

  function find(code){
    return VOUCHERS.find(v => v.code.toUpperCase() === String(code||'').trim().toUpperCase());
  }
  function isWeekend(d){ const n = (d||new Date()).getDay(); return n === 0 || n === 6; } // CN / T7

  // ctx: { subtotalUSD:number, now?:Date }
  function apply(code, ctx){
    const res = { ok:false, code:null, discountUSD:0, message:'' };
    const v = find(code);
    if(!v){ res.message='Voucher không tồn tại'; return res; }

    const now = ctx?.now || new Date();
    if(v.expires && new Date(now) > new Date(v.expires+'T23:59:59')) {
      res.message='Voucher đã hết hạn'; return res;
    }
    if(v.onlyWeekend && !isWeekend(now)){
      res.message='Voucher chỉ áp dụng cuối tuần'; return res;
    }
    const subtotal = Number(ctx?.subtotalUSD || 0);
    if(subtotal <= 0){ res.message='Giỏ hàng trống'; return res; }
    if(subtotal < (v.min||0)){ res.message=`Đơn tối thiểu $${(v.min||0).toFixed(2)}`; return res; }

    let discount = 0;
    if(v.type === 'percent') discount = subtotal * (v.value/100);
    else if(v.type === 'amount') discount = v.value;

    discount = Math.min(discount, subtotal); // không âm
    res.ok = true; res.code = v.code; res.discountUSD = discount;
    return res;
  }

  // tiện ích lưu/đọc code đã chọn
  function saveSelected(code){ localStorage.setItem('appliedVoucherCode', String(code||'')); }
  function readSelected(){ return localStorage.getItem('appliedVoucherCode') || ''; }
  function clearSelected(){ localStorage.removeItem('appliedVoucherCode'); }

  return { apply, saveSelected, readSelected, clearSelected, _find:find };
})();
