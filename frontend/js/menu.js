class MenuManager {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/menu';
        this.init();
    }

    init() {
        const run = () => {
            console.log("MenuManager: Đang tải menu...");
            this.checkLoginStatus();
            this.loadMenuFromAPI();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    async loadMenuFromAPI() {
        try {
            const response = await fetch(this.apiUrl);
            const res = await response.json();
            
            let products = [];
            if (res.success && Array.isArray(res.data)) products = res.data;
            else if (Array.isArray(res)) products = res;

            this.renderMenu(products);
        } catch (error) {
            console.error("Lỗi tải menu:", error);
            // Hiển thị lỗi ra màn hình nếu cần
        }
    }

    renderMenu(products) {
        // Mapping các Tab HTML
        const containers = {
            'cà phê': document.querySelector('#v-pills-0 .row'),
            'coffee': document.querySelector('#v-pills-0 .row'),
            'trà':    document.querySelector('#v-pills-1 .row'),
            'tea':    document.querySelector('#v-pills-1 .row'),
            'món ăn': document.querySelector('#v-pills-2 .row'),
            'food':   document.querySelector('#v-pills-2 .row'),
            'tráng miệng': document.querySelector('#v-pills-3 .row'),
            'dessert':     document.querySelector('#v-pills-3 .row')
        };

        // Reset nội dung cũ
        Object.values(containers).forEach(el => { if(el) el.innerHTML = ''; });

        products.forEach(p => {
            let imgUrl = p.image || 'images/menu-1.jpg';
            if (imgUrl.startsWith('/') && !imgUrl.startsWith('http')) {
                imgUrl = 'http://localhost:3000' + imgUrl;
            }

            // Link chi tiết
            const detailUrl = `detail.html?id=${p.id}&name=${encodeURIComponent(p.name)}&price=${p.price}&img=${encodeURIComponent(imgUrl)}&desc=${encodeURIComponent(p.description || '')}`;

            // Phân loại
            const catName = p.category ? p.category.toLowerCase().trim() : 'khác';
            let target = containers[catName];
            
            // Fallback nếu tên danh mục không khớp
            if (!target) {
                if (catName.includes('cà phê') || catName.includes('coffee')) target = containers['cà phê'];
                else if (catName.includes('trà') || catName.includes('nước')) target = containers['trà'];
                else if (catName.includes('món') || catName.includes('food')) target = containers['món ăn'];
                else if (catName.includes('tráng') || catName.includes('cake')) target = containers['tráng miệng'];
                else target = containers['cà phê']; // Mặc định
            }

            if (target) {
                // Sửa lỗi giao diện: Chắc chắn mỗi item nằm trong col-md-4
                const html = `
                <div class="col-md-4 text-center">
                    <div class="menu-wrap">
                        <a href="${detailUrl}" class="menu-img img mb-4" style="background-image: url('${imgUrl}');"></a>
                        <div class="text">
                            <h3><a href="${detailUrl}">${p.name}</a></h3>
                            <p class="price"><span>${parseFloat(p.price).toLocaleString('vi-VN')} đ</span></p>
                            <p>
                                <a href="#" class="btn btn-primary btn-outline-primary btn-add-to-cart" 
                                   onclick="menuManager.addToCartHandler(event, ${p.id}, '${p.name}', ${p.price}, '${imgUrl}')">
                                   Thêm vào giỏ
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`;
                target.insertAdjacentHTML('beforeend', html);
            }
        });
        
        this.checkLoginStatus();
    }

    addToCartHandler(e, id, name, price, img) {
        e.preventDefault();
        // Gọi hàm global addToCart (trong cart.js)
        if (typeof addToCart === 'function') {
            addToCart(id, name, price, img);
            this.checkLoginStatus(); // Update số lượng ngay
        } else {
            alert('Chức năng giỏ hàng chưa sẵn sàng!');
        }
    }

    checkLoginStatus() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const btns = document.querySelectorAll('.btn-add-to-cart');
        const cartNav = document.getElementById('cartNav');
        const loginContainer = document.getElementById('loginContainer');

        if (currentUser) {
            btns.forEach(b => b.style.display = 'inline-block');
            if(cartNav) cartNav.style.display = 'block';

            // Update số lượng badge
            const cartData = JSON.parse(localStorage.getItem('carts')) || {};
            const userCart = cartData[currentUser.username] || [];
            const total = userCart.reduce((sum, item) => sum + item.quantity, 0);
            const countEl = document.getElementById('cartCount');
            if(countEl) countEl.textContent = total;

            // Update User Info
            if (loginContainer && !loginContainer.innerHTML.includes('Logout')) {
                loginContainer.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" data-toggle="dropdown">
                        Hi, ${currentUser.username}
                    </a>
                    <div class="dropdown-menu">
                        ${currentUser.role === 'admin' ? '<a class="dropdown-item" href="admin.html">Quản lý Admin</a>' : ''}
                        <a class="dropdown-item" href="history.html">Lịch sử đơn hàng</a>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" href="#" onclick="menuManager.logout()">Đăng xuất</a>
                    </div>
                </li>`;
                loginContainer.classList.add('dropdown');
            }
        } else {
            btns.forEach(b => b.style.display = 'none');
            if(cartNav) cartNav.style.display = 'none';
            if (loginContainer) {
                loginContainer.innerHTML = `<a href="login.html" class="nav-link">Login</a>`;
                loginContainer.classList.remove('dropdown');
            }
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
}

const menuManager = new MenuManager();
window.menuManager = menuManager; // Export ra window để HTML gọi được