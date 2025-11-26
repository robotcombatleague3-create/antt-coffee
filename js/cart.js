// Khởi tạo giỏ hàng trong localStorage nếu chưa có
if (!localStorage.getItem('cart')) {
    localStorage.setItem('cart', JSON.stringify([]));
}

class CartManager {
    constructor() {
        this.cartItems = [];
        this.loadCart();
    }

    loadCart() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            const cartData = localStorage.getItem(`cart_${user.username}`);
            this.cartItems = cartData ? JSON.parse(cartData) : [];
            this.updateCartDisplay();
        }
    }

    addToCart(product) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const existingItem = this.cartItems.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cartItems.push({...product, quantity: 1});
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Item added to cart');
    }

    saveCart() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        localStorage.setItem(`cart_${user.username}`, JSON.stringify(this.cartItems));
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }

    getCartTotal() {
        return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    clearCart() {
        this.cartItems = [];
        this.saveCart();
        this.updateCartDisplay();
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Thêm style cho animation thông báo
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Cập nhật số lượng khi trang load
document.addEventListener('DOMContentLoaded', () => {
    cartManager.updateCartDisplay();
});

function addToCart(productName, price) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const cartData = JSON.parse(localStorage.getItem('carts')) || {};
    const userCart = cartData[currentUser.username] || [];
    
    // Check if item already exists in cart
    const existingItem = userCart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        userCart.push({
            name: productName,
            price: price,
            quantity: 1
        });
    }

    // Update cart in localStorage
    cartData[currentUser.username] = userCart;
    localStorage.setItem('carts', JSON.stringify(cartData));

    // Update cart count
    const totalItems = userCart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;

    // Show success message
    showNotification('Item added to cart!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}