function getVoucher(code){
  try {
    VoucherEngine.saveSelected(code);
    // Hiển thị code dưới thẻ tương ứng (nếu trang có khung hiển thị)
    const el = document.getElementById('code-' + code);
    if (el) { el.textContent = code; el.classList.add('active'); }
    // Copy vào clipboard (nếu được)
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    alert('Đã lưu mã ' + code + ' — mở giỏ hàng để áp dụng.');
  } catch(e) {
    alert('Không thể lấy mã. Vui lòng thử lại.');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  // Nếu có loader của template thì ẩn đi để tránh che giao diện
  document.getElementById('ftco-loader')?.classList.remove('show');
});
