#!/bin/bash
# KV Garage - Complete Fix Deployment Script
# Save this as deploy-fixes.sh and run: bash deploy-fixes.sh

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       KV GARAGE - APPLYING CRITICAL FIXES                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "src" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the repository root${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo -e "${YELLOW}Step 1: Backing up original files...${NC}"
mkdir -p .backup
cp .eleventy.js .backup/ 2>/dev/null || echo "  No .eleventy.js to backup"
cp netlify.toml .backup/ 2>/dev/null || echo "  No netlify.toml to backup"
cp package.json .backup/ 2>/dev/null || echo "  No package.json to backup"
cp -r src/admin .backup/ 2>/dev/null || echo "  No admin folder to backup"
echo -e "${GREEN}✓ Backup created in .backup/${NC}"
echo ""

echo -e "${YELLOW}Step 2: Creating fixed configuration files...${NC}"

# Create .eleventy.js
cat > .eleventy.js << 'EOF'
module.exports = function(eleventyConfig) {
  // Passthrough copy for assets and data
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_data");
  eleventyConfig.addPassthroughCopy("public/data");
  
  // Watch targets
  eleventyConfig.addWatchTarget("src/assets/");
  eleventyConfig.addWatchTarget("public/data/");

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    pathPrefix: "/",
    permalink: "/{{ page.filePathStem }}/index.html"
  };
};
EOF
echo "  ✓ Created .eleventy.js"

# Create netlify.toml
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "public"

[build.environment]
  NODE_VERSION = "18"

# Admin redirects - ensure trailing slashes
[[redirects]]
  from = "/admin"
  to = "/admin/"
  status = 301
  force = true

[[redirects]]
  from = "/admin/dashboard"
  to = "/admin/dashboard/"
  status = 301
  force = true

[[redirects]]
  from = "/admin/packs"
  to = "/admin/packs/"
  status = 301
  force = true

[[redirects]]
  from = "/admin/orders"
  to = "/admin/orders/"
  status = 301
  force = true

# Handle 404s
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
EOF
echo "  ✓ Created netlify.toml"

# Create _redirects file
mkdir -p public
cat > public/_redirects << 'EOF'
# Admin redirects - ensure trailing slashes
/admin          /admin/         301!
/admin/dashboard /admin/dashboard/ 301!
/admin/packs    /admin/packs/   301!
/admin/orders   /admin/orders/  301!

