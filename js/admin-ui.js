function guardAdmin(){
    const u = api.currentUser();
    if(!u || u.role!=='admin'){ alert('Chỉ Admin được truy cập'); location.href='login.html'; }
}
function renderAdminMenu(){
    const list=api.adminListMenu();
    document.getElementById('adminMenuBody').innerHTML = list.map(p=>`
        <tr>
        <td>${p.id}</td><td>${p.name}</td><td>${p.price.toLocaleString()} đ</td><td>${p.active?'✔':''}</td>
        <td><button class="btn btn-sm btn-outline-primary" onclick='fillP(${JSON.stringify(p).replace(/"/g,'&quot;')})'>Sửa</button></td>
        </tr>`).join('');
}
function fillP(p){ const f=document.getElementById('prodForm'); f.pid.value=p.id||''; f.name.value=p.name||''; f.price.value=p.price||0; f.img.value=p.img||''; f.active.checked=!!p.active; }
function saveP(e){ e.preventDefault(); const f=e.target;
    api.adminSaveProduct({ id:f.pid.value?Number(f.pid.value):undefined, name:f.name.value.trim(), price:parseInt(f.price.value,10)||0, img:f.img.value.trim(), active:f.active.checked });
    f.reset(); renderAdminMenu();
}
function renderAdminOrders(){
    const list=api.adminListOrders();
    document.getElementById('adminOrderBody').innerHTML = list.map(o=>`
        <tr><td>${o.id}</td><td>${o.userId}</td><td>${o.total.toLocaleString()} đ</td><td>${o.status}</td>
        <td><select class="form-control form-control-sm" onchange="api.adminUpdateOrderStatus('${o.id}', this.value)">
        ${['CREATED','CONFIRMED','COMPLETED','CANCELLED'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select></td></tr>`).join('');
}
function renderAdminVouchers(){
    document.getElementById('adminVoucherBody').innerHTML = api.listVouchers().map(v=>`
        <tr><td>${v.code}</td><td>${v.type}</td><td>${v.value}</td><td>${(v.min||0).toLocaleString()} đ</td><td>${v.active?'✔':''}</td></tr>`
    ).join('');
}
function createVoucher(e){ e.preventDefault(); const f=e.target;
    try{ api.adminCreateVoucher({ code:f.code.value.trim(), type:f.type.value, value:parseInt(f.value.value,10)||0, min:parseInt(f.min.value,10)||0 }); f.reset(); renderAdminVouchers(); }
    catch(err){ alert(err.message); }
}
document.addEventListener('DOMContentLoaded', ()=>{
    guardAdmin();
    document.getElementById('prodForm')?.addEventListener('submit', saveP);
    document.getElementById('voucherForm')?.addEventListener('submit', createVoucher);
    renderAdminMenu(); renderAdminOrders(); renderAdminVouchers();
});
