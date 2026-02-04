import express from 'express'
import { db } from '../db/init.js'

const router = express.Router()

// Get all users (for search/discover)
router.get('/', (req, res) => {
    const { search } = req.query
    let query, params
    if (search) {
        query = `
      SELECT id, username, display_name, avatar_url, is_online 
      FROM users 
      WHERE (username LIKE ? OR display_name LIKE ?) AND id != ?
      LIMIT 20
    `
        params = [`%${search}%`, `%${search}%`, req.userId]
    } else {
        query = `
      SELECT id, username, display_name, avatar_url, is_online 
      FROM users WHERE id != ? LIMIT 20
    `
        params = [req.userId]
    }
    
    db.all(query, params, (err, users) => {
        if (err) {
            console.error('Database error:', err)
            return res.status(500).json({ message: 'Server error' })
        }
        
        res.json(users.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            isOnline: u.is_online === 1
        })))
    })
})

// Get user profile
router.get('/me', (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.userId], (err, user) => {
        if (err) {
            console.error('Database error:', err)
            return res.status(500).json({ message: 'Server error' })
        }
        
        if (!user) return res.status(404).json({ message: 'User not found' })
        
        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            bio: user.bio
        })
    })
})

// Update profile
router.put('/me', (req, res) => {
    const { displayName, bio, avatarUrl } = req.body
    db.run(`
    UPDATE users SET display_name = ?, bio = ?, avatar_url = ? WHERE id = ?
  `, [displayName, bio, avatarUrl, req.userId], (err) => {
        if (err) {
            console.error('Database error:', err)
            return res.status(500).json({ message: 'Server error' })
        }
        res.json({ success: true })
    })
})

export default router