# SPA fallback for admin routes
/admin/*        /admin/index.html 200

# Contact form success
/contact/success/ /contact/success/ 200

# 404 fallback
/*              /404.html       404
EOF
echo "  ✓ Created public/_redirects"

echo ""
echo -e "${YELLOW}Step 3: Creating admin pages with Netlify forms...${NC}"

# Create admin directory
mkdir -p src/admin

# Admin index (login)
cat > src/admin/index.html << 'EOF'
---
layout: admin-base.html
title: Admin Login
permalink: /admin/
---

<div class="admin-login">
    <div class="login-container">
        <div class="login-box">
            <h1>KV Garage Admin</h1>
            <p class="subtitle">B2B Wholesale Management</p>
            
            <form name="admin-login" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/admin/dashboard/">
                <p class="hidden" style="display: none;">
                    <label>Don't fill this out: <input name="bot-field" /></label>
                </p>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="admin@kvgarage.com">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="••••••••">
                </div>
                
                <button type="submit" class="btn btn-primary">Sign In</button>
                
                <p class="demo-credentials">
                    <small>Demo: admin@kvgarage.com / admin123</small>
                </p>
            </form>
        </div>
    </div>
</div>

<script src="/assets/js/shared-admin-auth.js"></script>
<script src="/assets/js/admin-login.js"></script>
EOF
echo "  ✓ Created src/admin/index.html"

# Admin dashboard
cat > src/admin/dashboard.html << 'EOF'
---
layout: admin-base.html
title: Dashboard
permalink: /admin/dashboard/
---

<div class="admin-dashboard">
    <header class="admin-header">
        <h1>Dashboard</h1>
        <div class="admin-actions">
            <button id="logout-btn" class="btn btn-secondary">Logout</button>
        </div>
    </header>
    
    <nav class="admin-nav">
        <a href="/admin/dashboard/" class="active">Dashboard</a>
        <a href="/admin/packs/">Packs</a>
        <a href="/admin/orders/">Orders</a>
    </nav>
    
    <main class="admin-content">
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Packs</h3>
                <p class="stat-value" id="total-packs">--</p>
            </div>
            <div class="stat-card">
                <h3>Active Orders</h3>
                <p class="stat-value" id="active-orders">--</p>
            </div>
            <div class="stat-card">
                <h3>Revenue</h3>
                <p class="stat-value" id="revenue">--</p>
            </div>
        </div>
        
        <form name="quick-action" method="POST" data-netlify="true" style="display: none;">
            <input type="hidden" name="action-type" value="dashboard-action">
        </form>
    </main>
</div>

<script src="/assets/js/shared-admin-auth.js"></script>
<script src="/assets/js/admin-dashboard.js"></script>
EOF
echo "  ✓ Created src/admin/dashboard.html"

# Admin packs
cat > src/admin/packs.html << 'EOF'
---
layout: admin-base.html
title: Pack Management
permalink: /admin/packs/
---

<div class="admin-dashboard">
    <header class="admin-header">
        <h1>Pack Management</h1>
        <div class="admin-actions">
            <button id="logout-btn" class="btn btn-secondary">Logout</button>
        </div>
    </header>
    
    <nav class="admin-nav">
        <a href="/admin/dashboard/">Dashboard</a>
        <a href="/admin/packs/" class="active">Packs</a>
        <a href="/admin/orders/">Orders</a>
    </nav>
    
    <main class="admin-content">
        <div class="section-header">
            <h2>Manage Packs</h2>
            <button class="btn btn-primary" id="add-pack-btn">Add New Pack</button>
        </div>
        
        <div id="packs-list" class="data-table-container">
            <p>Loading packs...</p>
        </div>
        
        <form name="pack-update" method="POST" data-netlify="true" style="display: none;">
            <input type="hidden" name="pack-id" value="">
            <input type="hidden" name="pack-data" value="">
        </form>
    </main>
</div>

<script src="/assets/js/shared-admin-auth.js"></script>
<script src="/assets/js/admin-packs.js"></script>
EOF
echo "  ✓ Created src/admin/packs.html"

# Admin orders
cat > src/admin/orders.html << 'EOF'
---
layout: admin-base.html
title: Order Management
permalink: /admin/orders/
---

<div class="admin-dashboard">
    <header class="admin-header">
        <h1>Order Management</h1>
        <div class="admin-actions">
            <button id="logout-btn" class="btn btn-secondary">Logout</button>
        </div>
    </header>
    
    <nav class="admin-nav">
        <a href="/admin/dashboard/">Dashboard</a>
        <a href="/admin/packs/">Packs</a>
        <a href="/admin/orders/" class="active">Orders</a>
    </nav>
    
    <main class="admin-content">
        <div class="section-header">
            <h2>Manage Orders</h2>
        </div>
        
        <div id="orders-list" class="data-table-container">
            <p>Loading orders...</p>
        </div>
        
        <form name="order-update" method="POST" data-netlify="true" style="display: none;">
            <input type="hidden" name="order-id" value="">
            <input type="hidden" name="order-status" value="">
        </form>
    </main>
</div>

<script src="/assets/js/shared-admin-auth.js"></script>
<script src="/assets/js/admin-orders.js"></script>
EOF
echo "  ✓ Created src/admin/orders.html"

echo ""
echo -e "${YELLOW}Step 4: Creating admin layout...${NC}"
mkdir -p src/_layouts

cat > src/_layouts/admin-base.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }} | KV Garage Admin</title>
    <link rel="stylesheet" href="/assets/css/admin.css">
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body class="admin-body">
    <div data-netlify-identity-menu></div>
    {{ content }}
    
    <script>
        if (window.netlifyIdentity) {
            window.netlifyIdentity.on("init", user => {
                if (!user) {
                    window.netlifyIdentity.on("login", () => {
                        document.location.href = "/admin/dashboard/";
                    });
                }
            });
        }
    </script>
</body>
</html>
EOF
echo "  ✓ Created src/_layouts/admin-base.html"

echo ""
echo -e "${YELLOW}Step 5: Creating fixed contact page...${NC}"

cat > src/pages/contact.html << 'EOF'
---
layout: base.html
title: Contact Us
permalink: /contact/
---

<section class="contact-hero">
    <h1>Get in Touch</h1>
    <p>We're here to help you succeed with your wholesale business.</p>
</section>

<section class="contact-content">
    <div class="contact-grid">
        <div class="contact-info">
            <h2>Contact Information</h2>
            <div class="info-item">
                <h3>Phone Support</h3>
                <p><a href="tel:616-383-4422">616-383-4422</a></p>
                <p>Mon-Fri 9AM-6PM EST</p>
            </div>
        </div>
        
        <div class="contact-form-container">
            <h2>Send us a Message</h2>
            
            <form name="contact-form" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/contact/success/">
                <p class="hidden" style="display: none;">
                    <label>Don't fill this out: <input name="bot-field" /></label>
                </p>
                
                <div class="form-group">
                    <label for="name">Your Name</label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="subject">Subject</label>
                    <select id="subject" name="subject" required>
                        <option value="">Select...</option>
                        <option value="general">General Inquiry</option>
                        <option value="custom-pack">Custom Pack Request</option>
                        <option value="order-status">Order Status</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="message">Message</label>
                    <textarea id="message" name="message" rows="5" required></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
        </div>
    </div>
</section>
EOF
echo "  ✓ Created src/pages/contact.html"

cat > src/pages/contact-success.html << 'EOF'
---
layout: base.html
title: Message Sent
permalink: /contact/success/
---

<section class="success-page">
    <div class="success-container">
        <h1>Message Sent!</h1>
        <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
        <a href="/" class="btn btn-primary">Return Home</a>
    </div>
</section>
EOF
echo "  ✓ Created src/pages/contact-success.html"

echo ""
echo -e "${YELLOW}Step 6: Creating fixed JavaScript files...${NC}"

cat > src/assets/js/shared-admin-auth.js << 'EOF'
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
EOF
echo "  ✓ Created shared-admin-auth.js"

cat > src/assets/js/admin-login.js << 'EOF'
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
EOF
echo "  ✓ Created admin-login.js"

cat > src/assets/js/admin-dashboard.js << 'EOF'
document.addEventListener('DOMContentLoaded', function() {
    fetch('/data/packs.json')
        .then(response => response.json())
        .then(data => {
            const totalPacks = Array.isArray(data) ? data.length : 0;
            const el = document.getElementById('total-packs');
            if (el) el.textContent = totalPacks;
        })
        .catch(err => {
            console.error('Error loading packs:', err);
            const el = document.getElementById('total-packs');
            if (el) el.textContent = 'Error';
        });
    
    const ordersEl = document.getElementById('active-orders');
    const revenueEl = document.getElementById('revenue');
    if (ordersEl) ordersEl.textContent = '0';
    if (revenueEl) revenueEl.textContent = '$0';
});
EOF
echo "  ✓ Created admin-dashboard.js"

cat > src/assets/js/admin-packs.js << 'EOF'
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('packs-list');
    if (!container) return;
    
    fetch('/data/packs.json')
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<p>No packs found.</p>';
                return;
            }
            
            let html = '<table class="data-table"><thead><tr>';
            html += '<th>Name</th><th>Price</th><th>Units</th><th>Status</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            
            data.forEach(pack => {
                html += `<tr>
                    <td>${pack.name || 'Unnamed'}</td>
                    <td>$${pack.price || 0}</td>
                    <td>${pack.units || 0}</td>
                    <td><span class="status-badge active">Active</span></td>
                    <td>
                        <button class="btn btn-small" onclick="editPack('${pack.id}')">Edit</button>
                    </td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        })
        .catch(err => {
            console.error('Error:', err);
            container.innerHTML = '<p class="error">Error loading packs.</p>';
        });
    
    window.editPack = function(id) {
        alert('Edit pack: ' + id);
    };
});
EOF
echo "  ✓ Created admin-packs.js"

cat > src/assets/js/admin-orders.js << 'EOF'
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    container.innerHTML = '<p>No orders found. Orders will appear here when customers make purchases.</p>';
});
EOF
echo "  ✓ Created admin-orders.js"

echo ""
echo -e "${YELLOW}Step 7: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${YELLOW}Step 8: Building site...${NC}"
npm run build
echo -e "${GREEN}✓ Build completed${NC}"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              FIXES APPLIED SUCCESSFULLY!                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Review changes: git status"
echo "2. Commit: git add -A && git commit -m 'Fix admin pages and Netlify forms'"
echo "3. Push: git push origin main"
echo "4. Netlify will auto-deploy"
echo ""
echo -e "${YELLOW}Verification URLs:${NC}"
echo "  • https://quiet-tarsier-db89fb.netlify.app/admin/"
echo "  • https://quiet-tarsier-db89fb.netlify.app/contact/"
echo ""
echo -e "${YELLOW}Check Netlify Dashboard:${NC}"
echo "  Forms should appear after deployment at:"
echo "  https://app.netlify.com/sites/quiet-tarsier-db89fb/forms"
echo ""
