# SkyParty Backend Server

A complete backend server for the SkyParty desktop application.

## 🚀 Quick Start

### Option 1: Use the Batch File (Easiest)
1. Double-click `start-backend.bat`
2. Wait for dependencies to install
3. Server will start automatically

### Option 2: Manual Setup
1. Open Command Prompt in this folder
2. Run: `npm install`
3. Run: `npm start`

## 📊 Server Information

- **Port**: 3003
- **Health Check**: http://localhost:3003/api/health
- **Data Directory**: `./data/` (auto-created)

## 🔧 API Endpoints

### User Management
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/search` - Search users

### Activation
- `POST /api/activation/activate` - Activate user account

### Credits
- `POST /api/credits/update` - Add/subtract credits

### Characters
- `POST /api/characters/purchase` - Buy character
- `POST /api/characters/select` - Select character

### Inventory
- `GET /api/inventory/:userId` - Get user inventory
- `POST /api/inventory/add` - Add item to inventory

### Messaging
- `GET /api/messages/conversations/:userId` - Get conversations
- `POST /api/messages/send` - Send message

### Mailbox/Gifts
- `GET /api/mailbox/:userId` - Get mailbox
- `POST /api/mailbox/send-gift` - Send gift
- `POST /api/mailbox/claim-gift` - Accept/reject gift

### Admin
- `GET /api/admin/stats` - Get server statistics
- `GET /api/admin/backup` - Backup all data
- `POST /api/admin/restore` - Restore data

## 💾 Data Storage

All data is stored in JSON files in the `data/` directory:
- `users.json` - User accounts
- `inventory_[userId].json` - User inventories
- `mailbox_[userId].json` - User mailboxes
- `conversations_[userId].json` - User conversations
- `transactions.json` - Credit transactions
- `game_sessions.json` - Game session logs

## 🔒 Security Notes

- This is a development server
- No password hashing implemented
- No authentication middleware
- Suitable for local development only

## 🚀 Deployment

For production deployment, consider:
- Adding password hashing (bcrypt)
- Implementing JWT authentication
- Using a proper database (PostgreSQL, MongoDB)
- Adding rate limiting
- Implementing HTTPS

## 📝 License

MIT License
