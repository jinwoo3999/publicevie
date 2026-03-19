const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();

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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// In-memory storage
const users = new Map();
const apiKeys = new Map();

// Initialize default data
function initializeDatabase() {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026!';
    const adminPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    
    users.set('admin', {
        id: 'admin',
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        websites: ['ok168.pro', 'ok168.com', 'ok168.net', 'ok168.vip'],
        accounts: ['admin123', 'user001', 'vip888', 'test123'],
        createdAt: new Date().toISOString()
    });
    
    // Default users
    users.set('1ec168', {
        id: '1ec168',
        username: '1ec168',
        password: bcrypt.hashSync('123456', 10),
        role: 'user',
        websites: [],
        accounts: [],
        createdAt: new Date().toISOString()
    });
    
    users.set('user1', {
        id: 'user1',
        username: 'user1',
        password: bcrypt.hashSync('123456', 10),
        role: 'user',
        websites: [],
        accounts: [],
        createdAt: new Date().toISOString()
    });
}

initializeDatabase();

function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
}

function createApiKey(userId, expiresIn = 24 * 60 * 60 * 1000) {
    const key = generateApiKey();
    const expiresAt = new Date(Date.now() + expiresIn);
    
    apiKeys.set(key, {
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
    });
    
    return { key, expiresAt };
}

function validateApiKey(key) {
    const keyData = apiKeys.get(key);
    if (!keyData) return null;
    
    if (new Date() > new Date(keyData.expiresAt)) {
        apiKeys.delete(key);
        return null;
    }
    
    return keyData;
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required' });
    
    const keyData = validateApiKey(apiKey);
    if (!keyData) return res.status(401).json({ error: 'Invalid or expired API key' });
    
    req.userId = keyData.userId;
    const user = users.get(keyData.userId);
    req.user = user;
    next();
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        
        if (users.has(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        users.set(username, {
            id: userId,
            username,
            password: hashedPassword,
            role: 'user',
            websites: [],
            accounts: [],
            createdAt: new Date().toISOString()
        });
        
        const token = jwt.sign({ id: userId, username, role: 'user' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: userId, username, role: 'user' } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = users.get(username);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/generate-key', authenticateToken, (req, res) => {
    const { key, expiresAt } = createApiKey(req.user.id);
    res.json({ success: true, apiKey: key, expiresAt, message: 'API key will auto-expire in 24 hours' });
});

app.get('/api/websites', authenticateApiKey, (req, res) => {
    const user = users.get(req.userId);
    res.json({ success: true, websites: user.websites || [] });
});

app.post('/api/websites', authenticateApiKey, (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain required' });
    
    const user = users.get(req.userId);
    const normalizedDomain = domain.toLowerCase().trim();
    
    if (!user.websites.includes(normalizedDomain)) {
        user.websites.push(normalizedDomain);
    }
    
    res.json({ success: true, message: 'Website added', domain: normalizedDomain });
});

app.delete('/api/websites/:domain', authenticateApiKey, (req, res) => {
    const domain = req.params.domain.toLowerCase();
    const user = users.get(req.userId);
    
    user.websites = user.websites.filter(w => w !== domain);
    res.json({ success: true, message: 'Website removed' });
});

app.get('/api/accounts', authenticateApiKey, (req, res) => {
    const user = users.get(req.userId);
    res.json({ success: true, accounts: user.accounts || [] });
});

app.post('/api/accounts', authenticateApiKey, (req, res) => {
    const { account } = req.body;
    if (!account) return res.status(400).json({ error: 'Account required' });
    
    const user = users.get(req.userId);
    const normalizedAccount = account.toLowerCase().trim();
    
    if (!user.accounts.includes(normalizedAccount)) {
        user.accounts.push(normalizedAccount);
    }
    
    res.json({ success: true, message: 'Account added', account: normalizedAccount });
});

app.delete('/api/accounts/:account', authenticateApiKey, (req, res) => {
    const account = req.params.account.toLowerCase();
    const user = users.get(req.userId);
    
    user.accounts = user.accounts.filter(a => a !== account);
    res.json({ success: true, message: 'Account removed' });
});

app.post('/api/check-website', authenticateApiKey, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL required' });
        
        const domain = url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').split('?')[0].split('#')[0];
        const user = users.get(req.userId);
        const isAllowed = user.websites.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.json({ success: true, domain, isAllowed, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Check failed' });
    }
});

app.post('/api/check-account', authenticateApiKey, async (req, res) => {
    try {
        const { account } = req.body;
        if (!account) return res.status(400).json({ error: 'Account required' });
        
        const normalizedAccount = account.toLowerCase().trim();
        const user = users.get(req.userId);
        const isAllowed = user.accounts.includes(normalizedAccount);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.json({ success: true, account: normalizedAccount, isAllowed, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Check failed' });
    }
});

app.post('/api/clean', authenticateApiKey, async (req, res) => {
    try {
        const { value, type } = req.body;
        if (!value || !type) return res.status(400).json({ error: 'Value and type required' });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const winRate = Math.floor(Math.random() * 21) + 75;
        const minDeposits = Math.floor(Math.random() * 3) + 3;
        const maxDeposits = minDeposits + Math.floor(Math.random() * 3) + 2;
        
        res.json({ success: true, cleaned: true, winRate, deposits: { min: minDeposits, max: maxDeposits }, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Clean failed' });
    }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    try {
        const userList = Array.from(users.values()).map(user => ({
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            websiteCount: user.websites.length,
            accountCount: user.accounts.length
        }));
        
        res.json({ success: true, users: userList });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load users' });
    }
});

app.post('/api/admin/create-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        
        if (users.has(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        users.set(username, {
            id: userId,
            username,
            password: hashedPassword,
            role: 'user',
            websites: [],
            accounts: [],
            createdAt: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'User created', user: { id: userId, username, role: 'user' } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'User ID and new password required' });
    
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    res.json({ success: true, message: 'Password reset successfully' });
});

app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.params;
    if (userId === 'admin') return res.status(400).json({ error: 'Cannot delete admin user' });
    
    const user = Array.from(users.entries()).find(([, u]) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    users.delete(user[0]);
    
    // Remove associated API keys
    for (const [key, data] of apiKeys.entries()) {
        if (data.userId === userId) {
            apiKeys.delete(key);
        }
    }
    
    res.json({ success: true, message: 'User deleted' });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        storage: 'in-memory',
        users: users.size,
        apiKeys: apiKeys.size
    });
});

module.exports = app;
