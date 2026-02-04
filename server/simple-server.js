import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = 3001

// Mock data
const users = [
    {
        id: '1',
        username: 'alice',
        displayName: 'Alice Johnson',
        isOnline: true
    },
    {
        id: '2',
        username: 'bob', 
        displayName: 'Bob Smith',
        isOnline: false
    },
    {
        id: '3',
        username: 'charlie',
        displayName: 'Charlie Davis',
        isOnline: true
    }
]

const conversations = []
const messages = []

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
})

// Auth routes (mock)
app.post('/api/auth/register', async (req, res) => {
    const { email, username, displayName } = req.body
    const userId = uuidv4()
    res.status(201).json({
        user: { id: userId, email, username, displayName: displayName || username },
        token: 'mock-token-' + userId
    })
})

app.post('/api/auth/login', async (req, res) => {
    const { email } = req.body
    res.json({
        user: { id: '1', email, username: 'demo', displayName: 'Demo User' },
        token: 'mock-token-1'
    })
})

// User routes
app.get('/api/users/', (req, res) => {
    const { search } = req.query
    let filteredUsers = users
    
    if (search) {
        filteredUsers = users.filter(u => 
            u.displayName.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase())
        )
    }
    
    res.json(filteredUsers)
})

// Message routes
app.get('/api/messages/conversations', (req, res) => {
    res.json([])
})

app.post('/api/messages/send', (req, res) => {
    const { recipientId, content } = req.body
    const conversationId = uuidv4()
    const messageId = uuidv4()
    
    res.status(201).json({
        id: messageId,
        conversationId,
        content,
        senderId: '1',
        createdAt: new Date().toISOString()
    })
})

app.get('/api/messages/conversations/:id', (req, res) => {
    res.json([])
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
