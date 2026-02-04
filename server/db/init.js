import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const db = new sqlite3.Database(join(__dirname, 'chat.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message)
    } else {
        console.log('Connected to SQLite database')
    }
})

export function initializeDb() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            bio TEXT,
            is_online INTEGER DEFAULT 0,
            last_seen TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Users table error:', err)
        })

        db.run(`CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            is_group INTEGER DEFAULT 0,
            name TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Conversations table error:', err)
        })

        db.run(`CREATE TABLE IF NOT EXISTS conversation_participants (
            conversation_id TEXT,
            user_id TEXT,
            joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (conversation_id, user_id),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) console.error('Participants table error:', err)
        })

        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            content TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )`, (err) => {
            if (err) console.error('Messages table error:', err)
        })

        db.run(`CREATE TABLE IF NOT EXISTS statuses (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            expires_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) console.error('Statuses table error:', err)
        })
        
        console.log('Database initialized successfully')
    })
}
