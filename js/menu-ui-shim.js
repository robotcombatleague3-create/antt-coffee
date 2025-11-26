// Giỏ dạng tối giản, tương thích với layout hiện tại
const cartShim = {
  get(){ return store.get('cart', []); },
  set(v){ store.set('cart', v); },
  add(item){
    const c=this.get();
    const i=c.findIndex(x=>x.name===item.name);
    if(i>=0) c[i].qty += 1; else c.push({...item, qty:1});
    this.set(c); this.updateBadge();
  },
  updateBadge(){
    const n=this.get().reduce((s,it)=>s+it.qty,0);
    const el=document.getElementById('cartCount'); if(el) el.textContent=n;
    const nav=document.getElementById('cartNav'); if(nav) nav.style.display='block';
  }
};
window.addToCart = (name, price)=> cartShim.add({ name, price }); // tương thích onclick hiện có
document.addEventListener('DOMContentLoaded', ()=>{
  cartShim.updateBadge();
  // hiện các nút "Add to Cart" đang bị style="display:none"
  document.querySelectorAll('.btn-add-to-cart').forEach(b=> b.style.display='inline-block');
});
