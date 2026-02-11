/**
 * Mobile Navigation System
 * Handles mobile menu, touch interactions, and responsive navigation
 */

class MobileNavigation {
    constructor() {
        this.isMenuOpen = false;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.init();
    }

    init() {
        this.createMobileMenu();
        this.bindEvents();
        this.setupTouchGestures();
        this.setupSwipeGestures();
    }

    createMobileMenu() {
        // Create mobile menu toggle button
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
        menuToggle.setAttribute('aria-label', 'Toggle mobile menu');
        menuToggle.setAttribute('aria-expanded', 'false');

        // Create mobile menu overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';

        // Add to page
        document.body.appendChild(menuToggle);
        document.body.appendChild(overlay);

        // Store references
        this.menuToggle = menuToggle;
        this.overlay = overlay;
        this.navbar = document.getElementById('navbar-menu');
    }

    bindEvents() {
        // Menu toggle
        this.menuToggle.addEventListener('click', () => this.toggleMenu());

        // Overlay click to close
        this.overlay.addEventListener('click', () => this.closeMenu());

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Handle navigation clicks
        if (this.navbar) {
            this.navbar.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && this.isMenuOpen) {
                    // Close menu after navigation
                    setTimeout(() => this.closeMenu(), 100);
                }
            });
        }
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isMenuOpen = true;
        this.navbar.classList.add('active');
        this.overlay.classList.add('active');
        this.menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';

        // Update menu icon
        this.menuToggle.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;

        // Focus management
        const firstLink = this.navbar.querySelector('a');
        if (firstLink) {
            firstLink.focus();
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.navbar.classList.remove('active');
        this.overlay.classList.remove('active');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';

        // Update menu icon
        this.menuToggle.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;

        // Return focus to menu toggle
        this.menuToggle.focus();
    }

    setupTouchGestures() {
        // Handle touch events for better mobile interaction
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.isMenuOpen) return;

            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const deltaY = touchY - this.touchStartY;
            const deltaX = touchX - this.touchStartX;

            // Close menu if swiping down or right
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 50) {
                this.closeMenu();
            } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                this.closeMenu();
            }
        }, { passive: true });
    }

    setupSwipeGestures() {
        // Add swipe gestures for pack cards
        const packCards = document.querySelectorAll('.pack-card');
        packCards.forEach(card => {
            let startX = 0;
            let startY = 0;
            let isSwipe = false;

            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipe = false;
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                if (diffX > diffY && diffX > 10) {
                    isSwipe = true;
                    e.preventDefault();
                }
            }, { passive: false });

            card.addEventListener('touchend', (e) => {
                if (!isSwipe) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;

                if (Math.abs(diffX) > 50) {
                    // Swipe detected - could add swipe actions here
                    card.style.transform = `translateX(${diffX > 0 ? '100%' : '-100%'})`;
                    setTimeout(() => {
                        card.style.transform = '';
                    }, 300);
                }

                startX = 0;
                startY = 0;
                isSwipe = false;
            }, { passive: true });
        });
    }

    // Utility methods
    isMobile() {
        return window.innerWidth <= 768;
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Cleanup
    destroy() {
        if (this.menuToggle) {
            this.menuToggle.remove();
        }
        if (this.overlay) {
            this.overlay.remove();
        }
    }
}

// Initialize mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768 || 'ontouchstart' in window) {
        window.mobileNavigation = new MobileNavigation();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && !window.mobileNavigation) {
        window.mobileNavigation = new MobileNavigation();
    } else if (window.innerWidth > 768 && window.mobileNavigation) {
        window.mobileNavigation.destroy();
        window.mobileNavigation = null;
    }
});

// Export for use in other modules
// Export removed - using as regular script
