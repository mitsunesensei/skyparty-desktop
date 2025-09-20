// SkyParty Backend Server
// Run with: node server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Database helper functions
class Database {
    static async read(filename) {
        try {
            const filePath = path.join(DATA_DIR, `${filename}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log(`File ${filename}.json not found, returning empty data`);
            return {};
        }
    }

    static async write(filename, data) {
        try {
            const filePath = path.join(DATA_DIR, `${filename}.json`);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing ${filename}.json:`, error);
            return false;
        }
    }

    static async append(filename, key, newData) {
        const existingData = await this.read(filename);
        if (!existingData[key]) {
            existingData[key] = [];
        }
        existingData[key].push({
            ...newData,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        });
        return await this.write(filename, existingData);
    }
}

// User Management Routes
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username, email, and password are required' 
            });
        }

        const users = await Database.read('users');
        
        // Check if user already exists
        if (users[email]) {
            return res.status(409).json({ 
                success: false, 
                error: 'User already exists' 
            });
        }

        // Check if username is taken
        const existingUsername = Object.values(users).find(user => user.username === username);
        if (existingUsername) {
            return res.status(409).json({ 
                success: false, 
                error: 'Username already taken' 
            });
        }

        // Create user
        const user = {
            id: crypto.randomUUID(),
            username,
            email,
            gameCredits: 150,
            currentCharacter: 'kitty',
            ownedCharacters: ['kitty'],
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            activated: false,
            activationCode: null
        };

        users[email] = user;
        await Database.write('users', users);

        // Initialize user data collections
        await Database.write(`inventory_${user.id}`, []);
        await Database.write(`mailbox_${user.id}`, []);
        await Database.write(`conversations_${user.id}`, []);

        res.json({ 
            success: true, 
            user: { 
                id: user.id,
                username: user.username,
                email: user.email,
                gameCredits: user.gameCredits 
            } 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = await Database.read('users');
        const user = users[email];
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        users[email] = user;
        await Database.write('users', users);

        res.json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                gameCredits: user.gameCredits,
                currentCharacter: user.currentCharacter,
                ownedCharacters: user.ownedCharacters,
                activated: user.activated
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

app.get('/api/users/search', async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.json({ success: true, users: [] });
        }

        const users = await Database.read('users');
        const matchingUsers = Object.values(users)
            .filter(user => user.username.toLowerCase().includes(query.toLowerCase()))
            .map(user => ({
                id: user.id,
                username: user.username,
                currentCharacter: user.currentCharacter,
                lastLogin: user.lastLogin
            }));

        res.json({ success: true, users: matchingUsers });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// Activation Routes
app.post('/api/activation/activate', async (req, res) => {
    try {
        const { email, activationCode } = req.body;
        
        const validCodes = [
            'SKYP-ARTY-2024-GOLD',
            'TEST-CODE-ABCD-1234',
            'DEMO-FULL-ACCE-XYZ',
            'PREM-IUMU-SER2-024',
            'VIPM-EMBE-RCOD-E123',
            'BETA-TEST-ER20-24',
            'EARL-YBIR-DSPE-CIAL',
            'FOUN-DER2-024-CODE',
            'GOLD-ENTI-CKET-CODE',
            'PLAT-INUM-ACCE-SS24'
        ];

        if (!validCodes.includes(activationCode)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid activation code' 
            });
        }

        const users = await Database.read('users');
        const user = users[email];
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        user.activated = true;
        user.activationCode = activationCode;
        user.activatedAt = new Date().toISOString();
        
        users[email] = user;
        await Database.write('users', users);

        res.json({ success: true, message: 'Activation successful' });

    } catch (error) {
        console.error('Activation error:', error);
        res.status(500).json({ success: false, error: 'Activation failed' });
    }
});

