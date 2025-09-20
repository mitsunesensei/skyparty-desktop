// Railway API Server for SkyParty Desktop App
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ddbYzQgrtDBGiScrdyjWPINWkcyEXtyZ@postgres.railway.internal:5432/railway'
});

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to Railway PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});

// Create tables function
async function createTables() {
    try {
        console.log('🔧 Creating database tables...');
        
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_activated BOOLEAN DEFAULT FALSE,
                activation_code VARCHAR(50)
            )
        `);

        // Characters table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS characters (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                character_name VARCHAR(50) NOT NULL,
                is_owned BOOLEAN DEFAULT FALSE,
                is_current BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User data table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_data (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                game_credits INTEGER DEFAULT 150,
                current_character VARCHAR(50) DEFAULT 'kitty',
                owned_characters TEXT[] DEFAULT ARRAY['kitty'],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Messages table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER REFERENCES users(id),
                recipient_id INTEGER REFERENCES users(id),
                content TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE
            )
        `);

        // Inventory table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                item_name VARCHAR(100) NOT NULL,
                item_type VARCHAR(50) NOT NULL,
                item_icon VARCHAR(10) NOT NULL,
                quantity INTEGER DEFAULT 1,
                source VARCHAR(50) DEFAULT 'default',
                acquired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'SkyParty API Server Running',
        timestamp: new Date().toISOString()
    });
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }
        
        // Create user
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [username, email, password] // In production, hash the password
        );
        
        const userId = result.rows[0].id;
        
        // Create user data
        await pool.query(
            'INSERT INTO user_data (user_id) VALUES ($1)',
            [userId]
        );
        
        res.json({ 
            success: true, 
            message: 'User registered successfully',
            userId: userId
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed' 
        });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user by username or email
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        const user = result.rows[0];
        
        // In production, verify password hash
        if (user.password_hash !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isActivated: user.is_activated
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed' 
        });
    }
});

// Get user data
app.get('/api/user/:userId/data', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM user_data WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User data not found' 
            });
        }
        
        res.json({ 
            success: true, 
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Get user data error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user data' 
        });
    }
});

// Update user data
app.put('/api/user/:userId/data', async (req, res) => {
    try {
        const { userId } = req.params;
        const { gameCredits, currentCharacter, ownedCharacters } = req.body;
        
        const result = await pool.query(
            'UPDATE user_data SET game_credits = $1, current_character = $2, owned_characters = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4 RETURNING *',
            [gameCredits, currentCharacter, ownedCharacters, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User data not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'User data updated successfully',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Update user data error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user data' 
        });
    }
});

// Start server
async function startServer() {
    await createTables();
    
    app.listen(PORT, () => {
        console.log(`🚀 SkyParty API Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🗄️ Database: Connected to Railway PostgreSQL`);
    });
}

startServer().catch(console.error);

module.exports = app;
