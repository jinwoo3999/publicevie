require('dotenv').config();
const app = require('./api/index');
const express = require('express');

// Serve static files
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 EVIE Backend running on port ${PORT}`);
    console.log(`👤 Admin username: admin`);
    console.log(`🔑 Admin password: ${process.env.ADMIN_PASSWORD || 'Admin@2026!'}`);
    console.log(`⏰ API keys auto-expire after 24 hours`);
});
