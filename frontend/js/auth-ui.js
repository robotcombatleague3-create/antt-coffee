document.addEventListener('DOMContentLoaded', () => {
  // header user slot (hiển thị ở mọi trang có [data-auth-slot])
  const slot = document.querySelector('[data-auth-slot]');
  const user = api.currentUser();
  if(slot){
    slot.innerHTML = user
      ? `<span class="mr-2">Xin chào, ${user.name} (${user.points} điểm)</span>
         <button id="btnLogout" class="btn btn-sm btn-outline-light">Đăng xuất</button>`
      : `<a class="btn btn-sm btn-outline-light" href="login.html">Đăng nhập</a>`;
    document.getElementById('btnLogout')?.addEventListener('click', ()=>{ api.logout(); location.href='index.html'; });
  }

  // trang login
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('username').value.trim(); // dùng field "username" làm email
      const pass  = document.getElementById('password').value.trim();
      try{ 
        const u = api.login(email, pass);
        if(u.role==='admin') location.href='admin.html'; else location.href='index.html';
      }catch(err){ document.getElementById('errorMessage').textContent = err.message; }
    });
  }
});
