// Railway Web Server - Serves SkyParty HTML
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, JS, images)
app.use(express.static('public'));

// Serve the main SkyParty HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'skypartyonline2.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'SkyParty Web Server Running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌐 SkyParty Web Server running on port ${PORT}`);
    console.log(`📱 Desktop app will connect to: http://localhost:${PORT}`);
    console.log(`🚀 Ready for Railway deployment!`);
});

module.exports = app;
