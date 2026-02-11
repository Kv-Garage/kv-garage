(function() {
    'use strict';
    
    const CONFIG = {
        demoEmail: 'admin@kvgarage.com',
        demoPassword: 'admin123',
        sessionKey: 'kv_garage_admin_session',
        redirectUrl: '/admin/dashboard/',
        loginUrl: '/admin/'
    };
    
    const isLoginPage = window.location.pathname === '/admin/' || 
                        window.location.pathname === '/admin/index.html';
    
    function isAuthenticated() {
        try {
            const session = localStorage.getItem(CONFIG.sessionKey);
            if (!session) return false;
            
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            const sessionAge = now - sessionData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000;
            
            if (sessionAge > maxAge) {
                localStorage.removeItem(CONFIG.sessionKey);
                return false;
            }
            
            return true;
        } catch (e) {
            console.error('Auth check error:', e);
            return false;
        }
    }
    
    function login(email, password) {
        if (email === CONFIG.demoEmail && password === CONFIG.demoPassword) {
            const sessionData = {
                email: email,
                timestamp: new Date().getTime(),
                token: 'demo_' + Math.random().toString(36).substr(2, 9)
            };
            localStorage.setItem(CONFIG.sessionKey, JSON.stringify(sessionData));
            return true;
        }
        return false;
    }
    
    function logout() {
        localStorage.removeItem(CONFIG.sessionKey);
        window.location.href = CONFIG.loginUrl;
    }
    
    function protectRoute() {
        if (!isLoginPage && !isAuthenticated()) {
            window.location.href = CONFIG.loginUrl;
            return false;
        }
        return true;
    }
    
    window.KVGarageAuth = {
        login: login,
        logout: logout,
        isAuthenticated: isAuthenticated,
        protectRoute: protectRoute,
        config: CONFIG
    };
    
    document.addEventListener('DOMContentLoaded', function() {
        if (!isLoginPage) {
            protectRoute();
        }
        
        const logoutBtns = document.querySelectorAll('#logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', logout);
        });
    });
})();