// Credits Management Routes
app.post('/api/credits/update', async (req, res) => {
    try {
        const { userId, amount, operation } = req.body; // operation: 'add' or 'subtract'
        
        const users = await Database.read('users');
        const user = Object.values(users).find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        if (operation === 'add') {
            user.gameCredits += amount;
        } else if (operation === 'subtract') {
            if (user.gameCredits < amount) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Insufficient credits' 
                });
            }
            user.gameCredits -= amount;
        }

        // Update user in database
        users[user.email] = user;
        await Database.write('users', users);

        // Log transaction
        const transactions = await Database.read('transactions');
        if (!transactions[userId]) {
            transactions[userId] = [];
        }
        transactions[userId].push({
            id: crypto.randomUUID(),
            amount: operation === 'add' ? amount : -amount,
            type: operation,
            timestamp: new Date().toISOString(),
            balance: user.gameCredits
        });
        await Database.write('transactions', transactions);

        res.json({ 
            success: true, 
            newBalance: user.gameCredits 
        });

    } catch (error) {
        console.error('Credits update error:', error);
        res.status(500).json({ success: false, error: 'Credits update failed' });
    }
});

// Character Management Routes
app.post('/api/characters/purchase', async (req, res) => {
    try {
        const { userId, characterId, characterData } = req.body;
        
        const users = await Database.read('users');
        const user = Object.values(users).find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Check if user has enough credits
        if (user.gameCredits < characterData.price) {
            return res.status(400).json({ 
                success: false, 
                error: 'Insufficient credits' 
            });
        }

        // Deduct credits and add character
        user.gameCredits -= characterData.price;
        if (!user.ownedCharacters.includes(characterId)) {
            user.ownedCharacters.push(characterId);
        }

        // Update user in database
        users[user.email] = user;
        await Database.write('users', users);

        // Add to inventory
        const inventory = await Database.read(`inventory_${userId}`);
        inventory.push({
            id: crypto.randomUUID(),
            type: 'character',
            characterId: characterId,
            name: characterData.name,
            icon: characterData.icon,
            description: characterData.description,
            price: characterData.price,
            acquiredDate: new Date().toISOString(),
            source: 'purchase'
        });
        await Database.write(`inventory_${userId}`, inventory);

        res.json({ 
            success: true, 
            newBalance: user.gameCredits,
            ownedCharacters: user.ownedCharacters 
        });

    } catch (error) {
        console.error('Character purchase error:', error);
        res.status(500).json({ success: false, error: 'Purchase failed' });
    }
});

app.post('/api/characters/select', async (req, res) => {
    try {
        const { userId, characterId } = req.body;
        
        const users = await Database.read('users');
        const user = Object.values(users).find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Check if user owns the character
        if (!user.ownedCharacters.includes(characterId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Character not owned' 
            });
        }

        user.currentCharacter = characterId;
        users[user.email] = user;
        await Database.write('users', users);

        res.json({ 
            success: true, 
            currentCharacter: characterId 
        });

    } catch (error) {
        console.error('Character selection error:', error);
        res.status(500).json({ success: false, error: 'Selection failed' });
    }
});

// Inventory Management Routes
app.get('/api/inventory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const inventory = await Database.read(`inventory_${userId}`);
        
        res.json({ success: true, items: inventory });

    } catch (error) {
        console.error('Inventory fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
    }
});

app.post('/api/inventory/add', async (req, res) => {
    try {
        const { userId, item } = req.body;
        
        const inventory = await Database.read(`inventory_${userId}`);
        inventory.push({
            ...item,
            id: crypto.randomUUID(),
            acquiredDate: new Date().toISOString()
        });
        await Database.write(`inventory_${userId}`, inventory);

        res.json({ success: true });

    } catch (error) {
        console.error('Inventory add error:', error);
        res.status(500).json({ success: false, error: 'Failed to add item' });
    }
});

// Messaging System Routes
app.get('/api/messages/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = await Database.read(`conversations_${userId}`);
        
        res.json({ success: true, conversations: Object.values(conversations) });

    } catch (error) {
        console.error('Conversations fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
    }
});

