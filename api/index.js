const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();

// Try to import Vercel KV, fallback to in-memory if not available
let kv = null;
let useKV = false;

try {
    const kvModule = require('@vercel/kv');
    kv = kvModule.kv;
    useKV = true;
    console.log('✅ Vercel KV enabled');
} catch (error) {
    console.log('⚠️ Vercel KV not available, using in-memory storage');
    useKV = false;
}

// In-memory fallback storage
const memoryUsers = new Map();
const memoryApiKeys = new Map();

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

// Database abstraction layer
const db = {
    async getUser(username) {
        if (useKV) {
            try {
                return await kv.hgetall(`user:${username}`);
            } catch (error) {
                console.error('KV getUser error:', error);
                return memoryUsers.get(username);
            }
        }
        return memoryUsers.get(username);
    },
    
    async setUser(username, userData) {
        if (useKV) {
            try {
                await kv.hset(`user:${username}`, userData);
            } catch (error) {
                console.error('KV setUser error:', error);
            }
        }
        memoryUsers.set(username, userData);
    },
    
    async deleteUser(username) {
        if (useKV) {
            try {
                await kv.del(`user:${username}`);
                await kv.del(`user:${username}:websites`);
                await kv.del(`user:${username}:accounts`);
            } catch (error) {
                console.error('KV deleteUser error:', error);
            }
        }
        memoryUsers.delete(username);
    },
    
    async getWebsites(username) {
        if (useKV) {
            try {
                const websites = await kv.smembers(`user:${username}:websites`);
                return websites || [];
            } catch (error) {
                console.error('KV getWebsites error:', error);
                const user = memoryUsers.get(username);
                return user ? user.websites : [];
            }
        }
        const user = memoryUsers.get(username);
        return user ? user.websites : [];
    },
    
    async addWebsite(username, domain) {
        if (useKV) {
            try {
                await kv.sadd(`user:${username}:websites`, domain);
            } catch (error) {
                console.error('KV addWebsite error:', error);
            }
        }
        const user = memoryUsers.get(username);
        if (user && !user.websites.includes(domain)) {
            user.websites.push(domain);
        }
    },
    
    async removeWebsite(username, domain) {
        if (useKV) {
            try {
                await kv.srem(`user:${username}:websites`, domain);
            } catch (error) {
                console.error('KV removeWebsite error:', error);
            }
        }
        const user = memoryUsers.get(username);
        if (user) {
            user.websites = user.websites.filter(w => w !== domain);
        }
    },
    
    async getAccounts(username) {
        if (useKV) {
            try {
                const accounts = await kv.smembers(`user:${username}:accounts`);
                return accounts || [];
            } catch (error) {
                console.error('KV getAccounts error:', error);
                const user = memoryUsers.get(username);
                return user ? user.accounts : [];
            }
        }
        const user = memoryUsers.get(username);
        return user ? user.accounts : [];
    },
    
    async addAccount(username, account) {
        if (useKV) {
            try {
                await kv.sadd(`user:${username}:accounts`, account);
            } catch (error) {
                console.error('KV addAccount error:', error);
            }
        }
        const user = memoryUsers.get(username);
        if (user && !user.accounts.includes(account)) {
            user.accounts.push(account);
        }
    },
    
    async removeAccount(username, account) {
        if (useKV) {
            try {
                await kv.srem(`user:${username}:accounts`, account);
            } catch (error) {
                console.error('KV removeAccount error:', error);
            }
        }
        const user = memoryUsers.get(username);
        if (user) {
            user.accounts = user.accounts.filter(a => a !== account);
        }
    },
    
    async getAllUsers() {
        if (useKV) {
            try {
                const keys = await kv.keys('user:*');
                const users = [];
                
                for (const key of keys) {
                    if (key.includes(':websites') || key.includes(':accounts')) continue;
                    
                    const user = await kv.hgetall(key);
                    if (user && user.username) {
                        const websiteCount = await kv.scard(`${key}:websites`) || 0;
                        const accountCount = await kv.scard(`${key}:accounts`) || 0;
                        
                        users.push({
                            id: user.id,
                            username: user.username,
                            role: user.role,
                            createdAt: user.createdAt,
                            websiteCount,
                            accountCount
                        });
                    }
                }
                
                return users;
            } catch (error) {
                console.error('KV getAllUsers error:', error);
                return Array.from(memoryUsers.values()).map(user => ({
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    createdAt: user.createdAt,
                    websiteCount: user.websites.length,
                    accountCount: user.accounts.length
                }));
            }
        }
        
        return Array.from(memoryUsers.values()).map(user => ({
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            websiteCount: user.websites.length,
            accountCount: user.accounts.length
        }));
    },
    
    async setApiKey(key, data, ttl = 86400) {
        if (useKV) {
            try {
                await kv.hset(`apikey:${key}`, data);
                await kv.expire(`apikey:${key}`, ttl);
            } catch (error) {
                console.error('KV setApiKey error:', error);
            }
        }
        memoryApiKeys.set(key, data);
    },
    
    async getApiKey(key) {
        if (useKV) {
            try {
                return await kv.hgetall(`apikey:${key}`);
            } catch (error) {
                console.error('KV getApiKey error:', error);
                return memoryApiKeys.get(key);
            }
        }
        return memoryApiKeys.get(key);
    },
    
    async deleteApiKey(key) {
        if (useKV) {
            try {
                await kv.del(`apikey:${key}`);
            } catch (error) {
                console.error('KV deleteApiKey error:', error);
            }
        }
        memoryApiKeys.delete(key);
    }
};

