const http = require('http')
const url = require('url')

// In-memory storage
const users = []
const conversations = []
const messages = []

// Simple UUID generator
function generateId() {
    return Math.random().toString(36).substr(2, 9)
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
}

// Parse request body
function parseBody(req) {
    return new Promise((resolve) => {
        let body = ''
        req.on('data', chunk => body += chunk.toString())
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {})
            } catch {
                resolve({})
            }
        })
    })
}

// Handle requests
async function handleRequest(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders)
        res.end()
        return
    }

    const parsedUrl = url.parse(req.url, true)
    const path = parsedUrl.pathname
    const method = req.method

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value)
    })

    // Health check
    if (path === '/api/health' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok' }))
        return
    }

    // Auth routes
    if (path === '/api/auth/register' && method === 'POST') {
        const body = await parseBody(req)
        const { email, password, username, displayName } = body

        // Check if user exists
        const existingUser = users.find(u => u.email === email || u.username === username)
        if (existingUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Email or username already taken' }))
            return
        }

        // Create new user
        const newUser = {
            id: generateId(),
            email,
            username,
            displayName: displayName || username,
            password, // In production, hash this!
            isOnline: true,
            createdAt: new Date().toISOString()
        }

        users.push(newUser)

        res.writeHead(201, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                displayName: newUser.displayName
            },
            token: 'mock-token-' + newUser.id
        }))
        return
    }

    if (path === '/api/auth/login' && method === 'POST') {
        const body = await parseBody(req)
        const { email, password } = body

        // Find user
        const user = users.find(u => u.email === email || u.username === email)
        if (!user || user.password !== password) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Invalid credentials' }))
            return
        }

        user.isOnline = true

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName
            },
            token: 'mock-token-' + user.id
        }))
        return
    }

    // Simple token verification (just extract userId from mock token)
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

    // Users route
    if (path === '/api/users/' && method === 'GET') {
        const userId = getUserId(req)
        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'No token provided' }))
            return
        }

        const { search } = parsedUrl.query
        let filteredUsers = users.filter(u => u.id !== userId)

        if (search) {
            filteredUsers = filteredUsers.filter(u =>
                u.displayName.toLowerCase().includes(search.toLowerCase()) ||
                u.username.toLowerCase().includes(search.toLowerCase())
            )
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(filteredUsers.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            isOnline: u.isOnline
        }))))
        return
    }

    // Messages routes
    if (path === '/api/messages/conversations' && method === 'GET') {
        const userId = getUserId(req)
        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'No token provided' }))
            return
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

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
        return
    }

    if (path === '/api/messages/send' && method === 'POST') {
        const userId = getUserId(req)
        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'No token provided' }))
            return
        }

        const body = await parseBody(req)
        const { conversationId, recipientId, content } = body
        let convId = conversationId

        if (!convId && recipientId) {
            const existing = conversations.find(conv =>
                conv.participants.includes(userId) &&
                conv.participants.includes(recipientId) &&
                !conv.isGroup
            )

            if (existing) {
                convId = existing.id
            } else {
                convId = generateId()
                conversations.push({
                    id: convId,
                    isGroup: false,
                    participants: [userId, recipientId],
                    createdAt: new Date().toISOString()
                })
            }
        }

        const messageId = generateId()
        const newMessage = {
            id: messageId,
            conversationId: convId,
            senderId: userId,
            content,
            createdAt: new Date().toISOString(),
            isRead: false
        }

        messages.push(newMessage)

        res.writeHead(201, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            id: messageId,
            conversationId: convId,
            content,
            senderId: userId,
            createdAt: newMessage.createdAt
        }))
        return
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Not found' }))
}

// Create server
const server = http.createServer(handleRequest)

const PORT = 3001
server.listen(PORT, () => {
    console.log(`🚀 Multi-user chat server running on http://localhost:${PORT}`)
    console.log(`📱 Ready for real Gmail logins and friend connections!`)
    console.log(`👥 Users can register with different emails and connect!`)
})
