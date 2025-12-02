class MenuManager {
    constructor() {
        this.init();
    }

    init() {
        // Check login status when page loads
        document.addEventListener('DOMContentLoaded', () => {
            this.updateMenuButtons();
        });
    }

    updateMenuButtons() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
        const cartNav = document.getElementById('cartNav');

        if (currentUser) {
            // User is logged in - show cart and buttons
            addToCartButtons.forEach(button => {
                button.style.display = 'inline-block';
            });
            cartNav.style.display = 'block';
            this.updateCartCount(currentUser.username);
        } else {
            // User is not logged in - hide cart and buttons
            addToCartButtons.forEach(button => {
                button.style.display = 'none';
            });
            cartNav.style.display = 'none';
        }
    }

    updateCartCount(username) {
        const cartData = JSON.parse(localStorage.getItem('carts')) || {};
        const userCart = cartData[username] || [];
        const totalItems = userCart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartCount').textContent = totalItems;
    }
}

// Initialize MenuManager
const menuManager = new MenuManager();