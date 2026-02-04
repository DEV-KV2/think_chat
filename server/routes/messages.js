import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/init.js'

const router = express.Router()

// Get user's conversations
router.get('/conversations', (req, res) => {
    db.all(`
    SELECT c.*, 
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = ?
    ORDER BY last_message_time DESC
  `, [req.userId], (err, conversations) => {
        if (err) {
            console.error('Database error:', err)
            return res.status(500).json({ message: 'Server error' })
        }

        const result = []
        let completed = 0

        if (conversations.length === 0) {
            return res.json([])
        }

        conversations.forEach((c, index) => {
            db.all(`
        SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_online
        FROM users u
        JOIN conversation_participants cp ON u.id = cp.user_id
        WHERE cp.conversation_id = ? AND u.id != ?
      `, [c.id, req.userId], (err, participants) => {
                if (err) {
                    console.error('Database error:', err)
                    return res.status(500).json({ message: 'Server error' })
                }

                result[index] = {
                    id: c.id,
                    isGroup: c.is_group === 1,
                    name: c.name || (participants[0]?.display_name || participants[0]?.username),
                    lastMessage: c.last_message,
                    lastMessageTime: c.last_message_time,
                    participants: participants.map(p => ({
                        id: p.id,
                        username: p.username,
                        displayName: p.display_name,
                        avatarUrl: p.avatar_url,
                        isOnline: p.is_online === 1
                    }))
                }

                completed++
                if (completed === conversations.length) {
                    res.json(result)
                }
            })
        })
    })
})

// Get messages for a conversation
router.get('/conversations/:id', (req, res) => {
    db.all(`
    SELECT m.*, u.username, u.display_name, u.avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC
  `, [req.params.id], (err, messages) => {
        if (err) {
            console.error('Database error:', err)
            return res.status(500).json({ message: 'Server error' })
        }

        res.json(messages.map(m => ({
            id: m.id,
            content: m.content,
            senderId: m.sender_id,
            senderName: m.display_name || m.username,
            senderAvatar: m.avatar_url,
            isRead: m.is_read === 1,
            createdAt: m.created_at
        })))
    })
})

// Send a message
router.post('/send', (req, res) => {
    const { conversationId, recipientId, content } = req.body
    let convId = conversationId

    // If no conversation exists, create one
    if (!convId && recipientId) {
        // Check if conversation exists between users
        db.get(`
      SELECT cp1.conversation_id 
      FROM conversation_participants cp1
      JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      JOIN conversations c ON cp1.conversation_id = c.id
      WHERE cp1.user_id = ? AND cp2.user_id = ? AND c.is_group = 0
    `, [req.userId, recipientId], (err, existing) => {
            if (err) {
                console.error('Database error:', err)
                return res.status(500).json({ message: 'Server error' })
            }

            if (existing) {
                convId = existing.conversation_id
                sendMessage()
            } else {
                convId = uuidv4()
                db.run('INSERT INTO conversations (id, is_group) VALUES (?, 0)', [convId], (err) => {
                    if (err) {
                        console.error('Database error:', err)
                        return res.status(500).json({ message: 'Server error' })
                    }

                    db.run('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [convId, req.userId], (err) => {
                        if (err) {
                            console.error('Database error:', err)
                            return res.status(500).json({ message: 'Server error' })
                        }

                        db.run('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [convId, recipientId], (err) => {
                            if (err) {
                                console.error('Database error:', err)
                                return res.status(500).json({ message: 'Server error' })
                            }
                            sendMessage()
                        })
                    })
                })
            }
        })
    } else {
        sendMessage()
    }

    function sendMessage() {
        const messageId = uuidv4()
        db.run(`
        INSERT INTO messages (id, conversation_id, sender_id, content)
        VALUES (?, ?, ?, ?)
      `, [messageId, convId, req.userId, content], (err) => {
            if (err) {
                console.error('Database error:', err)
                return res.status(500).json({ message: 'Server error' })
            }

            res.status(201).json({
                id: messageId,
                conversationId: convId,
                content,
                senderId: req.userId,
                createdAt: new Date().toISOString()
            })
        })
    }
})

export default router