app.post('/api/messages/send', async (req, res) => {
    try {
        const { senderId, recipientId, content, conversationId } = req.body;
        
        const message = {
            id: crypto.randomUUID(),
            senderId,
            recipientId,
            content,
            timestamp: new Date().toISOString(),
            read: false
        };

        // Add message to both users' conversations
        const senderConversations = await Database.read(`conversations_${senderId}`);
        const recipientConversations = await Database.read(`conversations_${recipientId}`);

        if (!senderConversations[conversationId]) {
            senderConversations[conversationId] = {
                id: conversationId,
                participants: [senderId, recipientId],
                messages: [],
                lastActivity: new Date().toISOString()
            };
        }

        if (!recipientConversations[conversationId]) {
            recipientConversations[conversationId] = {
                id: conversationId,
                participants: [senderId, recipientId],
                messages: [],
                lastActivity: new Date().toISOString()
            };
        }

        senderConversations[conversationId].messages.push(message);
        senderConversations[conversationId].lastActivity = new Date().toISOString();
        
        recipientConversations[conversationId].messages.push(message);
        recipientConversations[conversationId].lastActivity = new Date().toISOString();

        await Database.write(`conversations_${senderId}`, senderConversations);
        await Database.write(`conversations_${recipientId}`, recipientConversations);

        res.json({ success: true, message });

    } catch (error) {
        console.error('Message send error:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// Mailbox/Gifts System Routes
app.get('/api/mailbox/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const mailbox = await Database.read(`mailbox_${userId}`);
        
        res.json({ success: true, items: mailbox });

    } catch (error) {
        console.error('Mailbox fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch mailbox' });
    }
});

app.post('/api/mailbox/send-gift', async (req, res) => {
    try {
        const { senderId, recipientId, giftType, giftData, message } = req.body;
        
        // Get sender and recipient info
        const users = await Database.read('users');
        const sender = Object.values(users).find(u => u.id === senderId);
        const recipient = Object.values(users).find(u => u.id === recipientId);
        
        if (!sender || !recipient) {
            return res.status(404).json({ 
                success: false, 
                error: 'Sender or recipient not found' 
            });
        }

        // Create gift item
        const gift = {
            id: crypto.randomUUID(),
            senderId,
            senderUsername: sender.username,
            recipientId,
            giftType,
            giftData,
            message: message || '',
            timestamp: new Date().toISOString(),
            read: false,
            claimed: false
        };

        // Add to recipient's mailbox
        const recipientMailbox = await Database.read(`mailbox_${recipientId}`);
        recipientMailbox.unshift(gift);
        await Database.write(`mailbox_${recipientId}`, recipientMailbox);

        res.json({ success: true, message: 'Gift sent successfully' });

    } catch (error) {
        console.error('Gift send error:', error);
        res.status(500).json({ success: false, error: 'Failed to send gift' });
    }
});

app.post('/api/mailbox/claim-gift', async (req, res) => {
    try {
        const { userId, giftId, action } = req.body; // action: 'accept' or 'reject'
        
        const mailbox = await Database.read(`mailbox_${userId}`);
        const giftIndex = mailbox.findIndex(gift => gift.id === giftId);
        
        if (giftIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Gift not found' 
            });
        }

        const gift = mailbox[giftIndex];
        
        if (action === 'accept') {
            // Add gift to user's inventory or credits
            if (gift.giftType === 'character') {
                const inventory = await Database.read(`inventory_${userId}`);
                inventory.push({
                    ...gift.giftData,
                    id: crypto.randomUUID(),
                    acquiredDate: new Date().toISOString(),
                    source: 'gift'
                });
                await Database.write(`inventory_${userId}`, inventory);
                
                // Update user's owned characters
                const users = await Database.read('users');
                const user = Object.values(users).find(u => u.id === userId);
                if (user && !user.ownedCharacters.includes(gift.giftData.characterId)) {
                    user.ownedCharacters.push(gift.giftData.characterId);
                    users[user.email] = user;
                    await Database.write('users', users);
                }
            } else if (gift.giftType === 'credits') {
                // Add credits to user account
                await this.updateUserCredits(userId, gift.giftData.amount, 'add');
            }
            
            gift.claimed = true;
            gift.read = true;
        } else if (action === 'reject') {
            // Return gift to sender
            if (gift.giftType === 'character') {
                const senderInventory = await Database.read(`inventory_${gift.senderId}`);
                senderInventory.push({
                    ...gift.giftData,
                    id: crypto.randomUUID(),
                    acquiredDate: new Date().toISOString(),
                    source: 'returned'
                });
                await Database.write(`inventory_${gift.senderId}`, senderInventory);
            }
            
            gift.claimed = true;
            gift.read = true;
        }

        mailbox[giftIndex] = gift;
        await Database.write(`mailbox_${userId}`, mailbox);

        res.json({ success: true, message: `Gift ${action}ed successfully` });

    } catch (error) {
        console.error('Gift claim error:', error);
        res.status(500).json({ success: false, error: 'Failed to process gift' });
    }
});

