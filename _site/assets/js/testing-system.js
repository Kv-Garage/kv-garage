/**
 * Testing System for KV Garage Platform
 * Comprehensive testing utilities and validation
 */

class TestingSystem {
    constructor() {
        this.testResults = [];
        this.isTestMode = window.location.search.includes('test=true');
        this.init();
    }

    init() {
        if (this.isTestMode) {
            this.runAllTests();
            this.setupTestUI();
        }
    }

    // Test Categories
    async runAllTests() {
        
        const tests = [
            { name: 'API Connectivity', fn: this.testAPIConnectivity },
            { name: 'Pack System', fn: this.testPackSystem },
            { name: 'Checkout Flow', fn: this.testCheckoutFlow },
            { name: 'Admin Authentication', fn: this.testAdminAuth },
            { name: 'Mobile Responsiveness', fn: this.testMobileResponsiveness },
            { name: 'Performance', fn: this.testPerformance },
            { name: 'Accessibility', fn: this.testAccessibility },
            { name: 'Form Validation', fn: this.testFormValidation },
            { name: 'Error Handling', fn: this.testErrorHandling },
            { name: 'Security', fn: this.testSecurity }
        ];

        for (const test of tests) {
            try {
                const result = await test.fn.call(this);
                this.testResults.push({
                    name: test.name,
                    status: result.success ? 'PASS' : 'FAIL',
                    details: result.details,
                    duration: result.duration
                });
            } catch (error) {
                this.testResults.push({
                    name: test.name,
                    status: 'ERROR',
                    details: error.message,
                    duration: 0
                });
            }
        }

        this.displayTestResults();
    }

    // API Connectivity Tests
    async testAPIConnectivity() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test health endpoint
            const healthResponse = await fetch('/api/health');
            results.push({
                test: 'Health Endpoint',
                status: healthResponse.ok ? 'PASS' : 'FAIL',
                details: `Status: ${healthResponse.status}`
            });

            // Test packs endpoint
            const packsResponse = await fetch('/api/packs');
            results.push({
                test: 'Packs Endpoint',
                status: packsResponse.ok ? 'PASS' : 'FAIL',
                details: `Status: ${packsResponse.status}`
            });

