# 🚀 Think Chat - Multi-User Chat Application

A real-time multi-user chat application built with React and Python backend. Users can register, discover other users, and engage in private conversations with persistent data storage.

## ✨ Features

- 🔐 **User Authentication** - Register and login with email/username
- 👥 **Multi-User Support** - Multiple users can connect and chat in real-time
- 🔍 **User Discovery** - Search and find other users to start conversations
- 💬 **Real-time Messaging** - Instant messaging between users
- 💾 **Persistent Storage** - SQLite database saves all data permanently
- 🌐 **Cross-Browser** - Works across different browsers and devices
- 📱 **Responsive Design** - Modern UI with Tailwind CSS
- 🔄 **Online Status** - See who's online and available to chat

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast development server
- **Material Symbols** - Modern icons

### Backend
- **Python 3** - Server-side programming
- **SQLite** - Lightweight database for persistent storage
- **HTTP Server** - Built-in Python HTTP server
- **CORS** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/think-chat.git
   cd think-chat
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   cd server
   python chat_server.py
   ```

4. **Start the frontend** (in a new terminal)
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📱 Usage

### For Personal Use
1. Open http://localhost:5173
2. Register a new account
3. Discover other users and start chatting

### For Multi-User Testing
1. Open multiple browser windows/tabs
2. Each window should register with different email
3. Users will see each other in the Discover section
4. Start real-time conversations

### For Deployment
1. Deploy frontend to any static hosting (Vercel, Netlify, etc.)
2. Deploy backend to any Python hosting (Heroku, PythonAnywhere, etc.)
3. Update API URLs in frontend configuration

## 📁 Project Structure

```
think-chat/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   └── App.jsx            # Main App component
├── server/                 # Python backend
│   ├── db/                # Database directory
│   │   └── chat.db        # SQLite database
│   ├── chat_server.py     # Main server file
│   └── test_db.py         # Database testing
├── public/                 # Static assets
└── package.json           # Frontend dependencies
```

## 🔧 Configuration

### Database
- **Location**: `server/db/chat.db`
- **Type**: SQLite
- **Tables**: users, conversations, messages, participants
- **Backup**: Simply copy the `chat.db` file

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/` - Get all users
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /debug/users` - Debug user list

## 🌍 Deployment

### Frontend (Vercel/Netlify)
1. Run `npm run build`
2. Deploy the `dist` folder
3. Update API URL to your backend

### Backend (PythonAnywhere/Heroku)
1. Upload server files
2. Install Python dependencies
3. Run `python chat_server.py`
4. Configure CORS for your domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Ensure all dependencies are installed
3. Verify database permissions
4. Check port availability (3001, 5173)

## 🎯 Future Features

- [ ] Group chats
- [ ] File sharing
- [ ] Voice/video calls
- [ ] Message encryption
- [ ] Push notifications
- [ ] User avatars
- [ ] Message reactions
- [ ] Typing indicators

---

**Built with ❤️ for real-time communication**
