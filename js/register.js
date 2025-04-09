document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Đặt lại thông báo lỗi
    document.querySelectorAll('.error').forEach(el => {
        el.style.display = 'none';
    });
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    let isValid = true;
    
    // Xác thực email
    if (!email) {
        showError('emailError', 'Email không được để trống');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('emailError', 'Email không đúng định dạng');
        isValid = false;
    }
    
    // Xác thực mật khẩu
    if (!password) {
        showError('passwordError', 'Mật khẩu không được để trống');
        isValid = false;
    } else if (password.length < 6) {
        showError('passwordError', 'Mật khẩu phải có ít nhất 6 ký tự');
        isValid = false;
    }
    
    // Xác nhận xác thực mật khẩu
    if (!confirmPassword) {
        showError('confirmPasswordError', 'Xác nhận mật khẩu không được để trống');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Mật khẩu xác nhận không khớp');
        isValid = false;
    }
    
    if (isValid) {
        // Lưu dữ liệu người dùng
        const users = JSON.parse(localStorage.getItem('users')) || [];
        users.push({ email, password });
        localStorage.setItem('users', JSON.stringify(users));
        
        // Chuyển hướng đến trang đăng nhập
        window.location.href = 'login.html';
    }
});

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function validateEmail(email) {
   
        return email.includes("@") && (email.endsWith("gmail.com") || email.endsWith("gmail.vn") || email.endsWith("outlook.com") || email.endsWith(".edu"));
   
}
