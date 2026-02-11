/**
 * Global Authentication Service
 * Handles login, logout, and session persistence across the application
 */

class AuthService {
  constructor() {
    this.tokenKey = 'admin_token';
    this.userKey = 'admin_user';
    this.tokenExpiryKey = 'admin_token_expiry';
    this.isAuthenticated = false;
    this.currentUser = null;
    this.token = null;
    
    this.init();
  }

  init() {
    // Check for existing session on initialization
    this.checkExistingSession();
    
    // Set up token refresh interval
    this.setupTokenRefresh();
    
    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === this.tokenKey) {
        this.checkExistingSession();
      }
    });
    
    // Mark as initialized
    this.initialized = true;
  }

  checkExistingSession() {
    const token = localStorage.getItem(this.tokenKey);
    const user = localStorage.getItem(this.userKey);
    const expiry = localStorage.getItem(this.tokenExpiryKey);

    if (token && user && expiry) {
      const now = new Date().getTime();
      const tokenExpiry = parseInt(expiry);

      if (now < tokenExpiry) {
        // Token is still valid
        this.token = token;
        this.currentUser = JSON.parse(user);
        this.isAuthenticated = true;
        this.updateUI();
        return true;
      } else {
        // Token has expired - clear it
        this.clearSession();
        return false;
      }
    }

    // No tokens found - don't clear anything, just return false
    this.token = null;
    this.currentUser = null;
    this.isAuthenticated = false;
    return false;
  }

  async login(email, password) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user || { email, name: 'Admin User' };

      if (!token) {
        throw new Error('No token received');
      }

      // Set session data
      this.setSession(token, user);
      
      // Update UI
      this.updateUI();
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  setSession(token, user) {
    this.token = token;
    this.currentUser = user;
    this.isAuthenticated = true;

    // Set expiry time (24 hours from now)
    const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);

    // Store in localStorage
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());

    // Dispatch login event
    this.dispatchAuthEvent('login', { user, token });
  }

  logout() {
    this.clearSession();
    this.updateUI();
    
    // Dispatch logout event
    this.dispatchAuthEvent('logout');
    
    // Redirect to login page if on admin page
    if (window.location.pathname.includes('/admin/')) {
      window.location.href = '/admin/dashboard/';
    }
  }

  clearSession() {
    this.token = null;
    this.currentUser = null;
    this.isAuthenticated = false;

    // Clear localStorage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenExpiryKey);
  }

  getAuthHeaders() {
    if (!this.isAuthenticated || !this.token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If we get a 401, the token might be expired
    if (response.status === 401) {
      this.clearSession();
      this.updateUI();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  }

  setupTokenRefresh() {
    // Check token validity every 5 minutes
    setInterval(() => {
      if (this.isAuthenticated) {
        this.checkExistingSession();
      }
    }, 5 * 60 * 1000);
  }

  updateUI() {
    // Update header login/logout button
    this.updateHeaderAuth();
    
    // Update any admin-specific UI elements
    this.updateAdminUI();
    
    // Dispatch auth state change event
    this.dispatchAuthEvent('authStateChange', { 
      isAuthenticated: this.isAuthenticated, 
      user: this.currentUser 
    });
  }

  updateHeaderAuth() {
    const loginBtn = document.querySelector('.login-btn');
    const userMenu = document.querySelector('.user-menu');
    
    if (this.isAuthenticated) {
      // Show user menu, hide login button
      if (loginBtn) {
        loginBtn.style.display = 'none';
      }
      
      // Create or update user menu
      if (!userMenu) {
        this.createUserMenu();
      } else {
        this.updateUserMenu();
      }
    } else {
      // Show login button, hide user menu
      if (loginBtn) {
        loginBtn.style.display = 'block';
      }
      if (userMenu) {
        userMenu.remove();
      }
    }
  }

  createUserMenu() {
    const header = document.querySelector('header');
    if (!header) return;

    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <div class="user-info">
        <span class="user-name">${this.currentUser.name || this.currentUser.email}</span>
        <button class="logout-btn" title="Logout">🚪</button>
      </div>
    `;

    // Add logout event listener
    const logoutBtn = userMenu.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', () => this.logout());

    // Insert after login button
    const loginBtn = header.querySelector('.login-btn');
    if (loginBtn) {
      loginBtn.parentNode.insertBefore(userMenu, loginBtn.nextSibling);
    } else {
      header.appendChild(userMenu);
    }
  }

  updateUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
      const userName = userMenu.querySelector('.user-name');
      if (userName) {
        userName.textContent = this.currentUser.name || this.currentUser.email;
      }
    }
  }

  updateAdminUI() {
    // Update admin-specific UI elements
    const adminElements = document.querySelectorAll('[data-requires-auth]');
    adminElements.forEach(element => {
      if (this.isAuthenticated) {
        element.style.display = element.dataset.requiresAuth === 'block' ? 'block' : 'flex';
      } else {
        element.style.display = 'none';
      }
    });

    // Update login sections
    const loginSections = document.querySelectorAll('.login-section');
    const adminSections = document.querySelectorAll('.admin-section, .orders-section, .packs-section');
    
    loginSections.forEach(section => {
      section.style.display = this.isAuthenticated ? 'none' : 'block';
    });
    
    adminSections.forEach(section => {
      section.style.display = this.isAuthenticated ? 'block' : 'none';
    });
  }

  dispatchAuthEvent(eventType, data = {}) {
    const event = new CustomEvent('authEvent', {
      detail: { type: eventType, ...data }
    });
    window.dispatchEvent(event);
  }

  // Public methods for other components to use
  isReady() {
    return this.initialized === true;
  }

  isLoggedIn() {
    return this.isAuthenticated;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token;
  }
}

// Create global instance
window.authService = new AuthService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
