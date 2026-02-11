/**
 * Performance Optimization System
 * Handles lazy loading, image optimization, and performance monitoring
 */

class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.imageCache = new Map();
        this.apiCache = new Map();
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupAPICaching();
        this.setupPerformanceMonitoring();
        this.setupPreloading();
    }

    // Lazy Loading Implementation
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            // Lazy load images
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observe all images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });

            // Lazy load sections
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('loaded');
                        sectionObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '100px 0px',
                threshold: 0.1
            });

            // Observe sections for lazy loading
            document.querySelectorAll('.lazy-section').forEach(section => {
                sectionObserver.observe(section);
            });

            this.observers.set('images', imageObserver);
            this.observers.set('sections', sectionObserver);
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (src && !this.imageCache.has(src)) {
            const image = new Image();
            image.onload = () => {
                img.src = src;
                img.classList.add('loaded');
                this.imageCache.set(src, true);
            };
            image.onerror = () => {
                img.src = '/images/placeholder.jpg';
                img.classList.add('error');
            };
            image.src = src;
        } else if (this.imageCache.has(src)) {
            img.src = src;
            img.classList.add('loaded');
        }
    }

    // Image Optimization
    setupImageOptimization() {
        // WebP support detection
        const supportsWebP = this.checkWebPSupport();
        
        // Optimize existing images
        document.querySelectorAll('img').forEach(img => {
            this.optimizeImage(img, supportsWebP);
        });

        // Optimize dynamically added images
        const imageObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'IMG') {
                            this.optimizeImage(node, supportsWebP);
                        }
                        node.querySelectorAll('img').forEach(img => {
                            this.optimizeImage(img, supportsWebP);
                        });
                    }
                });
            });
        });

        imageObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    checkWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    optimizeImage(img, supportsWebP) {
        if (!img.src || img.dataset.optimized) return;

        // Add loading state
        img.classList.add('loading');
        
        // Set optimized flag
        img.dataset.optimized = 'true';

        // Add error handling
        img.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('error');
            img.src = '/images/placeholder.jpg';
        };

        img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
        };
    }

    // API Caching System
    setupAPICaching() {
        const cacheTimeout = 5 * 60 * 1000; // 5 minutes

        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const cacheKey = `${url}-${JSON.stringify(options)}`;
            
            // Check cache for GET requests
            if (!options.method || options.method === 'GET') {
                const cached = this.apiCache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < cacheTimeout) {
                    return new Response(JSON.stringify(cached.data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            try {
                const response = await originalFetch(url, options);
                
                // Cache successful GET responses
                if (response.ok && (!options.method || options.method === 'GET')) {
                    const data = await response.clone().json();
                    this.apiCache.set(cacheKey, {
                        data,
                        timestamp: Date.now()
                    });
                }

                return response;
            } catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        };
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        // Core Web Vitals monitoring
        this.monitorCoreWebVitals();
        
        // Resource timing
        this.monitorResourceTiming();
        
        // User interactions
        this.monitorUserInteractions();
    }

    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.reportMetric('LCP', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.reportMetric('FID', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.reportMetric('CLS', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    monitorResourceTiming() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 1000) { // Log slow resources
                        console.warn('Slow resource:', entry.name, entry.duration + 'ms');
                    }
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
    }

    monitorUserInteractions() {
        let interactionCount = 0;
        const startTime = Date.now();

        ['click', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++;
                
                // Report interaction metrics after 30 seconds
                if (Date.now() - startTime > 30000) {
                    this.reportMetric('interactions', interactionCount);
                }
            }, { passive: true });
        });
    }

    reportMetric(name, value) {
        // In production, send to analytics service
        
        // Store locally for debugging
        const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '{}');
        metrics[name] = value;
        localStorage.setItem('performance_metrics', JSON.stringify(metrics));
    }

    // Preloading System
    setupPreloading() {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Preload on hover
        this.setupHoverPreloading();
        
        // Preload next page
        this.setupNextPagePreloading();
    }

    preloadCriticalResources() {
        const criticalResources = [
            '/css/critical.css',
            '/css/root.css',
            '/css/local.css'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    setupHoverPreloading() {
        // Preload pack details on hover
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href*="/packs/"]');
            if (link && !link.dataset.preloaded) {
                const href = link.getAttribute('href');
                if (href && href !== window.location.pathname) {
                    this.preloadPage(href);
                    link.dataset.preloaded = 'true';
                }
            }
        });
    }

    setupNextPagePreloading() {
        // Preload next page in pagination
        const nextPageLink = document.querySelector('.pagination .next');
        if (nextPageLink) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const href = nextPageLink.getAttribute('href');
                        if (href) {
                            this.preloadPage(href);
                        }
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(nextPageLink);
        }
    }

    preloadPage(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Cleanup
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.imageCache.clear();
        this.apiCache.clear();
    }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// Export for use in other modules
// Export removed - using as regular script
