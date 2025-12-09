const API_URL = 'http://localhost:3000/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Reset thông báo lỗi cũ
        document.querySelectorAll('.text-danger').forEach(el => el.textContent = '');

        let isValid = true;

        if (username.length < 3) {
            document.getElementById('usernameError').textContent = 'Tên đăng nhập phải hơn 3 ký tự';
            isValid = false;
        }

        if (password.length < 6) {
            document.getElementById('passwordError').textContent = 'Mật khẩu phải hơn 6 ký tự';
            isValid = false;
        }

        if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Mật khẩu xác nhận không khớp';
            isValid = false;
        }

        if (isValid) {
            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        email: email
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
                    window.location.href = 'login.html';
                } else {
                    if (data.message.includes('tồn tại')) {
                        document.getElementById('usernameError').textContent = data.message;
                    } else {
                        alert('Lỗi đăng ký: ' + data.message);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Không thể kết nối đến Server. Vui lòng kiểm tra lại Backend.');
            }
        }
    });
});