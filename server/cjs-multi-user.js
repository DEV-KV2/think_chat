const express = require('express')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = 3001
const JWT_SECRET = 'think_chat_secret_key_2024'

// In-memory storage for demo (will be lost on restart)
const users = []
const conversations = []
const messages = []

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
})

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, username, displayName } = req.body
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.username === username)
    if (existingUser) {
        return res.status(400).json({ message: 'Email or username already taken' })
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = {
        id: uuidv4(),
        email,
        username,
        displayName: displayName || username,
        password: hashedPassword,
        isOnline: true,
        createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' })
    
    res.status(201).json({
        user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            displayName: newUser.displayName
        },
        token
    })
})

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body
    
    // Find user by email or username
    const user = users.find(u => u.email === email || u.username === email)
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    // Set user online
    user.isOnline = true
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    
    res.json({
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName
        },
        token
    })
})

// Middleware to verify token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' })
    }
    
    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.userId = decoded.userId
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' })
    }
}

// User routes
app.get('/api/users/', verifyToken, (req, res) => {
    const { search } = req.query
    let filteredUsers = users.filter(u => u.id !== req.userId) // Don't include current user
    
    if (search) {
        filteredUsers = filteredUsers.filter(u => 
            u.displayName.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase())
        )
    }
    
    res.json(filteredUsers.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        isOnline: u.isOnline
    })))
})

// Message routes
app.get('/api/messages/conversations', verifyToken, (req, res) => {
    const userConversations = conversations.filter(conv => 
        conv.participants.includes(req.userId)
    )
    
    const result = userConversations.map(conv => {
        const convMessages = messages.filter(m => m.conversationId === conv.id)
        const lastMessage = convMessages[convMessages.length - 1]
        
        // Get other participant info
        const otherParticipantId = conv.participants.find(p => p !== req.userId)
        const otherUser = users.find(u => u.id === otherParticipantId)
        
        return {
            id: conv.id,
            name: otherUser?.displayName || otherUser?.username || 'Unknown',
            lastMessage: lastMessage?.content || '',
            lastMessageTime: lastMessage?.createdAt || conv.createdAt,
            participants: [{
                id: otherUser?.id,
                username: otherUser?.username,
                displayName: otherUser?.displayName,
                isOnline: otherUser?.isOnline
            }]
        }
    }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    
    res.json(result)
})

app.post('/api/messages/send', verifyToken, (req, res) => {
    const { conversationId, recipientId, content } = req.body
    let convId = conversationId
    
    // If no conversation exists, create one
    if (!convId && recipientId) {
        // Check if conversation exists between users
        const existing = conversations.find(conv => 
            conv.participants.includes(req.userId) && 
            conv.participants.includes(recipientId) &&
            !conv.isGroup
        )
        
        if (existing) {
            convId = existing.id
        } else {
            convId = uuidv4()
            conversations.push({
                id: convId,
                isGroup: false,
                participants: [req.userId, recipientId],
                createdAt: new Date().toISOString()
            })
        }
    }
    
    const messageId = uuidv4()
    const newMessage = {
        id: messageId,
        conversationId: convId,
        senderId: req.userId,
        content,
        createdAt: new Date().toISOString(),
        isRead: false
    }
    
    messages.push(newMessage)
    
    res.status(201).json({
        id: messageId,
        conversationId: convId,
        content,
        senderId: req.userId,
        createdAt: newMessage.createdAt
    })
})

app.get('/api/messages/conversations/:id', verifyToken, (req, res) => {
    const conversationId = req.params.id
    
    // Verify user is part of conversation
    const conversation = conversations.find(conv => 
        conv.id === conversationId && conv.participants.includes(req.userId)
    )
    
    if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' })
    }
    
    const convMessages = messages.filter(m => m.conversationId === conversationId)
    
    const result = convMessages.map(msg => {
        const sender = users.find(u => u.id === msg.senderId)
        return {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            senderName: sender?.displayName || sender?.username || 'Unknown',
            senderAvatar: null,
            isRead: msg.isRead,
            createdAt: msg.createdAt
        }
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    
    res.json(result)
})

app.listen(PORT, () => {
    console.log(`🚀 Multi-user chat server running on http://localhost:${PORT}`)
    console.log(`📱 Ready for real Gmail logins and friend connections!`)
})
