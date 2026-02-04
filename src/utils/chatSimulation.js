// Multi-user chat simulation using localStorage
// This simulates a real backend for demo purposes

class ChatSimulation {
    constructor() {
        this.USERS_KEY = 'chat_users'
        this.CONVERSATIONS_KEY = 'chat_conversations'
        this.MESSAGES_KEY = 'chat_messages'
        this.CURRENT_USER_KEY = 'chat_current_user'
    }

    // Initialize demo users
    initDemoUsers() {
        const users = this.getUsers()
        if (users.length === 0) {
            const demoUsers = [
                {
                    id: 'user-1',
                    email: 'alice@gmail.com',
                    username: 'alice',
                    displayName: 'Alice Johnson',
                    password: 'password123',
                    isOnline: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user-2',
                    email: 'bob@gmail.com',
                    username: 'bob',
                    displayName: 'Bob Smith',
                    password: 'password123',
                    isOnline: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user-3',
                    email: 'charlie@gmail.com',
                    username: 'charlie',
                    displayName: 'Charlie Davis',
                    password: 'password123',
                    isOnline: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user-4',
                    email: 'diana@gmail.com',
                    username: 'diana',
                    displayName: 'Diana Prince',
                    password: 'password123',
                    isOnline: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user-5',
                    email: 'eve@gmail.com',
                    username: 'eve',
                    displayName: 'Eve Wilson',
                    password: 'password123',
                    isOnline: true,
                    createdAt: new Date().toISOString()
                }
            ]
            localStorage.setItem(this.USERS_KEY, JSON.stringify(demoUsers))
        }
    }

    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY)
        return users ? JSON.parse(users) : []
    }

    getCurrentUser() {
        const user = localStorage.getItem(this.CURRENT_USER_KEY)
        return user ? JSON.parse(user) : null
    }

    setCurrentUser(user) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user))
    }

    // Auth simulation
    async register(email, password, username, displayName) {
        const users = this.getUsers()
        
        // Check if user exists
        const existingUser = users.find(u => u.email === email || u.username === username)
        if (existingUser) {
            throw new Error('Email or username already taken')
        }

        // Create new user
        const newUser = {
            id: `user-${Date.now()}`,
            email,
            username,
            displayName: displayName || username,
            password, // In production, hash this!
            isOnline: true,
            createdAt: new Date().toISOString()
        }

        users.push(newUser)
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users))

        const token = `mock-token-${newUser.id}`
        this.setCurrentUser({ ...newUser, token })

        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                displayName: newUser.displayName
            },
            token
        }
    }

    async login(email, password) {
        const users = this.getUsers()
        
        // Find user
        const user = users.find(u => u.email === email || u.username === email)
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials')
        }

        // Set user online
        user.isOnline = true
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users))

        const token = `mock-token-${user.id}`
        this.setCurrentUser({ ...user, token })

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName
            },
            token
        }
    }

    // Get other users (excluding current user)
    getOtherUsers(search = '') {
        const currentUser = this.getCurrentUser()
        const users = this.getUsers()
        
        let filteredUsers = users.filter(u => u.id !== currentUser?.id)
        
        if (search) {
            const searchLower = search.toLowerCase()
            filteredUsers = filteredUsers.filter(u =>
                u.displayName.toLowerCase().includes(searchLower) ||
                u.username.toLowerCase().includes(searchLower)
            )
        }

        return filteredUsers.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            isOnline: u.isOnline
        }))
    }

    // Conversation management
    getConversations() {
        const currentUser = this.getCurrentUser()
        const conversations = this.getConversationsData()
        const messages = this.getMessagesData()
        
        const userConversations = conversations.filter(conv =>
            conv.participants.includes(currentUser.id)
        )
        
        const result = userConversations.map(conv => {
            const convMessages = messages.filter(m => m.conversationId === conv.id)
            const lastMessage = convMessages[convMessages.length - 1]
            
            const otherParticipantId = conv.participants.find(p => p !== currentUser.id)
            const otherUser = this.getUsers().find(u => u.id === otherParticipantId)
            
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
        
        return result
    }

    getConversationsData() {
        const conversations = localStorage.getItem(this.CONVERSATIONS_KEY)
        return conversations ? JSON.parse(conversations) : []
    }

    getMessagesData() {
        const messages = localStorage.getItem(this.MESSAGES_KEY)
        return messages ? JSON.parse(messages) : []
    }

    // Send message
    async sendMessage(recipientId, content) {
        const currentUser = this.getCurrentUser()
        const conversations = this.getConversationsData()
        
        // Find or create conversation
        let conversation = conversations.find(conv =>
            conv.participants.includes(currentUser.id) &&
            conv.participants.includes(recipientId) &&
            !conv.isGroup
        )
        
        if (!conversation) {
            conversation = {
                id: `conv-${Date.now()}`,
                isGroup: false,
                participants: [currentUser.id, recipientId],
                createdAt: new Date().toISOString()
            }
            conversations.push(conversation)
            localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations))
        }
        
        // Create message
        const message = {
            id: `msg-${Date.now()}`,
            conversationId: conversation.id,
            senderId: currentUser.id,
            content,
            createdAt: new Date().toISOString(),
            isRead: false
        }
        
        const messages = this.getMessagesData()
        messages.push(message)
        localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages))
        
        return {
            id: message.id,
            conversationId: conversation.id,
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt
        }
    }

    // Get messages for conversation
    getMessages(conversationId) {
        const currentUser = this.getCurrentUser()
        const conversations = this.getConversationsData()
        
        // Verify user is part of conversation
        const conversation = conversations.find(conv =>
            conv.id === conversationId && conv.participants.includes(currentUser.id)
        )
        
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        
        const messages = this.getMessagesData()
        const convMessages = messages.filter(m => m.conversationId === conversationId)
        
        const result = convMessages.map(msg => {
            const sender = this.getUsers().find(u => u.id === msg.senderId)
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
        
        return result
    }

    // Logout
    logout() {
        const currentUser = this.getCurrentUser()
        if (currentUser) {
            const users = this.getUsers()
            const user = users.find(u => u.id === currentUser.id)
            if (user) {
                user.isOnline = false
                localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
            }
        }
        localStorage.removeItem(this.CURRENT_USER_KEY)
    }
}

// Export for use in components
export const chatSim = new ChatSimulation()
