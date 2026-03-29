/**
 * Taxgini Smart Device Orchestrator (Optimize.js)
 * Dynamically manages layout, typography, and responsiveness.
 */

const Optimize = {
    breakpoints: {
        mobile: 640,
        tablet: 1024,
        desktop: 1280
    },

    init() {
        this.updateDeviceClasses();
        this.detectTouch();
        this.sanitizeLayout();
        this.setupScrollListener();
        
        window.addEventListener('resize', this.debounce(() => {
            this.updateDeviceClasses();
            this.sanitizeLayout();
        }, 150));

        console.log("Taxgini Optimize.js: System Initialized");
    },

    setupScrollListener() {
        const header = document.getElementById('main-header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        });
    },

    updateDeviceClasses() {
        const width = window.innerWidth;
        const body = document.body;

        // Remove old classes
        body.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 'is-narrow');

        if (width < this.breakpoints.mobile) {
            body.classList.add('device-mobile');
        } else if (width < this.breakpoints.tablet) {
            body.classList.add('device-tablet');
        } else {
            body.classList.add('device-desktop');
            // SMART FIX: Force close mobile menu if switching to desktop
            this.forceCloseMobileMenu();
        }

        if (width < 380) {
            body.classList.add('is-narrow'); // Ultra-small phones
        }
    },

    forceCloseMobileMenu() {
        const drawer = document.getElementById('mobileNavDrawer');
        const overlay = document.getElementById('mobileNavOverlay');
        if (drawer && drawer.classList.contains('active')) {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            console.log("Taxgini Optimize.js: Mobile Drawer Force-Closed for Desktop Mode.");
        }
    },

    detectTouch() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.body.classList.add('has-touch');
        }
    },

    /**
     * Prevents "Orphans" in headings and cleans up footer spacing dynamically.
     */
    sanitizeLayout() {
        const headings = document.querySelectorAll('h1, .hero h1');
        headings.forEach(h => {
            const text = h.innerText;
            if (text.includes(' ') && text.length > 15) {
                // Inline-block for the last two words to prevent orphans
                const words = text.split(' ');
                const lastTwo = words.slice(-2).join('&nbsp;');
                h.innerHTML = words.slice(0, -2).join(' ') + ' ' + lastTwo;
            }
        });

        // Smart Footer Grid adjustment if needed beyond CSS
        const footerGrid = document.querySelector('.global-footer-grid');
        if (footerGrid) {
            const width = window.innerWidth;
            if (width < 400) {
                footerGrid.style.textAlign = 'center';
            } else {
                footerGrid.style.textAlign = 'left';
            }
        }
    },

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
};

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Optimize.init());
} else {
    Optimize.init();
}

window.Optimize = Optimize;
export default Optimize;
