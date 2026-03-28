// Mock Bot Server - Để test bot integration
// Chạy: node mock-bot/server.js

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock database - danh sách player
const mockPlayers = {
    'agent_A': ['player1', 'player2', 'player3', 'testuser', 'vipuser'],
    'agent_B': ['player4', 'player5', 'player6'],
    'default': ['demo1', 'demo2', 'demo3']
};

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Mock Bot API is running',
        timestamp: new Date().toISOString()
    });
});

// Check player endpoint
app.post('/check', (req, res) => {
    const { player, agent_id } = req.body;
    
    console.log('Received check request:', { player, agent_id });
    
    if (!player) {
        return res.status(400).json({ error: 'Player name required' });
    }
    
    // Lấy danh sách player của agent (hoặc dùng default)
    const playerList = mockPlayers[agent_id] || mockPlayers['default'];
    
    // Check player có trong list không
    const exists = playerList.includes(player.toLowerCase());
    
    console.log('Check result:', { player, exists, list: playerList });
    
    res.json({
        exists: exists,
        player: player,
        agent_id: agent_id || 'default',
        timestamp: new Date().toISOString()
    });
});

// Add player (để test thêm player vào bot)
app.post('/add-player', (req, res) => {
    const { player, agent_id } = req.body;
    
    if (!player) {
        return res.status(400).json({ error: 'Player name required' });
    }
    
    const agentKey = agent_id || 'default';
    
    if (!mockPlayers[agentKey]) {
        mockPlayers[agentKey] = [];
    }
    
    if (!mockPlayers[agentKey].includes(player.toLowerCase())) {
        mockPlayers[agentKey].push(player.toLowerCase());
    }
    
    res.json({
        success: true,
        message: 'Player added',
        player: player,
        total_players: mockPlayers[agentKey].length
    });
});

// List all players
app.get('/players', (req, res) => {
    const agent_id = req.query.agent_id || 'default';
    const playerList = mockPlayers[agent_id] || [];
    
    res.json({
        agent_id: agent_id,
        players: playerList,
        total: playerList.length
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🤖 Mock Bot API running on port ${PORT}`);
    console.log(`📝 Test URL: http://localhost:${PORT}/check`);
    console.log(`\n📋 Mock Players:`);
    Object.keys(mockPlayers).forEach(agent => {
        console.log(`   ${agent}: ${mockPlayers[agent].join(', ')}`);
    });
});
