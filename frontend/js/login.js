class AuthManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');
        this.bindEvents();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (data.error) {
                this.showError(data.error);
                return;
            }

            if (data.success) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                const userRole = data.user.role;
                console.log("Vai trò người dùng:", userRole);
                if (userRole === 'Admin') { 
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html'; 
                }
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
            console.error('Error:', error);
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }
}

// Khởi tạo AuthManager
const auth = new AuthManager();

// Kiểm tra đăng nhập khi trang load
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        if (currentUser.role === 'admin') {
            window.location.href = 'admin/dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    }
});