// Initialize default data
async function initializeDatabase() {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026!';
    const adminPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    
    const adminData = {
        id: 'admin',
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
    };
    
    await db.setUser('admin', adminData);
    
    // Set default websites and accounts for admin
    if (useKV) {
        try {
            await kv.sadd('user:admin:websites', 'ok168.pro', 'ok168.com', 'ok168.net', 'ok168.vip');
            await kv.sadd('user:admin:accounts', 'admin123', 'user001', 'vip888', 'test123');
        } catch (error) {
            console.error('KV init error:', error);
        }
    }
    
    // Also set in memory
    memoryUsers.set('admin', {
        ...adminData,
        websites: ['ok168.pro', 'ok168.com', 'ok168.net', 'ok168.vip'],
        accounts: ['admin123', 'user001', 'vip888', 'test123']
    });
    
    // Default users
    const defaultUsers = [
        { username: '1ec168', password: '123456', role: 'user' },
        { username: 'user1', password: '123456', role: 'user' }
    ];
    
    for (const userData of defaultUsers) {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        const user = {
            id: userData.username,
            username: userData.username,
            password: hashedPassword,
            role: userData.role,
            createdAt: new Date().toISOString()
        };
        
        await db.setUser(userData.username, user);
        memoryUsers.set(userData.username, {
            ...user,
            websites: [],
            accounts: []
        });
    }
    
    console.log('✅ Database initialized');
    console.log('👤 Admin username: admin');
    console.log('🔑 Admin password:', ADMIN_PASSWORD);
}

initializeDatabase();

function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
}

async function createApiKey(userId, expiresIn = 24 * 60 * 60 * 1000) {
    const key = generateApiKey();
    const expiresAt = new Date(Date.now() + expiresIn);
    
    await db.setApiKey(key, {
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
    });
    
    return { key, expiresAt };
}

