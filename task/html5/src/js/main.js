// Main JavaScript file for HTML5 Static App

// Counter functionality
class Counter {
    constructor() {
        this.count = 0;
        this.display = document.getElementById('counterDisplay');
        this.incrementBtn = document.getElementById('incrementBtn');
        this.decrementBtn = document.getElementById('decrementBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        this.init();
    }
    
    init() {
        if (!this.display) return;
        
        this.incrementBtn?.addEventListener('click', () => this.increment());
        this.decrementBtn?.addEventListener('click', () => this.decrement());
        this.resetBtn?.addEventListener('click', () => this.reset());
    }
    
    increment() {
        this.count++;
        this.updateDisplay();
        this.animateCounter();
    }
    
    decrement() {
        this.count--;
        this.updateDisplay();
        this.animateCounter();
    }
    
    reset() {
        this.count = 0;
        this.updateDisplay();
        this.animateCounter();
    }
    
    updateDisplay() {
        if (this.display) {
            this.display.textContent = this.count;
        }
    }
    
    animateCounter() {
        this.display?.classList.add('pulse');
        setTimeout(() => {
            this.display?.classList.remove('pulse');
        }, 300);
    }
}

// Mobile Navigation Toggle
class Navigation {
    constructor() {
        this.navToggle = document.getElementById('navToggle');
        this.navMenu = document.querySelector('.nav-menu');
        this.init();
    }
    
    init() {
        this.navToggle?.addEventListener('click', () => this.toggleMenu());
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        this.navMenu?.classList.toggle('active');
        this.navToggle?.classList.toggle('active');
    }
    
    closeMenu() {
        this.navMenu?.classList.remove('active');
        this.navToggle?.classList.remove('active');
    }
}

// Smooth Scrolling
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form Handling
function initFormHandling() {
    const form = document.getElementById('contactForm');
    const formResult = document.getElementById('formResult');
    
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Simulate form submission
        formResult.innerHTML = `
            <div class="alert alert-success">
                <strong>Success!</strong> Thank you, ${data.name}! Your message has been received.
            </div>
        `;
        
        form.reset();
        
        // Clear message after 5 seconds
        setTimeout(() => {
            formResult.innerHTML = '';
        }, 5000);
    });
}

// Scroll Animation Observer
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.feature-card, .counter-card').forEach(el => {
        observer.observe(el);
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 HTML5 Static App Initialized');
    
    // Initialize components
    new Counter();
    new Navigation();
    initSmoothScroll();
    initFormHandling();
    initScrollAnimations();
    
    // Button handlers
    document.getElementById('getStartedBtn')?.addEventListener('click', () => {
        document.querySelector('.counter-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
        window.location.href = 'about.html';
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Counter, Navigation };
}



