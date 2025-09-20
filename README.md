# SkyParty Desktop App

A desktop gaming application built with Electron and integrated with Railway for online data storage.

## 🎮 Features

- **Desktop App**: Built with Electron for cross-platform compatibility
- **Online Data**: Integrated with Railway PostgreSQL database
- **User Management**: Registration, login, and user data storage
- **Game Features**: Character management, credits, inventory, messaging
- **Real-time Updates**: Data synced across devices via Railway

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Railway account
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd skypartyonline2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the desktop app**
   ```bash
   npm run build
   ```

4. **Run the app**
   ```bash
   npm start
   ```

## 🛠️ Development

### Project Structure
```
skypartyonline2/
├── main.js                 # Electron main process
├── skypartyonline2.html   # Main application UI
├── railway-api-server.js  # Railway API server
├── package.json           # Dependencies and scripts
└── dist/                  # Built applications
```

### Building Standalone App
```bash
# Build standalone executable
npx electron-packager . SkyParty-Standalone --platform=win32 --arch=x64 --out=dist --overwrite
```

### Railway Deployment
1. Upload `railway-api-server.js` and `railway-package.json` to Railway
2. Set environment variable `DATABASE_URL`
3. Deploy the server
4. Update `RAILWAY_API_URL` in the HTML file

## 📱 API Endpoints

### User Management
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/user/:userId/data` - Get user data
- `PUT /api/user/:userId/data` - Update user data

### Health Check
- `GET /api/health` - Server health status

## 🗄️ Database Schema

### Tables
- **users** - User accounts and authentication
- **user_data** - Game progress and credits
- **characters** - Character ownership and status
- **messages** - User messaging system
- **inventory** - User items and purchases

## 🔧 Configuration

### Railway API URL
Update the `RAILWAY_API_URL` in `skypartyonline2.html`:
```javascript
const RAILWAY_API_URL = 'https://your-railway-project.up.railway.app';
```

### Database Connection
Set the `DATABASE_URL` environment variable in Railway:
```
DATABASE_URL=postgresql://username:password@host:port/database
```

## 📦 Distribution

### Standalone App
The built standalone app is located in `dist/SkyParty-Standalone-win32-x64/` and includes:
- All dependencies
- Portable executable
- No installation required

### Installer
Use the provided installer script or Inno Setup to create a Windows installer.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please contact the SkyParty team.

---

**SkyParty Desktop v1.0.0** - Built with ❤️ using Electron and Railway