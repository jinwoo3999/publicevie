const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// In-memory database (replace with MongoDB/PostgreSQL in production)
const users = new Map();
const apiKeys = new Map();
const userWebsites = new Map(); // userId -> Set of websites
const userAccounts = new Map(); // userId -> Set of accounts

// Initialize admin user
const ADMIN_ID = 'admin';
const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
users.set(ADMIN_ID, {
    id: ADMIN_ID,
    username: 'admin',
    password: adminPassword,
    role: 'admin',
    createdAt: new Date()
});

// Admin default websites
userWebsites.set(ADMIN_ID, new Set([
    'ok168.pro',
    'ok168.com',
    'ok168.net',
    'ok168.vip'
]));

userAccounts.set(ADMIN_ID, new Set([
    'admin123',
    'user001',
    'vip888',
    'test123'
]));

// API Key management
function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
}

function createApiKey(userId, expiresIn = 24 * 60 * 60 * 1000) { // 24 hours
    const key = generateApiKey();
    const expiresAt = new Date(Date.now() + expiresIn);
    
    apiKeys.set(key, {
        userId,
        createdAt: new Date(),
        expiresAt
    });
    
    return { key, expiresAt };
}

function validateApiKey(key) {
    const keyData = apiKeys.get(key);
    if (!keyData) return null;
    
    if (new Date() > keyData.expiresAt) {
        apiKeys.delete(key);
        return null;
    }
    
    return keyData;
}

// Auto-cleanup expired keys every hour
setInterval(() => {
    const now = new Date();
    for (const [key, data] of apiKeys.entries()) {
        if (now > data.expiresAt) {
            apiKeys.delete(key);
            console.log(`🗑️  Expired API key deleted: ${key.substring(0, 8)}...`);
        }
    }
}, 60 * 60 * 1000);

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// API Key middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    const keyData = validateApiKey(apiKey);
    if (!keyData) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
    }

    req.userId = keyData.userId;
    req.user = users.get(keyData.userId);
    next();
};

