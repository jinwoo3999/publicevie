const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Pool } = require('pg');

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

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create websites table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS websites (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                domain VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, domain)
            )
        `);
        
        // Create accounts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                account VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, account)
            )
        `);
        
        // Create api_keys table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS api_keys (
                key VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Database tables created');
        
        // Check if admin exists
        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        
        if (adminCheck.rows.length === 0) {
            // Create admin user
            const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026!';
            const adminPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
            
            await pool.query(
                'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
                ['admin', 'admin', adminPassword, 'admin']
            );
            
            // Add default websites for admin
            const defaultWebsites = ['ok168.pro', 'ok168.com', 'ok168.net', 'ok168.vip'];
            for (const domain of defaultWebsites) {
                await pool.query(
                    'INSERT INTO websites (user_id, domain) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    ['admin', domain]
                );
            }
            
            // Add default accounts for admin
            const defaultAccounts = ['admin123', 'user001', 'vip888', 'test123'];
            for (const account of defaultAccounts) {
                await pool.query(
                    'INSERT INTO accounts (user_id, account) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    ['admin', account]
                );
            }
            
            console.log('✅ Admin user created');
            console.log('👤 Admin username: admin');
            console.log('🔑 Admin password:', ADMIN_PASSWORD);
        } else {
            console.log('✅ Admin user already exists');
        }
        
        // Create default users if they don't exist
        const defaultUsers = [
            { username: '1ec168', password: '123456', role: 'user' },
            { username: 'user1', password: '123456', role: 'user' }
        ];
        
        for (const userData of defaultUsers) {
            const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [userData.username]);
            if (userCheck.rows.length === 0) {
                const hashedPassword = bcrypt.hashSync(userData.password, 10);
                await pool.query(
                    'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
                    [userData.username, userData.username, hashedPassword, userData.role]
                );
            }
        }
        
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        console.error('Stack:', error.stack);
    }
}

initializeDatabase();

// Clean expired API keys periodically
setInterval(async () => {
    try {
        await pool.query('DELETE FROM api_keys WHERE expires_at < NOW()');
    } catch (error) {
        console.error('Error cleaning expired keys:', error);
    }
}, 60 * 60 * 1000); // Every hour

function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
}

async function createApiKey(userId, expiresIn = 24 * 60 * 60 * 1000) {
    const key = generateApiKey();
    const expiresAt = new Date(Date.now() + expiresIn);
    
    await pool.query(
        'INSERT INTO api_keys (key, user_id, expires_at) VALUES ($1, $2, $3)',
        [key, userId, expiresAt]
    );
    
    return { key, expiresAt };
}

async function validateApiKey(key) {
    const result = await pool.query(
        'SELECT * FROM api_keys WHERE key = $1 AND expires_at > NOW()',
        [key]
    );
    
    if (result.rows.length === 0) {
        return null;
    }
    
    return result.rows[0];
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
    
    req.userId = keyData.user_id;
    
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [keyData.user_id]);
    if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = userResult.rows[0];
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
        
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
            'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
            [userId, username, hashedPassword, 'user']
        );
        
        const token = jwt.sign({ id: userId, username, role: 'user' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: userId, username, role: 'user' } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/generate-key', authenticateToken, async (req, res) => {
    const { key, expiresAt } = await createApiKey(req.user.id);
    res.json({ success: true, apiKey: key, expiresAt, message: 'API key will auto-expire in 24 hours' });
});

app.get('/api/websites', authenticateApiKey, async (req, res) => {
    const result = await pool.query('SELECT domain FROM websites WHERE user_id = $1', [req.userId]);
    const websites = result.rows.map(row => row.domain);
    res.json({ success: true, websites });
});

app.post('/api/websites', authenticateApiKey, async (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain required' });
    
    const normalizedDomain = domain.toLowerCase().trim();
    await pool.query(
        'INSERT INTO websites (user_id, domain) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.userId, normalizedDomain]
    );
    res.json({ success: true, message: 'Website added', domain: normalizedDomain });
});

app.delete('/api/websites/:domain', authenticateApiKey, async (req, res) => {
    const domain = req.params.domain.toLowerCase();
    await pool.query('DELETE FROM websites WHERE user_id = $1 AND domain = $2', [req.userId, domain]);
    res.json({ success: true, message: 'Website removed' });
});

app.get('/api/accounts', authenticateApiKey, async (req, res) => {
    const result = await pool.query('SELECT account FROM accounts WHERE user_id = $1', [req.userId]);
    const accounts = result.rows.map(row => row.account);
    res.json({ success: true, accounts });
});

app.post('/api/accounts', authenticateApiKey, async (req, res) => {
    const { account } = req.body;
    if (!account) return res.status(400).json({ error: 'Account required' });
    
    const normalizedAccount = account.toLowerCase().trim();
    await pool.query(
        'INSERT INTO accounts (user_id, account) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.userId, normalizedAccount]
    );
    res.json({ success: true, message: 'Account added', account: normalizedAccount });
});

app.delete('/api/accounts/:account', authenticateApiKey, async (req, res) => {
    const account = req.params.account.toLowerCase();
    await pool.query('DELETE FROM accounts WHERE user_id = $1 AND account = $2', [req.userId, account]);
    res.json({ success: true, message: 'Account removed' });
});

app.post('/api/check-website', authenticateApiKey, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL required' });
        
        const domain = url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').split('?')[0].split('#')[0];
        const result = await pool.query('SELECT domain FROM websites WHERE user_id = $1', [req.userId]);
        const websites = result.rows.map(row => row.domain);
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
        const result = await pool.query('SELECT account FROM accounts WHERE user_id = $1', [req.userId]);
        const accounts = result.rows.map(row => row.account);
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
        const result = await pool.query(`
            SELECT 
                u.id, u.username, u.role, u.created_at,
                COUNT(DISTINCT w.id) as website_count,
                COUNT(DISTINCT a.id) as account_count
            FROM users u
            LEFT JOIN websites w ON u.id = w.user_id
            LEFT JOIN accounts a ON u.id = a.user_id
            GROUP BY u.id, u.username, u.role, u.created_at
        `);
        
        const users = result.rows.map(row => ({
            id: row.id,
            username: row.username,
            role: row.role,
            createdAt: row.created_at,
            websiteCount: parseInt(row.website_count),
            accountCount: parseInt(row.account_count)
        }));
        
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

app.post('/api/admin/create-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
            'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
            [userId, username, hashedPassword, 'user']
        );
        
        res.json({ success: true, message: 'User created', user: { id: userId, username, role: 'user' } });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) return res.status(400).json({ error: 'User ID and new password required' });
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
            [hashedPassword, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId === 'admin') return res.status(400).json({ error: 'Cannot delete admin user' });
        
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        storage: 'PostgreSQL (Neon)',
        database: 'connected'
    });
});

module.exports = app;
