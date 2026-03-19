const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { kv } = require('@vercel/kv');

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

async function initializeDatabase() {
    const hasInit = await kv.get('db:initialized');
    if (hasInit) return;
    
    const ADMIN_ID = 'admin';
    const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    await kv.hset(`user:${ADMIN_ID}`, {
        id: ADMIN_ID,
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
    });
    
    await kv.sadd(`user:${ADMIN_ID}:websites`, 'ok168.pro', 'ok168.com', 'ok168.net', 'ok168.vip');
    await kv.sadd(`user:${ADMIN_ID}:accounts`, 'admin123', 'user001', 'vip888', 'test123');
    
    const defaultUsers = [
        { username: '1ec168', password: '123456', role: 'user' },
        { username: 'user1', password: '123456', role: 'user' }
    ];
    
    for (const userData of defaultUsers) {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        await kv.hset(`user:${userData.username}`, {
            id: userData.username,
            username: userData.username,
            password: hashedPassword,
            role: userData.role,
            createdAt: new Date().toISOString()
        });
    }
    
    await kv.set('db:initialized', 'true');
}

initializeDatabase();

function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
}

async function createApiKey(userId, expiresIn = 24 * 60 * 60 * 1000) {
    const key = generateApiKey();
    const expiresAt = new Date(Date.now() + expiresIn);
    
    await kv.hset(`apikey:${key}`, {
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
    });
    
    await kv.expire(`apikey:${key}`, 86400);
    return { key, expiresAt };
}

async function validateApiKey(key) {
    const keyData = await kv.hgetall(`apikey:${key}`);
    if (!keyData) return null;
    
    if (new Date() > new Date(keyData.expiresAt)) {
        await kv.del(`apikey:${key}`);
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

const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required' });
    
    const keyData = await validateApiKey(apiKey);
    if (!keyData) return res.status(401).json({ error: 'Invalid or expired API key' });
    
    req.userId = keyData.userId;
    const user = await kv.hgetall(`user:${keyData.userId}`);
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
        
        const existingUser = await kv.hgetall(`user:${username}`);
        if (existingUser && existingUser.username) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await kv.hset(`user:${userId}`, {
            id: userId,
            username,
            password: hashedPassword,
            role: 'user',
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
        
        const user = await kv.hgetall(`user:${username}`);
        if (!user || !user.username) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/generate-key', authenticateToken, async (req, res) => {
    const { key, expiresAt } = await createApiKey(req.user.id);
    res.json({ success: true, apiKey: key, expiresAt, message: 'API key will auto-expire in 24 hours' });
});

app.get('/api/websites', authenticateApiKey, async (req, res) => {
    const websites = await kv.smembers(`user:${req.userId}:websites`) || [];
    res.json({ success: true, websites });
});

app.post('/api/websites', authenticateApiKey, async (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain required' });
    
    const normalizedDomain = domain.toLowerCase().trim();
    await kv.sadd(`user:${req.userId}:websites`, normalizedDomain);
    res.json({ success: true, message: 'Website added', domain: normalizedDomain });
});

app.delete('/api/websites/:domain', authenticateApiKey, async (req, res) => {
    const domain = req.params.domain.toLowerCase();
    await kv.srem(`user:${req.userId}:websites`, domain);
    res.json({ success: true, message: 'Website removed' });
});

app.get('/api/accounts', authenticateApiKey, async (req, res) => {
    const accounts = await kv.smembers(`user:${req.userId}:accounts`) || [];
    res.json({ success: true, accounts });
});

app.post('/api/accounts', authenticateApiKey, async (req, res) => {
    const { account } = req.body;
    if (!account) return res.status(400).json({ error: 'Account required' });
    
    const normalizedAccount = account.toLowerCase().trim();
    await kv.sadd(`user:${req.userId}:accounts`, normalizedAccount);
    res.json({ success: true, message: 'Account added', account: normalizedAccount });
});

app.delete('/api/accounts/:account', authenticateApiKey, async (req, res) => {
    const account = req.params.account.toLowerCase();
    await kv.srem(`user:${req.userId}:accounts`, account);
    res.json({ success: true, message: 'Account removed' });
});

app.post('/api/check-website', authenticateApiKey, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL required' });
        
        const domain = url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').split('?')[0].split('#')[0];
        const myWebsites = await kv.smembers(`user:${req.userId}:websites`) || [];
        const isAllowed = myWebsites.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
        
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
        const myAccounts = await kv.smembers(`user:${req.userId}:accounts`) || [];
        const isAllowed = myAccounts.includes(normalizedAccount);
        
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

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const keys = await kv.keys('user:*');
        const userList = [];
        
        for (const key of keys) {
            if (key.includes(':websites') || key.includes(':accounts')) continue;
            
            const user = await kv.hgetall(key);
            if (user && user.username) {
                const websiteCount = await kv.scard(`user:${user.id}:websites`) || 0;
                const accountCount = await kv.scard(`user:${user.id}:accounts`) || 0;
                
                userList.push({
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    createdAt: user.createdAt,
                    websiteCount,
                    accountCount
                });
            }
        }
        
        res.json({ success: true, users: userList });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load users' });
    }
});

app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'User ID and new password required' });
    
    const user = await kv.hgetall(`user:${userId}`);
    if (!user || !user.username) return res.status(404).json({ error: 'User not found' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await kv.hset(`user:${userId}`, 'password', hashedPassword);
    res.json({ success: true, message: 'Password reset successfully' });
});

app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    if (userId === 'admin') return res.status(400).json({ error: 'Cannot delete admin user' });
    
    await kv.del(`user:${userId}`);
    await kv.del(`user:${userId}:websites`);
    await kv.del(`user:${userId}:accounts`);
    
    const apiKeys = await kv.keys(`apikey:*`);
    for (const key of apiKeys) {
        const keyData = await kv.hgetall(key);
        if (keyData && keyData.userId === userId) {
            await kv.del(key);
        }
    }
    
    res.json({ success: true, message: 'User deleted' });
});

app.get('/api/health', async (req, res) => {
    try {
        const hasInit = await kv.get('db:initialized');
        const adminUser = await kv.hgetall('user:admin');
        const userKeys = await kv.keys('user:*');
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            kvConnected: true,
            dbInitialized: !!hasInit,
            adminExists: !!adminUser,
            totalUserKeys: userKeys.length,
            adminData: adminUser ? {
                username: adminUser.username,
                role: adminUser.role,
                hasPassword: !!adminUser.password
            } : null
        });
    } catch (error) {
        res.json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            kvConnected: false,
            error: error.message
        });
    }
});

app.post('/api/debug/init-admin', async (req, res) => {
    try {
        const ADMIN_ID = 'admin';
        const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@2026!', 10);
        
        await kv.hset(`user:${ADMIN_ID}`, {
            id: ADMIN_ID,
            username: 'admin',
            password: adminPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        
        await kv.sadd(`user:${ADMIN_ID}:websites`, 'ok168.pro', 'ok168.com', 'ok168.net', 'ok168.vip');
        await kv.sadd(`user:${ADMIN_ID}:accounts`, 'admin123', 'user001', 'vip888', 'test123');
        
        const adminUser = await kv.hgetall(`user:${ADMIN_ID}`);
        
        res.json({ 
            success: true, 
            message: 'Admin user initialized',
            admin: {
                username: adminUser.username,
                role: adminUser.role,
                hasPassword: !!adminUser.password
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = app;
