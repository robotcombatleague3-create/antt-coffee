class MenuManager {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/menu';
        this.init();
    }

    init() {
        console.log('MenuManager.init, readyState =', document.readyState);

        const run = () => {
            console.log("MenuManager: Bắt đầu tải menu...");
            this.loadMenuFromAPI();
            this.checkLoginStatus();
        };

        // Nếu DOM chưa load xong thì chờ DOMContentLoaded,
        // còn nếu đã load rồi thì chạy luôn
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    async loadMenuFromAPI() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
            throw new Error('HTTP status ' + response.status);
            }

            const res = await response.json();
            console.log("Raw response từ API /api/menu:", res);

            // Nếu backend trả về mảng [ ... ]
            if (Array.isArray(res)) {
            this.renderMenu(res);
            return;
            }

            // Nếu backend trả về { success, data }
            if (res.success && Array.isArray(res.data)) {
            this.renderMenu(res.data);
            return;
            }

            // Các trường hợp khác
            console.error("Định dạng JSON không đúng kỳ vọng:", res);
        } catch (error) {
            console.error("Lỗi kết nối hoặc parse JSON:", error);
        }
        }

    renderMenu(products) {
        console.log('renderMenu được gọi với', products.length, 'sản phẩm');    

        // Định nghĩa các vị trí Tab
        const containers = {
            'Cà phê': document.querySelector('#v-pills-0 .row'),
            'Trà': document.querySelector('#v-pills-1 .row'),
            'Món ăn': document.querySelector('#v-pills-2 .row'),
            'Tráng miệng': document.querySelector('#v-pills-3 .row')
        };

        // Xóa nội dung cũ
        for (let key in containers) {
            if (containers[key]) containers[key].innerHTML = '';
        }

        products.forEach(p => {
            // --- XỬ LÝ ẢNH QUAN TRỌNG ---
            let imgUrl = p.image || 'images/menu-1.jpg';
            
            // 1. Nếu là ảnh upload từ Admin (bắt đầu bằng /images/) -> Thêm domain backend
            if (imgUrl.startsWith('/')) {
                imgUrl = 'http://localhost:3000' + imgUrl;
            } 
            // 2. Nếu là ảnh mẫu (bắt đầu bằng images/) -> Giữ nguyên để lấy từ frontend
            // (Không cần sửa gì cả)

            // --- PHÂN LOẠI TAB ---
            let targetContainer = null;
            const c = p.category ? p.category.toLowerCase() : '';

            if (c.includes('cà phê') || c.includes('coffee')) targetContainer = containers['Cà phê'];
            else if (c.includes('trà') || c.includes('nước') || c.includes('drink')) targetContainer = containers['Trà'];
            else if (c.includes('món') || c.includes('dish') || c.includes('food')) targetContainer = containers['Món ăn'];
            else targetContainer = containers['Tráng miệng'];

            // --- VẼ HTML (ĐÃ XÓA ftco-animate ĐỂ TRÁNH LỖI TÀNG HÌNH) ---
            if (targetContainer) {
                const html = `
                <div class="col-md-6 col-lg-4"> 
                    <div class="menu-entry">
                        <a href="detail.html?name=${encodeURIComponent(p.name)}&price=${p.price}&img=${encodeURIComponent(imgUrl)}" 
                           class="img" style="background-image: url('${imgUrl}');"></a>
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
        
        // Gọi lại check login để hiện nút thêm giỏ hàng
        this.checkLoginStatus();
    }

    checkLoginStatus() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const btns = document.querySelectorAll('.btn-add-to-cart');
        const cartNav = document.getElementById('cartNav');

        if (currentUser) {
            btns.forEach(b => b.style.display = 'inline-block');
            if(cartNav) cartNav.style.display = 'block';
            
            const cartData = JSON.parse(localStorage.getItem('carts')) || {};
            const userCart = cartData[currentUser.username] || [];
            const total = userCart.reduce((sum, item) => sum + item.quantity, 0);
            const countEl = document.getElementById('cartCount');
            if(countEl) countEl.textContent = total;
        } else {
            // Nếu chưa login thì ẩn nút mua
            btns.forEach(b => b.style.display = 'none');
            if(cartNav) cartNav.style.display = 'none';
        }
    }
}

const menuManager = new MenuManager();