/**
 * Taxgini Wallet Module
 * Manages all financial operations: Recharges, Deductions, History, and Stats.
 */

import Storage from './storage.js';

const Wallet = {
    // Current filter state for UI
    filter: 'all',

    // Recharge account
    async recharge(amount, method = 'UPI') {
        if (!amount || amount < 100) throw new Error('Minimum recharge amount is ₹100');

        const user = Storage.getCurrentUser();
        if (!user || user.type !== 'ca') throw new Error('Unauthorized');

        // Update Wallet & Ledger
        const newBalance = (user.wallet || 0) + amount;
        const transaction = {
            id: 'RECH' + Date.now(),
            type: 'credit',
            desc: `Topup (${method})`,
            amount: amount,
            status: 'success',
            date: new Date().toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        };

        const txs = user.transactions || [];
        txs.push(transaction);

        Storage.updateCurrentUser({
            wallet: newBalance,
            transactions: txs
        });

        return { success: true, amount, newBalance };
    },

    // Deduct for lead purchase
    async spend(amount, leadTitle) {
        const user = Storage.getCurrentUser();
        if (!user || (user.wallet || 0) < amount) throw new Error('Insufficient balance');

        const newBalance = user.wallet - amount;
        const transaction = {
            id: 'SPND' + Date.now(),
            type: 'debit',
            desc: `Lead: ${leadTitle}`,
            amount: amount,
            status: 'success',
            date: new Date().toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        };

        const txs = user.transactions || [];
        txs.push(transaction);

        Storage.updateCurrentUser({
            wallet: newBalance,
            transactions: txs
        });

        return { success: true, amount, newBalance };
    },

    // Get Summary Stats
    getStats() {
        const user = Storage.getCurrentUser();
        if (!user) return { balance: 0, added: 0, spent: 0 };

        const txs = user.transactions || [];
        return {
            balance: user.wallet || 0,
            added: txs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
            spent: txs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
            history: txs
        };
    },

    // UI Rendering Logic (Shared across dashboard and wallet page)
    renderLedger(containerId, filter = 'all') {
        const stats = this.getStats();
        let history = stats.history;
        const container = document.getElementById(containerId);
        if (!container) return;

        if (filter !== 'all') {
            history = history.filter(t => t.type === filter);
        }

        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 0; opacity: 0.3;">
                    <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No activity found under ${filter} filter.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = history.slice().reverse().map(tx => `
            <div class="glass-pill transaction-card">
                <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: ${tx.type === 'credit' ? 'rgba(0,200,83,0.1)' : 'rgba(239,68,68,0.1)'}; display: flex; align-items: center; justify-content: center; color: ${tx.type === 'credit' ? 'var(--success)' : '#ef4444'};">
                        <i class="fas fa-${tx.type === 'credit' ? 'plus' : 'minus'}"></i>
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <span style="font-weight: 700; font-size: 1rem;">${tx.desc}</span>
                            <span class="status-badge status-success">Completed</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">ID: ${tx.id} • ${tx.date}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; color: ${tx.type === 'credit' ? 'var(--success)' : 'white'}; font-size: 1.15rem;">
                        ${tx.type === 'credit' ? '+' : '-'}₹${tx.amount.toLocaleString()}
                    </div>
                    <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase;">Closing Balance: ₹${stats.balance.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }
};

export default Wallet;
