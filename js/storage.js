/* 
   Taxgini Storage Engine (Demo Version)
   Simulates a lead management system using localStorage
*/

const STORAGE_KEY = 'taxgini_leads';
const CA_KEY = 'taxgini_cas';
const CLIENT_KEY = 'taxgini_clients';
const SESSION_KEY = 'taxgini_current_user';

const Storage = {
    // Initialize with dummy data if empty
    init() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            const dummyLeads = [
                {
                    id: 'L001',
                    clientName: 'Rahul Sharma',
                    clientEmail: 'rahul@example.com',
                    clientPhone: '+91 98765 43210',
                    serviceType: 'GST Filing',
                    category: 'Business',
                    budget: '₹5,000 - ₹10,000',
                    description: 'Looking for continuous GST compliance and filing for a retail chain.',
                    status: 'available',
                    purchasedBy: null,
                    createdAt: new Date(Date.now() - 3600000).toISOString() // 1h ago
                },
                {
                    id: 'L002',
                    clientName: 'Priya Singh',
                    clientEmail: 'priya@example.com',
                    clientPhone: '+91 91234 56789',
                    serviceType: 'Income Tax Return',
                    category: 'Individual',
                    budget: '₹2,000 - ₹5,000',
                    description: 'Need assistance filing ITR-3 for a self-employed professional with multiple income sources.',
                    status: 'available',
                    purchasedBy: null,
                    createdAt: new Date(Date.now() - 7200000).toISOString() // 2h ago
                },
                {
                    id: 'L003',
                    clientName: 'Global Tech Solutions',
                    clientEmail: 'admin@globaltech.com',
                    clientPhone: '+91 88888 77777',
                    serviceType: 'Statutory Audit',
                    category: 'Corporate',
                    budget: '₹30,000 - ₹50,000',
                    description: 'Seeking a licensed CA to conduct the annual statutory audit for our IT services company.',
                    status: 'available',
                    purchasedBy: null,
                    createdAt: new Date(Date.now() - 14400000).toISOString() // 4h ago
                },
                {
                    id: 'L004',
                    clientName: 'Sneha Gupta',
                    clientEmail: 'sneha@startup.in',
                    clientPhone: '+91 70000 11111',
                    serviceType: 'LLP Registration',
                    category: 'Startup',
                    budget: '₹10,000 - ₹15,000',
                    description: 'Need help with the end-to-end registration process for a new LLP in the e-commerce sector.',
                    status: 'available',
                    purchasedBy: null,
                    createdAt: new Date(Date.now() - 86400000).toISOString() // 1d ago
                }
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyLeads));
        }
        if (!localStorage.getItem(CA_KEY)) localStorage.setItem(CA_KEY, JSON.stringify([]));
        if (!localStorage.getItem(CLIENT_KEY)) localStorage.setItem(CLIENT_KEY, JSON.stringify([]));
    },

    // --- User Auth Methods ---
    register(userData) {
        if (!userData.email || !userData.password || !userData.name || !userData.type) {
             return { success: false, message: 'All fields are required' };
        }

        const key = userData.type === 'ca' ? CA_KEY : CLIENT_KEY;
        const users = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, message: 'Email already exists' };
        }
        
        // Initialize CA wallet and license
        if (userData.type === 'ca') {
            userData.wallet = 0; // New CAs start with 0
            userData.transactions = []; // Empty history
            if (!userData.licenseNo) {
                 return { success: false, message: 'License Number is required for CAs' };
            }
        }

        users.push({
            ...userData,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(users));
        return { success: true };
    },

    login(email, password) {
        // Check both "databases"
        const cas = JSON.parse(localStorage.getItem(CA_KEY) || '[]');
        const clients = JSON.parse(localStorage.getItem(CLIENT_KEY) || '[]');
        
        const user = [...cas, ...clients].find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, type: user.type }));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid email or password' };
    },

    logout() {
        localStorage.removeItem(SESSION_KEY);
    },

    resetPassword(email, newPassword) {
        // Check both collections
        let found = false;
        [CA_KEY, CLIENT_KEY].forEach(key => {
            const users = JSON.parse(localStorage.getItem(key) || '[]');
            const index = users.findIndex(u => u.email === email);
            if (index !== -1) {
                users[index].password = newPassword;
                localStorage.setItem(key, JSON.stringify(users));
                found = true;
            }
        });
        
        return found ? { success: true } : { success: false, message: 'User not found' };
    },

    getCurrentUser() {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        
        const { email, type } = JSON.parse(session);
        const key = type === 'ca' ? CA_KEY : CLIENT_KEY;
        const users = JSON.parse(localStorage.getItem(key) || '[]');
        return users.find(u => u.email === email) || null;
    },

    updateCurrentUser(data) {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return false;

        const { email, type } = JSON.parse(session);
        const key = type === 'ca' ? CA_KEY : CLIENT_KEY;
        const users = JSON.parse(localStorage.getItem(key) || '[]');
        const index = users.findIndex(u => u.email === email);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...data };
            localStorage.setItem(key, JSON.stringify(users));
            return true;
        }
        return false;
    },

    // --- Lead Methods ---
    getAllLeads() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    },

    addLead(leadData) {
        const leads = this.getAllLeads();
        const user = this.getCurrentUser();
        const newLead = {
            id: 'L' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
            clientName: user ? user.name : leadData.clientName,
            clientEmail: user ? user.email : leadData.clientEmail,
            clientPhone: user ? user.phone : leadData.clientPhone,
            status: 'available',
            purchasedBy: null,
            createdAt: new Date().toISOString(),
            ...leadData
        };
        leads.unshift(newLead);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        return newLead;
    },

    getAvailableLeads() {
        return this.getAllLeads().filter(l => l.status === 'available');
    },

    getPurchasedLeads() {
        const user = this.getCurrentUser();
        if (!user || user.type !== 'ca') return [];
        return this.getAllLeads().filter(l => l.status === 'purchased' && l.purchasedBy === user.email);
    },

    purchaseLead(leadId) {
        const user = this.getCurrentUser();
        if (!user || user.type !== 'ca') return { success: false, message: 'Only CAs can purchase leads' };

        const leadPrice = 500; // Static price for now
        if ((user.wallet || 0) < leadPrice) {
            return { success: false, message: 'Insufficient wallet balance' };
        }

        const leads = this.getAllLeads();
        const index = leads.findIndex(l => l.id === leadId);
        
        if (index !== -1 && leads[index].status === 'available') {
            leads[index].status = 'purchased';
            leads[index].purchasedBy = user.email;
            leads[index].purchasedAt = new Date().toISOString();
            
            // Deduct from wallet
            this.updateCurrentUser({ wallet: user.wallet - leadPrice });
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
            return { success: true };
        }
        return { success: false, message: 'Lead not available' };
    }
};

Storage.init();
export default Storage;
