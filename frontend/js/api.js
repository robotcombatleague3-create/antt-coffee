const api = {
  currentUser(){
    const {userId} = store.get('session', {userId:null});
    return store.get('users', []).find(u=>u.id===userId) || null;
  },
  login(email, password){
    const u = store.get('users', []).find(x=>x.email===email && x.password===password);
    if(!u) throw new Error('Sai email hoặc mật khẩu');
    store.set('session', { userId:u.id });
    localStorage.setItem('currentUser', JSON.stringify(u)); // bridge cho code cũ
    return u;
  },
  logout(){ store.set('session', {userId:null}); localStorage.removeItem('currentUser'); },

  register({name,email,password}){
    const users = store.get('users', []);
    if(users.some(u=>u.email===email)) throw new Error('Email đã tồn tại');
    const user = { id:Date.now(), role:'customer', name, email, password, points:0 };
    users.push(user); store.set('users', users); return user;
  },

  // menu
  getMenu(){ return store.get('menu', []).filter(m=>m.active); },
  adminListMenu(){ return store.get('menu', []); },
  adminSaveProduct(p){
    const menu = store.get('menu', []);
    if(p.id){ const i=menu.findIndex(x=>x.id===p.id); if(i>=0) menu[i]={...menu[i],...p}; }
    else { p.id=Date.now(); p.active=!!p.active; menu.push(p); }
    store.set('menu', menu); return p;
  },

  // voucher & points
  listVouchers(){ return store.get('vouchers', []).filter(v=>v.active); },
  adminCreateVoucher(v){
    const vs = store.get('vouchers', []);
    if(vs.some(x=>x.code===v.code)) throw new Error('Trùng mã voucher');
    vs.push({...v, createdBy: this.currentUser()?.id || 0, active:true}); store.set('vouchers', vs);
  },
  applyVoucher(code, subtotal){
    const v = store.get('vouchers', []).find(x=>x.code===code && x.active);
    if(!v) throw new Error('Voucher không hợp lệ');
    if(subtotal < (v.min||0)) throw new Error('Chưa đạt giá trị tối thiểu');
    const discount = v.type==='percent' ? Math.floor(subtotal*(v.value/100)) : v.value;
    return { code:v.code, discount };
  },
  addPoints(userId, vnd){ const users=store.get('users',[]); const i=users.findIndex(u=>u.id===userId);
    if(i>=0){ users[i].points += Math.floor(vnd/1000); store.set('users', users); } },

  // order
  createOrder({items, voucherCode}){
    const u=this.currentUser(); if(!u) throw new Error('Chưa đăng nhập');
    const menu=store.get('menu',[]);
    const expanded = items.map(it=>{
      if(it.productId){ const p=menu.find(m=>m.id===it.productId); return {productId:p.id,name:p.name,price:p.price,qty:it.qty}; }
      return {productId:Date.now()+Math.random(), name:it.name, price:Math.round(it.price*1000)/*$->đ*/, qty:it.qty||1};
    });
    const subtotal = expanded.reduce((s,it)=>s+it.price*it.qty,0);
    let discount=0, voucher=null;
    if(voucherCode){ const r=this.applyVoucher(voucherCode, subtotal); discount=r.discount; voucher=r.code; }
    const total = Math.max(0, subtotal - discount);
    const order = { id:'OD'+Date.now(), userId:u.id, items:expanded, subtotal, discount, total, voucher, status:'CREATED', createdAt:new Date().toISOString() };
    const orders=store.get('orders',[]); orders.unshift(order); store.set('orders', orders);
    this.addPoints(u.id, total); return order;
  },
  myOrders(){ const u=this.currentUser(); if(!u) return []; return store.get('orders', []).filter(o=>o.userId===u.id); },
  cancelOrder(id){ const os=store.get('orders',[]); const i=os.findIndex(o=>o.id===id);
    if(i>=0 && os[i].status==='CREATED'){ os[i].status='CANCELLED'; store.set('orders', os); return true; }
    throw new Error('Không thể hủy đơn');
  },
  adminListOrders(){ return store.get('orders', []); },
  adminUpdateOrderStatus(id, status){ const os=store.get('orders',[]); const i=os.findIndex(o=>o.id===id); if(i>=0){ os[i].status=status; store.set('orders', os); } },

  // review
  addReview({productId,rating,comment}){ const u=this.currentUser(); if(!u) throw new Error('Chưa đăng nhập');
    const r=store.get('reviews',[]); r.unshift({id:Date.now(),userId:u.id,productId,rating,comment,reply:'',createdAt:new Date().toISOString()}); store.set('reviews', r); },
  listReviews(pid=null){ const r=store.get('reviews',[]); return pid? r.filter(x=>x.productId===pid): r; },
  adminReply(id, reply){ const r=store.get('reviews',[]); const i=r.findIndex(x=>x.id===id); if(i>=0){ r[i].reply=reply; store.set('reviews', r); } }
};
