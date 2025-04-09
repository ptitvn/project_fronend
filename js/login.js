document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Đặt lại thông báo lỗi
    document.querySelectorAll('.error').forEach(el => {
        el.style.display = 'none';
    });
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Thu hút người dùng được lưu trữ
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Tìm người dùng phù hợp
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showError('emailError', 'Email hoặc mật khẩu không đúng');
        showError('passwordError', 'Email hoặc mật khẩu không đúng');
        return;
    }
    
    // Lưu trữ phiên người dùng hiện tại
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Đăng nhập thành công - chuyển hướng đến chỉ mục
    window.location.href = 'index.html';
});

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// Kiểm tra xem đã đăng nhập chưa
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && window.location.pathname.endsWith('login.html')) {
        window.location.href = 'index.html';
    }
});