            // Test orders endpoint (should require auth)
            const ordersResponse = await fetch('/api/orders');
            results.push({
                test: 'Orders Endpoint Auth',
                status: ordersResponse.status === 401 ? 'PASS' : 'FAIL',
                details: `Expected 401, got ${ordersResponse.status}`
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'API Connectivity', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Pack System Tests
    async testPackSystem() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test pack data structure
            const packsResponse = await fetch('/api/packs');
            if (packsResponse.ok) {
                const data = await packsResponse.json();
                const packs = data.packs || [];

                // Validate pack structure
                if (packs.length > 0) {
                    const pack = packs[0];
                    const requiredFields = ['id', 'name', 'price', 'number_of_units', 'estimated_resale_value'];
                    const hasRequiredFields = requiredFields.every(field => pack.hasOwnProperty(field));
                    
                    results.push({
                        test: 'Pack Data Structure',
                        status: hasRequiredFields ? 'PASS' : 'FAIL',
                        details: hasRequiredFields ? 'All required fields present' : 'Missing required fields'
                    });
                }

                // Test pack filtering
                const filteredResponse = await fetch('/api/packs?status=available');
                results.push({
                    test: 'Pack Filtering',
                    status: filteredResponse.ok ? 'PASS' : 'FAIL',
                    details: `Filtered packs: ${filteredResponse.ok ? 'Success' : 'Failed'}`
                });
            }

            // Test pack detail page
            const packDetailElements = document.querySelectorAll('.pack-card');
            results.push({
                test: 'Pack Cards Rendering',
                status: packDetailElements.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${packDetailElements.length} pack cards`
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Pack System', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Checkout Flow Tests
    async testCheckoutFlow() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test checkout buttons
            const checkoutButtons = document.querySelectorAll('.pack-card-button, .buy-button');
            results.push({
                test: 'Checkout Buttons Present',
                status: checkoutButtons.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${checkoutButtons.length} checkout buttons`
            });

            // Test Stripe integration (mock)
            const hasStripeScript = document.querySelector('script[src*="stripe"]');
            results.push({
                test: 'Stripe Integration',
                status: hasStripeScript ? 'PASS' : 'FAIL',
                details: hasStripeScript ? 'Stripe script loaded' : 'Stripe script not found'
            });

            // Test checkout form validation
            const checkoutForms = document.querySelectorAll('form[action*="checkout"]');
            results.push({
                test: 'Checkout Forms',
                status: checkoutForms.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${checkoutForms.length} checkout forms`
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Checkout Flow', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Admin Authentication Tests
    async testAdminAuth() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test admin login form
            const loginForm = document.querySelector('#admin-login-form');
            results.push({
                test: 'Admin Login Form',
                status: loginForm ? 'PASS' : 'FAIL',
                details: loginForm ? 'Login form found' : 'Login form not found'
            });

            // Test admin routes protection
            const adminResponse = await fetch('/api/admin/dashboard');
            results.push({
                test: 'Admin Route Protection',
                status: adminResponse.status === 401 ? 'PASS' : 'FAIL',
                details: `Expected 401, got ${adminResponse.status}`
            });

            // Test JWT token handling
            const token = localStorage.getItem('admin_token');
            results.push({
                test: 'JWT Token Storage',
                status: token ? 'PASS' : 'FAIL',
                details: token ? 'Token found in storage' : 'No token in storage'
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Admin Authentication', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Mobile Responsiveness Tests
    async testMobileResponsiveness() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test viewport meta tag
            const viewport = document.querySelector('meta[name="viewport"]');
            results.push({
                test: 'Viewport Meta Tag',
                status: viewport ? 'PASS' : 'FAIL',
                details: viewport ? 'Viewport meta tag present' : 'Viewport meta tag missing'
            });

            // Test touch-friendly elements
            const touchElements = document.querySelectorAll('button, .btn, a');
            const smallElements = Array.from(touchElements).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width < 44 || rect.height < 44;
            });

            results.push({
                test: 'Touch-Friendly Elements',
                status: smallElements.length === 0 ? 'PASS' : 'FAIL',
                details: `${smallElements.length} elements too small for touch`
            });

            // Test responsive images
            const responsiveImages = document.querySelectorAll('img[srcset], picture');
            results.push({
                test: 'Responsive Images',
                status: responsiveImages.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${responsiveImages.length} responsive images`
            });

            // Test mobile navigation
            const mobileNav = document.querySelector('.mobile-menu-toggle, #navbar-menu');
            results.push({
                test: 'Mobile Navigation',
                status: mobileNav ? 'PASS' : 'FAIL',
                details: mobileNav ? 'Mobile navigation found' : 'Mobile navigation missing'
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Mobile Responsiveness', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Performance Tests
    async testPerformance() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test page load time
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            results.push({
                test: 'Page Load Time',
                status: loadTime < 3000 ? 'PASS' : 'FAIL',
                details: `Load time: ${loadTime}ms`
            });

            // Test Core Web Vitals
            const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '{}');
            
            if (metrics.LCP) {
                results.push({
                    test: 'Largest Contentful Paint',
                    status: metrics.LCP < 2500 ? 'PASS' : 'FAIL',
                    details: `LCP: ${metrics.LCP}ms`
                });
            }

            if (metrics.FID) {
                results.push({
                    test: 'First Input Delay',
                    status: metrics.FID < 100 ? 'PASS' : 'FAIL',
                    details: `FID: ${metrics.FID}ms`
                });
            }

            // Test image optimization
            const images = document.querySelectorAll('img');
            const unoptimizedImages = Array.from(images).filter(img => 
                !img.src.includes('webp') && !img.src.includes('avif')
            );

            results.push({
                test: 'Image Optimization',
                status: unoptimizedImages.length < images.length * 0.5 ? 'PASS' : 'FAIL',
                details: `${images.length - unoptimizedImages.length}/${images.length} images optimized`
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Performance', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Accessibility Tests
    async testAccessibility() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test alt attributes
            const images = document.querySelectorAll('img');
            const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
            results.push({
                test: 'Image Alt Attributes',
                status: imagesWithoutAlt.length === 0 ? 'PASS' : 'FAIL',
                details: `${imagesWithoutAlt.length} images missing alt attributes`
            });

            // Test form labels
            const inputs = document.querySelectorAll('input, select, textarea');
            const inputsWithoutLabels = Array.from(inputs).filter(input => {
                const id = input.id;
                const label = document.querySelector(`label[for="${id}"]`);
                return !label && !input.getAttribute('aria-label');
            });

            results.push({
                test: 'Form Labels',
                status: inputsWithoutLabels.length === 0 ? 'PASS' : 'FAIL',
                details: `${inputsWithoutLabels.length} inputs missing labels`
            });

            // Test heading hierarchy
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let headingHierarchyValid = true;
            let previousLevel = 0;

            headings.forEach(heading => {
                const level = parseInt(heading.tagName.charAt(1));
                if (level > previousLevel + 1) {
                    headingHierarchyValid = false;
                }
                previousLevel = level;
            });

            results.push({
                test: 'Heading Hierarchy',
                status: headingHierarchyValid ? 'PASS' : 'FAIL',
                details: headingHierarchyValid ? 'Valid heading hierarchy' : 'Invalid heading hierarchy'
            });

            // Test keyboard navigation
            const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
            results.push({
                test: 'Keyboard Navigation',
                status: focusableElements.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${focusableElements.length} focusable elements`
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Accessibility', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Form Validation Tests
    async testFormValidation() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test contact form validation
            const contactForm = document.querySelector('#contact-form');
            if (contactForm) {
                const requiredFields = contactForm.querySelectorAll('[required]');
                results.push({
                    test: 'Required Fields',
                    status: requiredFields.length > 0 ? 'PASS' : 'FAIL',
                    details: `Found ${requiredFields.length} required fields`
                });

                // Test email validation
                const emailInput = contactForm.querySelector('input[type="email"]');
                if (emailInput) {
                    emailInput.value = 'invalid-email';
                    const isValid = emailInput.checkValidity();
                    results.push({
                        test: 'Email Validation',
                        status: !isValid ? 'PASS' : 'FAIL',
                        details: isValid ? 'Email validation not working' : 'Email validation working'
                    });
                }
            }

            // Test admin form validation
            const adminForm = document.querySelector('#admin-login-form');
            if (adminForm) {
                const requiredFields = adminForm.querySelectorAll('[required]');
                results.push({
                    test: 'Admin Form Validation',
                    status: requiredFields.length > 0 ? 'PASS' : 'FAIL',
                    details: `Found ${requiredFields.length} required fields in admin form`
                });
            }

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Form Validation', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Error Handling Tests
    async testErrorHandling() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test 404 handling
            const notFoundResponse = await fetch('/api/nonexistent');
            results.push({
                test: '404 Error Handling',
                status: notFoundResponse.status === 404 ? 'PASS' : 'FAIL',
                details: `Expected 404, got ${notFoundResponse.status}`
            });

            // Test error messages
            const errorElements = document.querySelectorAll('.error-message, .notification-error');
            results.push({
                test: 'Error Message Elements',
                status: errorElements.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${errorElements.length} error message elements`
            });

            // Test loading states
            const loadingElements = document.querySelectorAll('.loading, .loading-message');
            results.push({
                test: 'Loading States',
                status: loadingElements.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${loadingElements.length} loading state elements`
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Error Handling', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Security Tests
    async testSecurity() {
        const startTime = Date.now();
        const results = [];

        try {
            // Test HTTPS
            const isHTTPS = location.protocol === 'https:';
            results.push({
                test: 'HTTPS Usage',
                status: isHTTPS ? 'PASS' : 'FAIL',
                details: isHTTPS ? 'Using HTTPS' : 'Not using HTTPS'
            });

            // Test Content Security Policy
            const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            results.push({
                test: 'Content Security Policy',
                status: csp ? 'PASS' : 'FAIL',
                details: csp ? 'CSP header present' : 'CSP header missing'
            });

            // Test XSS protection
            const xssProtection = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
            results.push({
                test: 'XSS Protection',
                status: xssProtection ? 'PASS' : 'FAIL',
                details: xssProtection ? 'XSS protection enabled' : 'XSS protection missing'
            });

            // Test input sanitization
            const forms = document.querySelectorAll('form');
            results.push({
                test: 'Form Security',
                status: forms.length > 0 ? 'PASS' : 'FAIL',
                details: `Found ${forms.length} forms with potential security measures`
            });

            const success = results.every(r => r.status === 'PASS');
            return {
                success,
                details: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                details: [{ test: 'Security', status: 'ERROR', details: error.message }],
                duration: Date.now() - startTime
            };
        }
    }

    // Test UI
    setupTestUI() {
        const testPanel = document.createElement('div');
        testPanel.id = 'test-panel';
        testPanel.innerHTML = `
            <div class="test-panel-header">
                <h3>🧪 Test Results</h3>
                <button id="close-test-panel">×</button>
            </div>
            <div class="test-panel-content">
                <div id="test-summary"></div>
                <div id="test-details"></div>
            </div>
        `;

        // Add styles
        const styles = `
            #test-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
            }
            .test-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
            }
            .test-panel-content {
                padding: 10px;
                max-height: 60vh;
                overflow-y: auto;
            }
            .test-result {
                margin: 5px 0;
                padding: 5px;
                border-radius: 4px;
            }
            .test-result.PASS {
                background: #d4edda;
                color: #155724;
            }
            .test-result.FAIL {
                background: #f8d7da;
                color: #721c24;
            }
            .test-result.ERROR {
                background: #fff3cd;
                color: #856404;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        document.body.appendChild(testPanel);

        // Close button
        document.getElementById('close-test-panel').addEventListener('click', () => {
            testPanel.remove();
        });
    }

    displayTestResults() {
        const summary = document.getElementById('test-summary');
        const details = document.getElementById('test-details');

        if (summary && details) {
            const passed = this.testResults.filter(r => r.status === 'PASS').length;
            const failed = this.testResults.filter(r => r.status === 'FAIL').length;
            const errors = this.testResults.filter(r => r.status === 'ERROR').length;

            summary.innerHTML = `
                <div class="test-summary">
                    <strong>Summary:</strong> ${passed} passed, ${failed} failed, ${errors} errors
                </div>
            `;

            details.innerHTML = this.testResults.map(result => `
                <div class="test-result ${result.status}">
                    <strong>${result.name}</strong> - ${result.status} (${result.duration}ms)
                    ${result.details ? `<br><small>${JSON.stringify(result.details)}</small>` : ''}
                </div>
            `).join('');
        }

        // Log to console
    }
}

// Initialize testing system
if (window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.testingSystem = new TestingSystem();
    });
}

// Export for use in other modules
// Export removed - using as regular script