// Game Statistics Routes
app.post('/api/games/play', async (req, res) => {
    try {
        const { userId, gameType, earnedCredits } = req.body;
        
        // Update user credits
        const result = await Database.read('/api/credits/update', {
            userId,
            amount: earnedCredits,
            operation: 'add'
        });

        // Log game session
        const gameSessions = await Database.read('game_sessions');
        if (!gameSessions[userId]) {
            gameSessions[userId] = [];
        }
        gameSessions[userId].push({
            id: crypto.randomUUID(),
            gameType,
            earnedCredits,
            playedAt: new Date().toISOString(),
            duration: Math.floor(Math.random() * 1800) + 300 // 5-35 minutes
        });
        await Database.write('game_sessions', gameSessions);

        res.json({ 
            success: true, 
            earnedCredits,
            newBalance: result.newBalance 
        });

    } catch (error) {
        console.error('Game play error:', error);
        res.status(500).json({ success: false, error: 'Failed to record game session' });
    }
});

// Analytics Routes
app.get('/api/admin/stats', async (req, res) => {
    try {
        const users = await Database.read('users');
        const transactions = await Database.read('transactions');
        const gameSessions = await Database.read('game_sessions');

        const stats = {
            totalUsers: Object.keys(users).length,
            activeUsers: Object.values(users).filter(user => {
                const lastLogin = new Date(user.lastLogin);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return lastLogin > weekAgo;
            }).length,
            activatedUsers: Object.values(users).filter(user => user.activated).length,
            totalTransactions: Object.values(transactions).flat().length,
            totalGameSessions: Object.values(gameSessions).flat().length,
            totalCreditsInCirculation: Object.values(users).reduce((sum, user) => sum + user.gameCredits, 0)
        };

        res.json({ success: true, stats });

    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// Data backup and restore
app.get('/api/admin/backup', async (req, res) => {
    try {
        const files = await fs.readdir(DATA_DIR);
        const backup = {};
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filename = file.replace('.json', '');
                backup[filename] = await Database.read(filename);
            }
        }

        res.json({ success: true, backup });

    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ success: false, error: 'Backup failed' });
    }
});

app.post('/api/admin/restore', async (req, res) => {
    try {
        const { backup } = req.body;
        
        for (const [filename, data] of Object.entries(backup)) {
            await Database.write(filename, data);
        }

        res.json({ success: true, message: 'Data restored successfully' });

    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ success: false, error: 'Restore failed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'SkyParty backend server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
async function startServer() {
    await ensureDataDir();
    app.listen(PORT, () => {
        console.log(`🎮 SkyParty Backend Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📁 Data directory: ${DATA_DIR}`);
    });
}

startServer().catch(console.error);

module.exports = app;
