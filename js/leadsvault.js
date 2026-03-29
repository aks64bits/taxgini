/**
 * Taxgini LeadsVault Module
 * Handles UI rendering and marketplace logic for leads
 */

import Taxgini from './function.js';
import Storage from './storage.js';

const LeadsVault = {
    // Current filter state
    filters: {
        category: 'all',
        budget: 'all',
        search: ''
    },

    // Catch a new lead from client
    postLead(formData) {
        try {
            const user = Storage.getCurrentUser();
            if (!user || user.type !== 'client') throw new Error('Unauthorized');

            const result = Storage.addLead(formData);
            return { success: true, lead: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Render available leads for CA
    renderMarketplace(containerId, filters = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let leads = Storage.getAvailableLeads();

        // Apply filters
        if (filters.category && filters.category !== 'all') {
            leads = leads.filter(l => l.category === filters.category);
        }
        if (filters.search) {
            const term = filters.search.toLowerCase();
            leads = leads.filter(l => 
                l.serviceType.toLowerCase().includes(term) || 
                l.description.toLowerCase().includes(term)
            );
        }

        container.innerHTML = leads.map(lead => this.createLeadCard(lead)).join('') || 
            '<div class="glass" style="padding: 3rem; text-align: center; grid-column: 1/-1; color: var(--text-secondary);">No matching leads found. Check back later!</div>';
        
        this.attachPurchaseListeners();
    },

    createLeadCard(lead) {
        return `
            <div class="glass lead-card fade-in" style="padding: 1.5rem; display: block; border-top: 4px solid var(--secondary);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
                    <div>
                        <span class="lead-badge" style="background: rgba(255,193,7,0.1); color: var(--secondary);">NEW OPPORTUNITY</span>
                        <h4 style="margin-top: 0.5rem; font-size: 1.1rem;">${lead.serviceType}</h4>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            <i class="far fa-clock"></i> Posted ${this.formatTime(lead.createdAt)}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <button class="btn btn-primary purchase-btn" data-id="${lead.id}" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                            Unlock for ₹500
                        </button>
                    </div>
                </div>
                
                <div style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 1rem; opacity: 0.9;">
                    ${lead.description}
                </div>

                <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-secondary); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                    <span><i class="fas fa-wallet" style="color: var(--secondary);"></i> Budget: <strong>${lead.budget}</strong></span>
                    <span><i class="fas fa-map-marker-alt" style="color: var(--secondary);"></i> India</span>
                    <span style="filter: blur(3px); opacity: 0.5;"><i class="fas fa-phone"></i> +91 XXXXX XXXXX</span>
                </div>
            </div>
        `;
    },

    attachPurchaseListeners() {
        document.querySelectorAll('.purchase-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const user = Storage.getCurrentUser();
                
                if (!user || user.wallet < 500) {
                    Taxgini.notify('Insufficient balance. Please top up your wallet.', 'error');
                    return;
                }

                Taxgini.modal({
                    title: 'Unlock Lead?',
                    message: 'Unlock this lead for ₹500? Contact details will be instantly visible in My Cabinet.',
                    onConfirm: () => {
                        const result = Storage.purchaseLead(id);
                        if (result.success) {
                            Taxgini.notify('Lead successfully unlocked!', 'success');
                            setTimeout(() => location.reload(), 2000);
                        } else {
                            Taxgini.notify(result.message, 'error');
                        }
                    }
                });
            };
        });
    },

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    }
};

export default LeadsVault;
