document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form[name="admin-login"]');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                alert('Please enter both email and password');
                return;
            }
            
            if (window.KVGarageAuth && window.KVGarageAuth.login(email, password)) {
                window.location.href = '/admin/dashboard/';
            } else {
                alert('Invalid credentials. Try admin@kvgarage.com / admin123');
            }
        });
    }
});