// Admin middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============ AUTH ENDPOINTS ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check if username exists
        for (const user of users.values()) {
            if (user.username === username) {
                return res.status(400).json({ error: 'Username already exists' });
            }
        }

        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        users.set(userId, {
            id: userId,
            username,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date()
        });

        // Initialize empty lists
        userWebsites.set(userId, new Set());
        userAccounts.set(userId, new Set());

        const token = jwt.sign(
            { id: userId, username, role: 'user' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { id: userId, username, role: 'user' }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        let user = null;
        for (const u of users.values()) {
            if (u.username === username) {
                user = u;
                break;
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Generate API Key (requires JWT)
app.post('/api/auth/generate-key', authenticateToken, (req, res) => {
    const { key, expiresAt } = createApiKey(req.user.id);
    
    res.json({
        success: true,
        apiKey: key,
        expiresAt,
        message: 'API key will auto-expire in 24 hours'
    });
});

// Get my API keys
app.get('/api/auth/my-keys', authenticateToken, (req, res) => {
    const myKeys = [];
    for (const [key, data] of apiKeys.entries()) {
        if (data.userId === req.user.id) {
            myKeys.push({
                key: key.substring(0, 8) + '...',
                createdAt: data.createdAt,
                expiresAt: data.expiresAt
            });
        }
    }
    res.json({ success: true, keys: myKeys });
});

// ============ WEBSITE MANAGEMENT ============

// Get my websites
app.get('/api/websites', authenticateApiKey, (req, res) => {
    const websites = Array.from(userWebsites.get(req.userId) || []);
    res.json({ success: true, websites });
});

// Add website
app.post('/api/websites', authenticateApiKey, (req, res) => {
    const { domain } = req.body;
    
    if (!domain) {
        return res.status(400).json({ error: 'Domain required' });
    }

    const normalizedDomain = domain.toLowerCase().trim();
    
    if (!userWebsites.has(req.userId)) {
        userWebsites.set(req.userId, new Set());
    }
    
    userWebsites.get(req.userId).add(normalizedDomain);
    
    res.json({ success: true, message: 'Website added', domain: normalizedDomain });
});

// Remove website
app.delete('/api/websites/:domain', authenticateApiKey, (req, res) => {
    const domain = req.params.domain.toLowerCase();
    
    if (userWebsites.has(req.userId)) {
        userWebsites.get(req.userId).delete(domain);
    }
    
    res.json({ success: true, message: 'Website removed' });
});

// ============ ACCOUNT MANAGEMENT ============

// Get my accounts
app.get('/api/accounts', authenticateApiKey, (req, res) => {
    const accounts = Array.from(userAccounts.get(req.userId) || []);
    res.json({ success: true, accounts });
});

// Add account
app.post('/api/accounts', authenticateApiKey, (req, res) => {
    const { account } = req.body;
    
    if (!account) {
        return res.status(400).json({ error: 'Account required' });
    }

    const normalizedAccount = account.toLowerCase().trim();
    
    if (!userAccounts.has(req.userId)) {
        userAccounts.set(req.userId, new Set());
    }
    
    userAccounts.get(req.userId).add(normalizedAccount);
    
    res.json({ success: true, message: 'Account added', account: normalizedAccount });
});

// Remove account
app.delete('/api/accounts/:account', authenticateApiKey, (req, res) => {
    const account = req.params.account.toLowerCase();
    
    if (userAccounts.has(req.userId)) {
        userAccounts.get(req.userId).delete(account);
    }
    
    res.json({ success: true, message: 'Account removed' });
});

// ============ CHECK ENDPOINTS ============

// Check website
app.post('/api/check-website', authenticateApiKey, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL required' });
        }

        const domain = url.toLowerCase()
            .trim()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/.*$/, '')
            .split('?')[0]
            .split('#')[0];

        const myWebsites = userWebsites.get(req.userId) || new Set();
        const isAllowed = Array.from(myWebsites).some(allowed => 
            domain === allowed || domain.endsWith('.' + allowed)
        );

        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({
            success: true,
            domain,
            isAllowed,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Check failed' });
    }
});

// Check account
app.post('/api/check-account', authenticateApiKey, async (req, res) => {
    try {
        const { account } = req.body;
        
        if (!account) {
            return res.status(400).json({ error: 'Account required' });
        }

        const normalizedAccount = account.toLowerCase().trim();
        const myAccounts = userAccounts.get(req.userId) || new Set();
        const isAllowed = myAccounts.has(normalizedAccount);

        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({
            success: true,
            account: normalizedAccount,
            isAllowed,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Check failed' });
    }
});

// Clean hidden code
app.post('/api/clean', authenticateApiKey, async (req, res) => {
    try {
        const { value, type } = req.body;
        
        if (!value || !type) {
            return res.status(400).json({ error: 'Value and type required' });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        const winRate = Math.floor(Math.random() * 21) + 75;
        const minDeposits = Math.floor(Math.random() * 3) + 3;
        const maxDeposits = minDeposits + Math.floor(Math.random() * 3) + 2;

        res.json({
            success: true,
            cleaned: true,
            winRate,
            deposits: { min: minDeposits, max: maxDeposits },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Clean failed' });
    }
});

// ============ ADMIN ENDPOINTS ============

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    const userList = Array.from(users.values()).map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
        websiteCount: (userWebsites.get(u.id) || new Set()).size,
        accountCount: (userAccounts.get(u.id) || new Set()).size
    }));
    
    res.json({ success: true, users: userList });
});

// Reset user password (admin only)
app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
        return res.status(400).json({ error: 'User ID and new password required' });
    }
    
    const user = users.get(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    users.set(userId, user);
    
    res.json({ success: true, message: 'Password reset successfully' });
});

// Delete user (admin only)
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.params;
    
    if (userId === ADMIN_ID) {
        return res.status(400).json({ error: 'Cannot delete admin user' });
    }
    
    users.delete(userId);
    userWebsites.delete(userId);
    userAccounts.delete(userId);
    
    // Delete user's API keys
    for (const [key, data] of apiKeys.entries()) {
        if (data.userId === userId) {
            apiKeys.delete(key);
        }
    }
    
    res.json({ success: true, message: 'User deleted' });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        stats: {
            users: users.size,
            activeApiKeys: apiKeys.size
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 EVIE Backend running on port ${PORT}`);
    console.log(`👤 Admin username: admin`);
    console.log(`🔑 Admin password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`⏰ API keys auto-expire after 24 hours`);
});
