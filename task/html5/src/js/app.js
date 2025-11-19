// Additional application logic

// Utility Functions
const utils = {
    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },
    
    // Debounce function
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
    },
    
    // Local storage helper
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Error saving to localStorage', e);
            }
        },
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from localStorage', e);
                return null;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Error removing from localStorage', e);
            }
        }
    }
};

// Theme Toggle (Optional Enhancement)
class ThemeManager {
    constructor() {
        this.currentTheme = utils.storage.get('theme') || 'light';
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        utils.storage.set('theme', theme);
        this.currentTheme = theme;
    }
    
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
}

// Analytics Mock (for demonstration)
class Analytics {
    static trackEvent(category, action, label) {
        console.log(`📊 Analytics: ${category} - ${action} - ${label}`);
        // In production, this would send to actual analytics service
    }
    
    static trackPageView(page) {
        console.log(`📄 Page View: ${page}`);
    }
}

// Performance Monitoring
class PerformanceMonitor {
    static logPerformance() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            console.log(`⚡ Page Load Time: ${loadTime}ms`);
        }
    }
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    const themeManager = new ThemeManager();
    
    // Track page view
    Analytics.trackPageView(window.location.pathname);
    
    // Log performance
    window.addEventListener('load', () => {
        PerformanceMonitor.logPerformance();
    });
    
    // Add click tracking to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnText = e.target.textContent.trim();
            Analytics.trackEvent('Button', 'Click', btnText);
        });
    });
});

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { utils, ThemeManager, Analytics, PerformanceMonitor };
}



