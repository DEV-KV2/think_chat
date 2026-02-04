const http = require('http')
const url = require('url')

// Shared storage for all users
const users = []
const conversations = []
const messages = []

function generateId() {
    return Math.random().toString(36).substr(2, 9)
}

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

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
    }

    const parsedUrl = url.parse(req.url, true)
    const path = parsedUrl.pathname
    const method = req.method

    console.log(`${method} ${path}`)

    // Health check
    if (path === '/api/health' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
            status: 'ok', 
            users: users.length,
            online: users.filter(u => u.isOnline).length 
        }))
        return
    }

    // Debug endpoint
    if (path === '/debug/users' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            total: users.length,
            online: users.filter(u => u.isOnline).length,
            users: users.map(u => ({
                id: u.id,
                email: u.email,
                username: u.username,
                displayName: u.displayName,
                isOnline: u.isOnline
            }))
        }))
        return
    }

    // Auth routes
    if (path === '/api/auth/register' && method === 'POST') {
        const body = await parseBody(req)
        const { email, password, username, displayName } = body

        console.log('Register:', email, username)

        const existingUser = users.find(u => u.email === email || u.username === username)
        if (existingUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Email or username already taken' }))
            return
        }

        const newUser = {
            id: generateId(),
            email,
            username,
            displayName: displayName || username,
            password,
            isOnline: true,
            createdAt: new Date().toISOString()
        }

        users.push(newUser)
        console.log('User registered. Total:', users.length)

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

        console.log('Login:', email)

        const user = users.find(u => u.email === email || u.username === email)
        if (!user || user.password !== password) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Invalid credentials' }))
            return
        }

        user.isOnline = true
        console.log('User logged in. Online:', users.filter(u => u.isOnline).length)

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

    // Get user ID from token
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
            const searchLower = search.toLowerCase()
            filteredUsers = filteredUsers.filter(u =>
                u.displayName.toLowerCase().includes(searchLower) ||
                u.username.toLowerCase().includes(searchLower)
            )
            console.log('Search:', search, 'Found:', filteredUsers.length)
        }

        const result = filteredUsers.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            isOnline: u.isOnline
        }))

        console.log('Returning', result.length, 'users to', userId)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
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

        console.log('Message:', userId, '->', recipientId, ':', content)

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
                console.log('New conversation:', convId)
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
        console.log('Message saved:', messageId)

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

    if (path.startsWith('/api/messages/conversations/') && method === 'GET') {
        const userId = getUserId(req)
        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'No token provided' }))
            return
        }

        const conversationId = path.split('/')[3]
        const conversation = conversations.find(conv =>
            conv.id === conversationId && conv.participants.includes(userId)
        )

        if (!conversation) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Conversation not found' }))
            return
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

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
        return
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Not found' }))
})

const PORT = 3001
server.listen(PORT, () => {
    console.log('🚀 Multi-user chat server running on http://localhost:' + PORT)
    console.log('📱 Ready for real Gmail logins and friend connections!')
    console.log('👥 All users share the same data!')
    console.log('🔍 Debug users at: http://localhost:' + PORT + '/debug/users')
    console.log('💝 Server is ready for multiple users!')
})
