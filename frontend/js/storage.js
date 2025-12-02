const store = {
  get(k, fb){ try{ return JSON.parse(localStorage.getItem(k)) ?? fb; }catch{return fb;} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
  remove(k){ localStorage.removeItem(k); }
};
(function seed(){
  if(!store.get('users')){
    store.set('users', [
      { id:1, role:'admin', email:'admin@coffee.local', password:'admin123', name:'Admin', points:0 },
      { id:2, role:'customer', email:'user@coffee.local', password:'user123', name:'Khách hàng', points:120 }
    ]);
  }
  if(!store.get('session')) store.set('session', { userId:null });
  if(!store.get('menu')){
    store.set('menu', [
      { id:1, name:'Black Coffee', price:29000, img:'images/drink-1.jpg', active:true },
      { id:2, name:'Milk Coffee',  price:35000, img:'images/drink-2.jpg', active:true },
      { id:3, name:'Cappuccino',   price:42000, img:'images/drink-3.jpg', active:true }
    ]);
  }
  if(!store.get('vouchers')){
    store.set('vouchers', [
      { code:'WELCOME10', type:'percent', value:10, min:0, active:true, createdBy:1 },
      { code:'50K', type:'amount', value:50000, min:200000, active:true, createdBy:1 }
    ]);
  }
  if(!store.get('orders'))  store.set('orders', []);
  if(!store.get('reviews')) store.set('reviews', []);
})();
