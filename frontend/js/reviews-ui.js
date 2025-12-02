function renderReviews(productId=null) {
  const list = api.listReviews(productId);
  const box = document.getElementById('reviewsBox');
  box.innerHTML = list.map(r=>`
    <div class="border rounded p-2 mb-2">
      <div class="small text-muted">${new Date(r.createdAt).toLocaleString()}</div>
      <div>⭐ ${r.rating}/5</div>
      <div>${r.comment}</div>
      ${r.reply ? `<div class="mt-1 p-2 bg-light"><em>Phản hồi admin:</em> ${r.reply}</div>`:''}
    </div>`).join('') || '<p>Chưa có đánh giá.</p>';
}
function submitReview(productId) {
  const rating = parseInt(document.getElementById('rvRating').value,10);
  const comment = document.getElementById('rvComment').value.trim();
  try { api.addReview({ productId, rating, comment }); document.getElementById('rvComment').value=''; renderReviews(productId); }
  catch (e) { alert(e.message); }
}
document.addEventListener('DOMContentLoaded', () => {
  const pid = window.REVIEW_PRODUCT_ID || null;
  renderReviews(pid);
});