async function validateApiKey(key) {
    const keyData = await db.getApiKey(key);
    if (!keyData) return null;
    
    if (new Date() > new Date(keyData.expiresAt)) {
        await db.deleteApiKey(key);
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
    if (!apiKey) {
        console.log('❌ No API key provided');
        return res.status(401).json({ error: 'API key required' });
    }
    
    console.log('🔑 Validating API key:', apiKey.substring(0, 10) + '...');
    
    const keyData = await validateApiKey(apiKey);
    if (!keyData) {
        console.log('❌ Invalid or expired API key');
        return res.status(401).json({ error: 'Invalid or expired API key' });
    }
    
    console.log('✅ API key valid for user:', keyData.userId);
    
    req.userId = keyData.userId;
    const user = await db.getUser(keyData.userId);
    
    if (!user || !user.username) {
        console.log('❌ User not found for userId:', keyData.userId);
        return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('✅ User found:', user.username);
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
        
        const existingUser = await db.getUser(username);
        if (existingUser && existingUser.username) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userData = {
            id: userId,
            username,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        
        await db.setUser(username, userData);
        
        const token = jwt.sign({ id: userId, username, role: 'user' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: userId, username, role: 'user' } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await db.getUser(username);
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
    console.log('🔑 Generating API key for user:', req.user);
    const { key, expiresAt } = await createApiKey(req.user.username); // Use username instead of id
    console.log('✅ API key generated:', key.substring(0, 10) + '...');
    res.json({ success: true, apiKey: key, expiresAt, message: 'API key will auto-expire in 24 hours' });
});

app.get('/api/websites', authenticateApiKey, async (req, res) => {
    console.log('📋 Getting websites for user:', req.userId);
    const websites = await db.getWebsites(req.userId);
    console.log('✅ Found websites:', websites.length);
    res.json({ success: true, websites });
});

app.post('/api/websites', authenticateApiKey, async (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain required' });
    
    const normalizedDomain = domain.toLowerCase().trim();
    await db.addWebsite(req.userId, normalizedDomain);
    res.json({ success: true, message: 'Website added', domain: normalizedDomain });
});

app.delete('/api/websites/:domain', authenticateApiKey, async (req, res) => {
    const domain = req.params.domain.toLowerCase();
    await db.removeWebsite(req.userId, domain);
    res.json({ success: true, message: 'Website removed' });
});

app.get('/api/accounts', authenticateApiKey, async (req, res) => {
    const accounts = await db.getAccounts(req.userId);
    res.json({ success: true, accounts });
});

app.post('/api/accounts', authenticateApiKey, async (req, res) => {
    const { account } = req.body;
    if (!account) return res.status(400).json({ error: 'Account required' });
    
    const normalizedAccount = account.toLowerCase().trim();
    await db.addAccount(req.userId, normalizedAccount);
    res.json({ success: true, message: 'Account added', account: normalizedAccount });
});

app.delete('/api/accounts/:account', authenticateApiKey, async (req, res) => {
    const account = req.params.account.toLowerCase();
    await db.removeAccount(req.userId, account);
    res.json({ success: true, message: 'Account removed' });
});

app.post('/api/check-website', authenticateApiKey, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL required' });
        
        const domain = url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').split('?')[0].split('#')[0];
        const websites = await db.getWebsites(req.userId);
        const isAllowed = websites.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
        
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
        const accounts = await db.getAccounts(req.userId);
        const isAllowed = accounts.includes(normalizedAccount);
        
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
        const users = await db.getAllUsers();
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load users' });
    }
});

app.post('/api/admin/create-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        
        const existingUser = await db.getUser(username);
        if (existingUser && existingUser.username) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userData = {
            id: userId,
            username,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        
        await db.setUser(username, userData);
        
        res.json({ success: true, message: 'User created', user: { id: userId, username, role: 'user' } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) return res.status(400).json({ error: 'User ID and new password required' });
        
        const users = await db.getAllUsers();
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        
        const user = await db.getUser(targetUser.username);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        user.password = hashedPassword;
        await db.setUser(targetUser.username, user);
        
        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId === 'admin') return res.status(400).json({ error: 'Cannot delete admin user' });
        
        const users = await db.getAllUsers();
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        
        await db.deleteUser(targetUser.username);
        
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        storage: useKV ? 'Vercel KV (Redis)' : 'In-Memory',
        kvEnabled: useKV
    });
});

module.exports = app;
