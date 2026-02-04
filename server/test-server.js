import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' })
})

// Test users endpoint
app.get('/api/users/', (req, res) => {
    res.json([
        {
            id: '1',
            username: 'testuser1',
            displayName: 'Test User 1',
            isOnline: true
        },
        {
            id: '2', 
            username: 'testuser2',
            displayName: 'Test User 2',
            isOnline: false
        }
    ])
})

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`)
})
