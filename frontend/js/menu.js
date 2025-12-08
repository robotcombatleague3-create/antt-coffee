class MenuManager {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/menu'; // URL API Backend
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadMenuFromAPI();
            this.checkLoginStatus();
        });
    }

    // 1. Gọi API lấy dữ liệu món ăn
    async loadMenuFromAPI() {
        try {
            const response = await fetch(this.apiUrl);
            const res = await response.json();

            if (res.success) {
                this.renderMenu(res.data);
            } else {
                console.error("Lỗi lấy menu:", res.message);
            }
        } catch (error) {
            console.error("Lỗi kết nối server:", error);
            // Fallback: Nếu lỗi server thì không làm gì hoặc hiện thông báo
        }
    }

    // 2. Vẽ lại giao diện Menu
    renderMenu(products) {
        // Xóa nội dung cũ của các Tab
        const containers = {
            'Cà phê': document.querySelector('#v-pills-0 .row'),
            'Trà': document.querySelector('#v-pills-1 .row'), // Map với Cate_name trong DB
            'Món ăn': document.querySelector('#v-pills-2 .row'),
            'Tráng miệng': document.querySelector('#v-pills-3 .row')
        };

        // Reset container
        for (let key in containers) {
            if (containers[key]) containers[key].innerHTML = ''; 
        }

        // Duyệt qua từng món và chèn vào đúng Tab
        products.forEach(p => {
            // Xử lý ảnh: Nếu là đường dẫn tương đối thì thêm domain backend
            let imgUrl = p.image || 'images/menu-1.jpg';
            if (imgUrl.startsWith('/')) {
                imgUrl = 'http://localhost:3000' + imgUrl;
            }

            // Map Category từ DB sang Tab (Cần khớp tên trong Database)
            let targetContainer = null;
            const cateName = p.category ? p.category.toLowerCase() : '';

            if (cateName.includes('cà phê') || cateName.includes('coffee')) targetContainer = containers['Cà phê'];
            else if (cateName.includes('trà') || cateName.includes('tea') || cateName.includes('nước')) targetContainer = containers['Trà'];
            else if (cateName.includes('món') || cateName.includes('food') || cateName.includes('dish')) targetContainer = containers['Món ăn'];
            else targetContainer = containers['Tráng miệng']; // Mặc định hoặc món khác

            if (targetContainer) {
                const html = `
                <div class="col-md-6 col-lg-4 ftco-animate fadeInUp ftco-animated">
                    <div class="menu-entry">
                        <a href="detail.html?name=${encodeURIComponent(p.name)}&price=${p.price}&img=${encodeURIComponent(imgUrl)}" 
                           class="img" style="background-image: url(${imgUrl});"></a>
                        <div class="text text-center pt-4">
                            <h3><a href="detail.html?name=${encodeURIComponent(p.name)}&price=${p.price}&img=${encodeURIComponent(imgUrl)}">${p.name}</a></h3>
                            <p class="price"><span>${parseFloat(p.price).toLocaleString()} đ</span></p>
                            <p>
                                <a href="#" class="btn btn-primary btn-outline-primary btn-add-to-cart" 
                                   onclick="addToCart('${p.name}', ${p.price}); return false;">
                                   Thêm vào giỏ
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`;
                targetContainer.insertAdjacentHTML('beforeend', html);
            }
        });

        // Cập nhật lại trạng thái nút Add to Cart (ẩn/hiện theo login)
        this.checkLoginStatus();
    }

    checkLoginStatus() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
        const cartNav = document.getElementById('cartNav');

        if (currentUser) {
            addToCartButtons.forEach(btn => btn.style.display = 'inline-block');
            if(cartNav) cartNav.style.display = 'block';
            this.updateCartCount(currentUser.username);
        } else {
            addToCartButtons.forEach(btn => btn.style.display = 'none');
            if(cartNav) cartNav.style.display = 'none';
        }
    }

    updateCartCount(username) {
        const cartData = JSON.parse(localStorage.getItem('carts')) || {};
        const userCart = cartData[username] || [];
        const totalItems = userCart.reduce((sum, item) => sum + item.quantity, 0);
        const countEl = document.getElementById('cartCount');
        if(countEl) countEl.textContent = totalItems;
    }
}

// Khởi tạo
const menuManager = new MenuManager();