document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Reset errors
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
            // Logic đăng ký giả lập (Mock)
            // Lấy danh sách users từ localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];

            // Kiểm tra trùng username
            if (users.some(u => u.username === username)) {
                document.getElementById('usernameError').textContent = 'Tên đăng nhập đã tồn tại';
                return;
            }

            // Tạo user mới
            const newUser = {
                username: username,
                email: email,
                password: password,
                role: 'customer' // Mặc định là khách hàng
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            window.location.href = 'login.html';
        }
    });
});