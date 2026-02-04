const express = require('express')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = 3001

// In-memory shared storage (all users see this)
const users = []
const conversations = []
const messages = []

// Middleware
app.use(cors({ origin: '*' })) // Allow all origins for testing
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', users: users.length, conversations: conversations.length })
})

// Auth routes
app.post('/api/auth/register', (req, res) => {
    const { email, password, username, displayName } = req.body
    
    console.log('Registration attempt:', { email, username })
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.username === username)
    if (existingUser) {
        console.log('User already exists:', existingUser.email)
        return res.status(400).json({ message: 'Email or username already taken' })
    }
    
    // Create new user
    const newUser = {
        id: uuidv4(),
        email,
        username,
        displayName: displayName || username,
        password, // In production, hash this!
        isOnline: true,
        createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    console.log('New user registered:', newUser.email, 'Total users:', users.length)
    
    const token = 'mock-token-' + newUser.id
    
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

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body
    
    console.log('Login attempt:', { email })
    
    // Find user by email or username
    const user = users.find(u => u.email === email || u.username === email)
    if (!user || user.password !== password) {
        console.log('Login failed for:', email)
        return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    // Set user online
    user.isOnline = true
    console.log('User logged in:', user.email, 'Online users:', users.filter(u => u.isOnline).length)
    
    const token = 'mock-token-' + user.id
    
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

// Simple token verification
function getUserId(req) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        if (token.startsWith('mock-token-')) {
            return token.substring(11)
        }
    }
    return null
}

// User routes
app.get('/api/users/', (req, res) => {
    const userId = getUserId(req)
    if (!userId) {
        return res.status(401).json({ message: 'No token provided' })
    }
    
    console.log('User', userId, 'requesting user list')
    
    const { search } = req.query
    let filteredUsers = users.filter(u => u.id !== userId) // Don't include current user
    
    if (search) {
        const searchLower = search.toLowerCase()
        filteredUsers = filteredUsers.filter(u =>
            u.displayName.toLowerCase().includes(searchLower) ||
            u.username.toLowerCase().includes(searchLower)
        )
        console.log('Search for', search, 'found', filteredUsers.length, 'users')
    }
    
    const result = filteredUsers.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        isOnline: u.isOnline
    }))
    
    console.log('Returning', result.length, 'users to user', userId)
    res.json(result)
})

// Message routes
app.get('/api/messages/conversations', (req, res) => {
    const userId = getUserId(req)
    if (!userId) {
        return res.status(401).json({ message: 'No token provided' })
    }
    
    const userConversations = conversations.filter(conv =>
        conv.participants.includes(userId)
    )
    
    const result = userConversations.map(conv => {
        const convMessages = messages.filter(m => m.conversationId === conv.id)
        const lastMessage = convMessages[convMessages.length - 1]
        
        const otherParticipantId = conv.participants.find(p => p !== userId)
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

app.post('/api/messages/send', (req, res) => {
    const userId = getUserId(req)
    if (!userId) {
        return res.status(401).json({ message: 'No token provided' })
    }
    
    const { conversationId, recipientId, content } = req.body
    let convId = conversationId
    
    console.log('Message from', userId, 'to', recipientId, ':', content)
    
    if (!convId && recipientId) {
        // Check if conversation exists
        const existing = conversations.find(conv =>
            conv.participants.includes(userId) &&
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
                participants: [userId, recipientId],
                createdAt: new Date().toISOString()
            })
            console.log('New conversation created:', convId)
        }
    }
    
    const messageId = uuidv4()
    const newMessage = {
        id: messageId,
        conversationId: convId,
        senderId: userId,
        content,
        createdAt: new Date().toISOString(),
        isRead: false
    }
    
    messages.push(newMessage)
    console.log('Message saved:', messageId)
    
    res.status(201).json({
        id: messageId,
        conversationId: convId,
        content,
        senderId: userId,
        createdAt: newMessage.createdAt
    })
})

app.get('/api/messages/conversations/:id', (req, res) => {
    const userId = getUserId(req)
    if (!userId) {
        return res.status(401).json({ message: 'No token provided' })
    }
    
    const conversationId = req.params.id
    
    // Verify user is part of conversation
    const conversation = conversations.find(conv =>
        conv.id === conversationId && conv.participants.includes(userId)
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

// Debug endpoint to see all users
app.get('/debug/users', (req, res) => {
    res.json({
        total: users.length,
        online: users.filter(u => u.isOnline).length,
        users: users.map(u => ({
            id: u.id,
            email: u.email,
            username: u.username,
            displayName: u.displayName,
            isOnline: u.isOnline
        }))
    })
})

app.listen(PORT, () => {
    console.log('🚀 Multi-user chat server running on http://localhost:' + PORT)
    console.log('📱 Ready for real Gmail logins and friend connections!')
    console.log('👥 All users share the same data!')
    console.log('🔍 Debug users at: http://localhost:' + PORT + '/debug/users')
})
