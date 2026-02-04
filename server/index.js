import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import messageRoutes from './routes/messages.js'
import { initializeDb } from './db/init.js'
import { verifyToken } from './middleware/auth.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
})

// Initialize database
initializeDb()

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', verifyToken, userRoutes)
app.use('/api/messages', verifyToken, messageRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Socket.io connection handling
const onlineUsers = new Map()

io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('user:online', (userId) => {
        onlineUsers.set(userId, socket.id)
        io.emit('users:online', Array.from(onlineUsers.keys()))
    })

    socket.on('message:send', (data) => {
        const recipientSocket = onlineUsers.get(data.recipientId)
        if (recipientSocket) {
            io.to(recipientSocket).emit('message:receive', data)
        }
    })

    socket.on('typing:start', ({ conversationId, userId }) => {
        socket.broadcast.emit('typing:start', { conversationId, userId })
    })

    socket.on('typing:stop', ({ conversationId, userId }) => {
        socket.broadcast.emit('typing:stop', { conversationId, userId })
    })

    socket.on('disconnect', () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId)
                break
            }
        }
        io.emit('users:online', Array.from(onlineUsers.keys()))
    })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
