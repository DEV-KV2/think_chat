import express from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/init.js'
import { generateToken } from '../middleware/auth.js'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, username, displayName } = req.body

        // Check if user exists
        db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, existing) => {
            if (err) {
                console.error('Database error:', err)
                return res.status(500).json({ message: 'Server error' })
            }
            
            if (existing) {
                return res.status(400).json({ message: 'Email or username already taken' })
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10)
            const userId = uuidv4()

            // Insert user
            db.run(`
                INSERT INTO users (id, email, username, password, display_name)
                VALUES (?, ?, ?, ?, ?)
            `, [userId, email, username, hashedPassword, displayName || username], function(err) {
                if (err) {
                    console.error('Insert error:', err)
                    return res.status(500).json({ message: 'Server error' })
                }

                const token = generateToken(userId)
                res.status(201).json({
                    user: { id: userId, email, username, displayName: displayName || username },
                    token
                })
            })
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ message: 'Server error' })
    }
})

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, email], async (err, user) => {
            if (err) {
                console.error('Database error:', err)
                return res.status(500).json({ message: 'Server error' })
            }

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            const validPassword = await bcrypt.compare(password, user.password)
            if (!validPassword) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            const token = generateToken(user.id)
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.display_name,
                    avatarUrl: user.avatar_url
                },
                token
            })
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: 'Server error' })
    }
})

// Check username availability
router.get('/check-username', (req, res) => {
    const { username } = req.query
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, existing) => {
        if (err) {
            console.error('Database error:', err)
            return res.status(500).json({ message: 'Server error' })
        }
        res.json({ available: !existing })
    })
})

export default router
