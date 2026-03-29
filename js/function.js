/**
 * Taxgini Global Functions
 * Site-wide UI and logic helpers
 */
import Optimize from './optimize.js';

const Taxgini = {
    // Session management
    checkSession() {
        const session = localStorage.getItem('taxgini_current_user');
        if (!session) return null;

        try {
            const parsed = JSON.parse(session);
            // If it's the old full-object format, return it
            if (parsed.name) return parsed;

            // If it's the new email/type format, we need to fetch the full user from the specific collection
            const key = parsed.type === 'ca' ? 'taxgini_cas' : 'taxgini_clients';
            const users = JSON.parse(localStorage.getItem(key) || '[]');
            return users.find(u => u.email === parsed.email) || parsed;
        } catch (e) {
            return null;
        }
    },

    requireAuth(type = null) {
        const user = this.checkSession();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        if (type && user.type !== type) {
            window.location.href = user.type === 'ca' ? 'ca-dashboard.html' : 'client-dashboard.html';
        }
    },

    logout() {
        localStorage.removeItem('taxgini_current_user');
        window.location.href = 'index.html';
    },

    // Premium Notifications (Pop Info Card)
    notify(message, type = 'info') {
        let container = document.getElementById('taxgini-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'taxgini-notifications';
            container.style.cssText = 'position: fixed; top: 1.5rem; right: 1.5rem; z-index: 10000; display: flex; flex-direction: column; gap: 0.75rem; width: 90%; max-width: 350px; pointer-events: none;';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = 'glass notify-card ' + type;
        notification.style.cssText = 'pointer-events: auto; transform: translateX(120%); transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; margin-bottom: 0.5rem;';
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: 'var(--success)',
            error: '#ef4444',
            warning: 'var(--secondary)',
            info: 'var(--secondary)'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: rgba(0,0,0,0.4); border-radius: 1rem; border-left: 4px solid ${colors[type]}; min-width: 280px; backdrop-filter: blur(20px);">
                <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.25rem; margin-top: 0.1rem;"></i>
                <div style="flex: 1; font-size: 0.9rem; font-weight: 500; color: white;">${message}</div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; opacity: 0.5; cursor: pointer; font-size: 1rem; padding: 0.25rem;"><i class="fas fa-times"></i></button>
            </div>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(120%)';
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 500);
            }
        }, 5000);
    },

    // Custom Confirmation / Choice Modal
    modal(options) {
        const { title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', type = 'info' } = options;
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'mobile-overlay active';
        modalOverlay.style.zIndex = '11000';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'glass';
        modalContent.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 11001; padding: 2.5rem; width: 90%; max-width: 450px; text-align: center; border-radius: 2rem; border: 1px solid rgba(255,193,7,0.2); backdrop-filter: blur(40px);';
        
        const icon = type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        modalContent.innerHTML = `
            <div style="width: 70px; height: 70px; background: rgba(251,192,45,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--secondary);">
                <i class="fas ${icon}" style="font-size: 1.75rem;"></i>
            </div>
            <h3 style="margin-bottom: 0.75rem;">${title}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.5;">${message}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <button id="modalCancelBtn" class="btn btn-outline" style="border-radius: 1rem;">${cancelText}</button>
                <button id="modalConfirmBtn" class="btn btn-primary" style="border-radius: 1rem;">${confirmText}</button>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        document.body.appendChild(modalContent);

        const close = () => {
            modalOverlay.remove();
            modalContent.remove();
        };

        document.getElementById('modalCancelBtn').onclick = close;
        document.getElementById('modalConfirmBtn').onclick = () => {
            if (onConfirm) onConfirm();
            close();
        };
        modalOverlay.onclick = close;
    },

    // UI Helpers
    initProfileAvatars() {
        const user = this.checkSession();
        if (user) {
            const avatarElems = document.querySelectorAll('.user-avatar');
            avatarElems.forEach(el => {
                const bg = user.type === 'ca' ? '00c853' : 'fbc02d';
                const color = user.type === 'ca' ? 'fff' : '1a237e';
                el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${bg}&color=${color}`;
            });
        }
    },

    // Mobile Menu
    initMobileMenu() {
        const menuBtn = document.getElementById('mobileMenuBtn');
        const closeBtn = document.getElementById('closeMobileBtn');
        const drawer = document.getElementById('mobileNavDrawer');
        const overlay = document.getElementById('mobileNavOverlay');

        if (menuBtn && drawer && overlay) {
            const toggle = () => {
                const isActive = !drawer.classList.contains('active');
                if (isActive) {
                    drawer.classList.add('active');
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    drawer.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            };
            menuBtn.onclick = toggle;
            overlay.onclick = toggle;
            if (closeBtn) closeBtn.onclick = toggle;
        }
    },

    // Live Clock
    updateClock() {
        const clockElem = document.getElementById('live-clock');
        if (!clockElem) return;

        const now = new Date();
        const options = {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        const timeStr = now.toLocaleDateString('en-IN', options).replace(/,/g, ' |');
        clockElem.innerHTML = `<i class="fas fa-clock" style="margin-right: 0.5rem; color: var(--secondary); opacity: 0.8;"></i> <span>${timeStr}</span>`;
    },

    // Clean URL display script (Masks .html in address bar)
    maskUrl() {
        // Disable masking on local development to prevent Live Server 404 conflicts
        const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
        if (isLocal) return;

        if (window.location.pathname.endsWith('.html')) {
            const cleanUrl = window.location.pathname.replace('.html', '');
            window.history.replaceState(null, '', cleanUrl + window.location.search);
        }
    },

    // Global Dynamic UI
    renderGlobalHeader() {
        const headerContainer = document.getElementById('main-header');
        if (!headerContainer) return;

        const user = this.checkSession();
        let authHtml = '';

        if (user) {
            const dashboardUrl = user.type === 'ca' ? 'ca-dashboard.html' : 'client-dashboard.html';
            const bg = user.type === 'ca' ? '00c853' : 'fbc02d';
            const color = user.type === 'ca' ? 'fff' : '1a237e';
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${bg}&color=${color}`;

            authHtml = `
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <a href="${dashboardUrl}" style="text-decoration: none; display: flex; align-items: center; gap: 0.75rem;">
                        <div style="text-align: right; line-height: 1;">
                            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${user.name.split(' ')[0]}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${user.type.toUpperCase()}</div>
                        </div>
                        <img src="${avatarUrl}" alt="Profile" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--secondary);">
                    </a>
                    <button id="globalLogoutBtn" class="btn btn-outline" style="padding: 0.5rem; width: 38px; height: 38px; min-width: auto; border: 1px solid rgba(255,255,255,0.1);"><i class="fas fa-sign-out-alt"></i></button>
                </div>
            `;
        } else {
            authHtml = `
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <a href="register.html?type=client" class="btn btn-primary">Get Started</a>
                </div>
            `;
        }

        headerContainer.innerHTML = `
            <!-- Modern Top Bar -->
            <div id="header-top-bar" style="background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding: 0.5rem 0;">
                <div class="container" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary); letter-spacing: 0.5px;">
                    <div id="live-clock" style="display: flex; align-items: center; gap: 0.75rem; color: var(--secondary); font-weight: 500;">
                        <i class="fas fa-clock"></i> <span>Initializing...</span>
                    </div>
                    <div class="hide-mobile" style="display: flex; gap: 1.5rem; align-items: center;">
                        <span><i class="fas fa-shield-alt" style="color: var(--success); margin-right: 0.4rem;"></i> ISO 27001 Certified</span>
                        <span style="opacity: 0.2;">|</span>
                        <span><i class="fas fa-headset" style="margin-right: 0.4rem;"></i> 24/7 Support</span>
                    </div>
                </div>
            </div>

            <div class="main-header-content container">
                <div class="logo">
                    <a href="index.html" style="text-decoration: none; display: flex; align-items: center; gap: 0.75rem; color: inherit;">
                        <div class="logo-box" style="width: 38px; height: 38px; background: var(--secondary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary-dark); font-weight: 800; font-size: 1.4rem;">T</div>
                        <span class="logo-text" style="font-size: 1.4rem; font-weight: 700; letter-spacing: -1px;">Taxgini<span style="color: var(--secondary);">.</span></span>
                    </a>
                </div>
                
                <nav id="globalNav" class="hide-mobile" style="display: flex; gap: 1rem; align-items: center;">
                    <a href="services.html" class="header-nav-link glass-pill">Services</a>
                    <a href="marketplace.html" class="header-nav-link glass-pill">Marketplace</a>
                    <a href="about.html" class="header-nav-link glass-pill">About</a>
                </nav>

                <div class="header-actions" style="display: flex; gap: 1rem; align-items: center;">
                    <div id="navAuth" class="hide-mobile">${authHtml}</div>
                    
                    ${user ? `
                        <a href="${user.type === 'ca' ? 'ca-dashboard.html' : 'client-dashboard.html'}" class="show-mobile" style="text-decoration: none;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${user.type === 'ca' ? '00c853' : 'fbc02d'}&color=${user.type === 'ca' ? 'fff' : '1a237e'}" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--secondary);">
                        </a>
                    ` : ''}

                    <button id="mobileMenuBtn" class="btn btn-outline show-mobile" style="padding: 0.5rem; width: 38px; height: 38px; min-width: auto;">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </div>

        `;

        // INJECT MOBILE COMPONENTS INTO BODY (To prevent header clipping/overlap issues)
        if (!document.getElementById('mobileNavDrawer')) {
            const drawerContainer = document.createElement('div');
            drawerContainer.id = 'mobileNavDrawerContainer';
            drawerContainer.innerHTML = `
                <div id="mobileNavOverlay" class="mobile-overlay"></div>
                <div id="mobileNavDrawer" class="mobile-drawer">
                    <div style="padding: 3rem 2rem; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                        <button id="closeMobileBtn" style="position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: white; font-size: 2.5rem; padding: 1rem; cursor: pointer; z-index: 10;"><i class="fas fa-times"></i></button>
                        
                        <div style="margin-bottom: 4rem;">
                            <span style="font-weight: 700; font-size: 1rem; color: var(--secondary); letter-spacing: 2px;">NAVIGATION</span>
                        </div>

                        <nav id="mobileNavLinks" style="display: flex; flex-direction: column; gap: 1.25rem; width: 100%; max-width: 400px;">
                            <a href="index.html" class="nav-item-fullscreen glass-pill">Home</a>
                            
                            ${user && user.type === 'ca' ? `
                                <a href="ca-dashboard.html" class="nav-item-fullscreen glass-pill" style="color: var(--secondary);"><i class="fas fa-chart-pie" style="font-size: 0.5em; margin-right: 0.5rem; vertical-align: middle;"></i> Dashboard</a>
                                <a href="Leads.html" class="nav-item-fullscreen glass-pill"><i class="fas fa-store" style="font-size: 0.5em; margin-right: 0.5rem; vertical-align: middle;"></i> Browse Leads</a>
                                <a href="wallet.html" class="nav-item-fullscreen glass-pill"><i class="fas fa-wallet" style="font-size: 0.5em; margin-right: 0.5rem; vertical-align: middle;"></i> My Wallet</a>
                            ` : ''}

                            ${user && user.type === 'client' ? `
                                <a href="client-dashboard.html" class="nav-item-fullscreen glass-pill" style="color: var(--secondary);"><i class="fas fa-columns" style="font-size: 0.5em; margin-right: 0.5rem; vertical-align: middle;"></i> Dashboard</a>
                                <a href="client-dashboard.html#post" class="nav-item-fullscreen glass-pill"><i class="fas fa-plus-circle" style="font-size: 0.5em; margin-right: 0.5rem; vertical-align: middle;"></i> Post Request</a>
                            ` : ''}

                            <a href="services.html" class="nav-item-fullscreen glass-pill">Services</a>
                            <a href="marketplace.html" class="nav-item-fullscreen glass-pill">Marketplace</a>
                            <a href="about.html" class="nav-item-fullscreen glass-pill">About</a>
                        </nav>

                        <div style="margin-top: 4rem; width: 100%; max-width: 300px;">
                            ${user ? `
                                <div style="margin-bottom: 2rem;">
                                    <div style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 0.5rem;">LOGGED IN AS</div>
                                    <div style="font-weight: 700; font-size: 1.25rem;">${user.name}</div>
                                    <div style="color: var(--secondary); font-size: 0.8rem;">${user.type.toUpperCase()}</div>
                                </div>
                                <a href="${user.type === 'ca' ? 'ca-dashboard.html' : 'client-dashboard.html'}" class="btn btn-primary" style="width: 100%; margin-bottom: 1.5rem; padding: 1.25rem;">Go to Dashboard</a>
                                <button onclick="Taxgini.logout()" class="btn btn-outline" style="width: 100%; color: #ef4444; border-color: rgba(239, 68, 68, 0.2);"><i class="fas fa-sign-out-alt"></i> Logout</button>
                            ` : `
                                <a href="register.html" class="btn btn-primary" style="width: 100%; padding: 1.25rem;">Get Started</a>
                            `}

                            <!-- Support & Trust Signals -->
                            <div style="margin-top: 2.5rem; padding-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.1); width: 100%;">
                                <a href="https://wa.me/918051648462" class="btn btn-outline" style="width: 100%; border-color: var(--secondary); color: var(--secondary); margin-bottom: 1.5rem;">
                                    <i class="fas fa-headset"></i> 24/7 Live Support
                                </a>
                                <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.8rem; color: var(--text-secondary); align-items: center;">
                                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-shield-alt" style="color: var(--success);"></i> ISO 27001 Certified
                                    </span>
                                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-lock" style="color: var(--secondary);"></i> Secure Advisory Ecosystem
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(drawerContainer);
        }

        if (document.getElementById('globalLogoutBtn')) {
            document.getElementById('globalLogoutBtn').addEventListener('click', () => this.logout());
        }

        // Initialize listeners immediately after rendering
        this.initMobileMenu();
    },

    renderGlobalFooter() {
        const footerContainer = document.getElementById('main-footer');
        if (!footerContainer) return;

        // Ensure footer class is applied for styling
        footerContainer.classList.add('footer');

        footerContainer.innerHTML = `
            <div class="container global-footer-container">
                <div class="global-footer-grid">
                    <div class="footer-brand">
                        <div style="width: 44px; height: 44px; background: var(--gradient-gold); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary-dark); font-weight: 800; font-size: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 10px 20px rgba(255, 193, 7, 0.2);">T</div>
                        <span class="logo-text" style="font-size: 1.75rem; display: block; margin-bottom: 1rem;">Taxgini<span style="color: var(--secondary);">.</span></span>
                        <p class="footer-tagline" style="max-width: 320px; font-size: 0.95rem; line-height: 1.6;">The premium marketplace connecting certified accountants with high-quality leads across India.</p>
                    </div>

                    <div class="footer-column">
                        <h4>Services</h4>
                        <ul class="footer-list">
                            <li><a href="services.html">Tax Advisory</a></li>
                            <li><a href="services.html">GST Compliance</a></li>
                            <li><a href="services.html">Audit & Assurance</a></li>
                        </ul>
                    </div>

                    <div class="footer-column">
                        <h4>Platform</h4>
                        <ul class="footer-list">
                            <li><a href="marketplace.html">Marketplace</a></li>
                            <li><a href="about.html">How it Works</a></li>
                            <li><a href="register.html">Become a CA</a></li>
                        </ul>
                    </div>

                    <div class="footer-column">
                        <h4>Legal & Social</h4>
                        <ul class="footer-list" style="margin-bottom: 1.5rem;">
                            <li><a href="privacy.html">Privacy Policy</a></li>
                            <li><a href="terms.html">Terms of Service</a></li>
                        </ul>
                        <div class="social-icons" style="display: flex; gap: 0.75rem;">
                            <a href="#" class="social-pill" style="margin: 0;"><i class="fab fa-twitter"></i></a>
                            <a href="#" class="social-pill" style="margin: 0;"><i class="fab fa-linkedin-in"></i></a>
                            <a href="#" class="social-pill" style="margin: 0;"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>
                </div>

                <div class="footer-bottom" style="text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2.5rem; margin-top: 2rem;">
                    <p style="opacity: 0.6; font-size: 0.9rem;">&copy; 2026 Taxgini Financial Services. All rights reserved.</p>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Smart Optimization
    if (window.Optimize) {
        window.Optimize.init();
    }

    Taxgini.renderGlobalHeader();
    Taxgini.renderGlobalFooter();
    Taxgini.initProfileAvatars();
    Taxgini.initMobileMenu();
    Taxgini.maskUrl();

    // Start Clock
    Taxgini.updateClock();
    setInterval(() => Taxgini.updateClock(), 1000);

    // Globalize
    window.Taxgini = Taxgini;
});

export default Taxgini;
