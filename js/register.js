class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.inputs = {
            username: document.getElementById('username'),
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            confirmPassword: document.getElementById('confirmPassword')
        };
        this.errors = {
            username: document.getElementById('usernameError'),
            email: document.getElementById('emailError'),
            password: document.getElementById('passwordError'),
            confirmPassword: document.getElementById('confirmPasswordError')
        };
        this.bindEvents();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleRegister(e));
        // Remove error styling on input
        Object.keys(this.inputs).forEach(key => {
            this.inputs[key].addEventListener('input', () => {
                this.inputs[key].classList.remove('error');
                this.errors[key].style.display = 'none';
            });
        });
    }

    validateForm() {
        let isValid = true;

        // Username validation
        if (this.inputs.username.value.length < 3) {
            this.showError('username', 'Username must be at least 3 characters');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.inputs.email.value)) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (this.inputs.password.value.length < 6) {
            this.showError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        // Confirm password validation
        if (this.inputs.password.value !== this.inputs.confirmPassword.value) {
            this.showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    showError(field, message) {
        this.inputs[field].classList.add('error');
        this.errors[field].textContent = message;
        this.errors[field].style.display = 'block';
    }

    async handleRegister(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        // Create user object
        const user = {
            username: this.inputs.username.value,
            email: this.inputs.email.value,
            password: this.inputs.password.value
        };

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user)
            });

            const data = await response.json();

            if (data.error) {
                if (data.error.includes('Username')) {
                    this.showError('username', data.error);
                } else {
                    alert(data.error);
                }
                return;
            }

            if (data.success) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            }
        } catch (error) {
            alert('Registration failed. Please try again.');
            console.error('Error:', error);
        }
    }
}

// Initialize RegisterManager
const register = new RegisterManager();