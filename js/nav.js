// nav.js v2 — robust for all pages/layouts
(function () {
  function getUser() {
    try {
      if (typeof api !== 'undefined' && api.currentUser) {
        const u = api.currentUser();
        if (u) return u;
      }
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch { return null; }
  }

  function findNavList() {
    // Ưu tiên: UL bên trong #ftco-nav (div collapse)
    let ul = document.querySelector('#ftco-nav .navbar-nav');
    if (ul) return ul;
    // fallback: bất kỳ UL .navbar-nav cuối cùng trong navbar
    const uls = document.querySelectorAll('.navbar .navbar-nav, #ftco-navbar .navbar-nav');
    return uls[uls.length - 1] || null;
  }

  function setActive() {
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.navbar .nav-item a.nav-link').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === current) a.parentElement.classList.add('active');
      else a.parentElement.classList.remove('active');
    });
  }

  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const n = cart.reduce((s, it) => s + (it.qty || 0), 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = n;
    const cartNav = document.getElementById('cartNav');
    if (cartNav) cartNav.style.display = n > 0 ? '' : '';
  }

  function buildUserDropdown(user) {
    const li = document.getElementById('loginContainer');
    if (!li) return;

    if (user) {
      li.classList.add('nav-item', 'dropdown');
      li.innerHTML = `
        <a class="nav-link dropdown-toggle" id="userDropdown" role="button"
           data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#">
          <span class="icon icon-user"></span> ${user.name || 'User'}
        </a>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="userDropdown">
          ${user.role === 'admin' ? `<a class="dropdown-item" href="admin.html">Admin dashboard</a>` : ''}
          <a class="dropdown-item" href="history.html">Đơn hàng của tôi</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#" id="navLogout">Đăng xuất</a>
        </div>`;

      const logout = document.getElementById('navLogout');
      if (logout) {
        logout.addEventListener('click', function (e) {
          e.preventDefault();
          try { if (typeof api !== 'undefined' && api.logout) api.logout(); } catch {}
          localStorage.removeItem('currentUser');
          location.href = 'index.html';
        });
      }
    } else {
      li.className = 'nav-item';
      li.innerHTML = `<a href="login.html" class="nav-link"><span class="icon icon-user"></span> Login</a>`;
    }
  }

  function ensureAdminLink(user) {
    // Ưu tiên dùng placeholder nếu có
    const adminLi = document.getElementById('adminNav');
    if (adminLi) {
      adminLi.style.display = (user && user.role === 'admin') ? '' : 'none';
      return;
    }
    // Nếu không có placeholder, chèn mới vào trước loginContainer
    const list = findNavList();
    const loginLi = document.getElementById('loginContainer');
    if (!list) return;

    let li = document.getElementById('adminNav');
    if (!li) {
      li = document.createElement('li');
      li.id = 'adminNav';
      li.className = 'nav-item';
      li.innerHTML = `<a href="admin.html" class="nav-link">ADMIN</a>`;
      if (loginLi && loginLi.parentElement === list) {
        list.insertBefore(li, loginLi);
      } else {
        list.appendChild(li);
      }
    }
    li.style.display = (user && user.role === 'admin') ? '' : 'none';
  }

  function init() {
    const user = getUser();
    ensureAdminLink(user);
    buildUserDropdown(user);
    updateCartBadge();
    setActive();
  }

  // Chạy sau khi DOM sẵn sàng (và nếu cần sau load để luôn thắng CSS/JS khác)
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
})();
