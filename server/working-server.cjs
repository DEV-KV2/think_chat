// Ultra-simple server - no dependencies needed
const http = require('http');

const users = [];
const conversations = [];
const messages = [];

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const url = req.url;
        const method = req.method;

        console.log(`${method} ${url}`);

        // Health check
        if (url === '/api/health' && method === 'GET') {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({status: 'ok', users: users.length}));
            return;
        }

        // Debug users
        if (url === '/debug/users' && method === 'GET') {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                total: users.length,
                users: users.map(u => ({
                    id: u.id,
                    email: u.email,
                    username: u.username,
                    displayName: u.displayName,
                    isOnline: u.isOnline
                }))
            }));
            return;
        }

        // Register
        if (url === '/api/auth/register' && method === 'POST') {
            try {
                const data = JSON.parse(body);
                const { email, password, username, displayName } = data;

                if (users.find(u => u.email === email || u.username === username)) {
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: 'Email or username already taken'}));
                    return;
                }

                const newUser = {
                    id: 'user-' + Date.now() + '-' + Math.random(),
                    email,
                    username,
                    displayName: displayName || username,
                    password,
                    isOnline: true,
                    createdAt: new Date().toISOString()
                };

                users.push(newUser);
                console.log('✅ User registered:', email, 'Total:', users.length);

                res.writeHead(201, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        username: newUser.username,
                        displayName: newUser.displayName
                    },
                    token: 'token-' + newUser.id
                }));
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'Invalid request'}));
            }
            return;
        }

        // Login
        if (url === '/api/auth/login' && method === 'POST') {
            try {
                const data = JSON.parse(body);
                const { email, password } = data;

                const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
                if (!user) {
                    res.writeHead(401, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: 'Invalid credentials'}));
                    return;
                }

                user.isOnline = true;
                console.log('✅ User logged in:', email, 'Online:', users.filter(u => u.isOnline).length);

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        displayName: user.displayName
                    },
                    token: 'token-' + user.id
                }));
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'Invalid request'}));
            }
            return;
        }

        // Get users
        if (url === '/api/users/' && method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer token-')) {
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'No token provided'}));
                return;
            }

            const userId = authHeader.substring(13); // Remove 'Bearer token-'
            const searchUsers = users.filter(u => u.id !== userId);

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(searchUsers.map(u => ({
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                isOnline: u.isOnline
            }))));
            return;
        }

        // Send message
        if (url === '/api/messages/send' && method === 'POST') {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer token-')) {
                    res.writeHead(401, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: 'No token provided'}));
                    return;
                }

                const senderId = authHeader.substring(13);
                const data = JSON.parse(body);
                const { recipientId, content } = data;

                // Find or create conversation
                let conversation = conversations.find(conv => 
                    conv.participants.includes(senderId) && 
                    conv.participants.includes(recipientId)
                );

                if (!conversation) {
                    conversation = {
                        id: 'conv-' + Date.now() + '-' + Math.random(),
                        participants: [senderId, recipientId],
                        createdAt: new Date().toISOString()
                    };
                    conversations.push(conversation);
                    console.log('✅ New conversation created');
                }

                const message = {
                    id: 'msg-' + Date.now() + '-' + Math.random(),
                    conversationId: conversation.id,
                    senderId,
                    content,
                    createdAt: new Date().toISOString()
                };

                messages.push(message);
                console.log('✅ Message sent:', senderId, '->', recipientId);

                res.writeHead(201, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    id: message.id,
                    conversationId: conversation.id,
                    content,
                    senderId,
                    createdAt: message.createdAt
                }));
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'Invalid request'}));
            }
            return;
        }

        // Get conversations
        if (url === '/api/messages/conversations' && method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer token-')) {
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'No token provided'}));
                return;
            }

            const userId = authHeader.substring(13);
            const userConversations = conversations.filter(conv => conv.participants.includes(userId));

            const result = userConversations.map(conv => {
                const convMessages = messages.filter(m => m.conversationId === conv.id);
                const lastMessage = convMessages[convMessages.length - 1];
                const otherParticipantId = conv.participants.find(p => p !== userId);
                const otherUser = users.find(u => u.id === otherParticipantId);

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
                };
            });

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result));
            return;
        }

        // 404
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'Not found'}));
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log('');
    console.log('🚀🚀🚀 MULTI-USER CHAT SERVER STARTED! 🚀🚀🚀');
    console.log('');
    console.log('📍 Server: http://localhost:' + PORT);
    console.log('👥 Users share the SAME data!');
    console.log('🔍 Debug: http://localhost:' + PORT + '/debug/users');
    console.log('');
    console.log('✅ Ready for multiple users to connect!');
    console.log('✅ Each user will see all other users!');
    console.log('✅ Real-time messaging between users!');
    console.log('');
});
