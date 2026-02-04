#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.parse
import sqlite3
import os
from datetime import datetime
import uuid

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'db', 'chat.db')

def init_database():
    """Initialize SQLite database with tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            display_name TEXT,
            is_online INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversation_participants (
            conversation_id TEXT,
            user_id TEXT,
            PRIMARY KEY (conversation_id, user_id),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized and ready!")

def get_users():
    """Get all users from database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, username, display_name, is_online FROM users')
    users = [{'id': row[0], 'email': row[1], 'username': row[2], 'displayName': row[3], 'isOnline': bool(row[4])} for row in cursor.fetchall()]
    conn.close()
    return users

def save_user(user_data):
    """Save user to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO users (id, email, username, display_name, is_online)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_data['id'], user_data['email'], user_data['username'], user_data['displayName'], 1))
    conn.commit()
    conn.close()

def update_user_online(user_id, is_online):
    """Update user online status"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_online = ? WHERE id = ?', (1 if is_online else 0, user_id))
    conn.commit()
    conn.close()

def get_conversations_for_user(user_id):
    """Get all conversations for a user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT DISTINCT c.id, c.created_at
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = ?
    ''', (user_id,))
    
    conversations = []
    for row in cursor.fetchall():
        conv_id = row[0]
        
        # Get other participant
        cursor.execute('''
            SELECT u.id, u.username, u.display_name, u.is_online
            FROM users u
            JOIN conversation_participants cp ON u.id = cp.user_id
            WHERE cp.conversation_id = ? AND u.id != ?
        ''', (conv_id, user_id))
        
        other_user = cursor.fetchone()
        if other_user:
            # Get last message
            cursor.execute('''
                SELECT content, created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            ''', (conv_id,))
            
            last_msg = cursor.fetchone()
            
            conversations.append({
                'id': conv_id,
                'name': other_user[2] or other_user[1],
                'lastMessage': last_msg[0] if last_msg else '',
                'lastMessageTime': last_msg[1] if last_msg else row[1],
                'participants': [{
                    'id': other_user[0],
                    'username': other_user[1],
                    'displayName': other_user[2],
                    'isOnline': bool(other_user[3])
                }]
            })
    
    conn.close()
    return conversations

def save_message(message_data):
    """Save message to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create conversation if it doesn't exist
    cursor.execute('''
        SELECT conversation_id FROM conversation_participants 
        WHERE user_id = ? AND conversation_id IN (
            SELECT conversation_id FROM conversation_participants WHERE user_id = ?
        )
    ''', (message_data['senderId'], message_data['recipientId']))
    
    existing_conv = cursor.fetchone()
    
    if not existing_conv:
        # Create new conversation
        conv_id = str(uuid.uuid4())
        cursor.execute('INSERT INTO conversations (id) VALUES (?)', (conv_id,))
        
        # Add participants
        cursor.execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', 
                      (conv_id, message_data['senderId']))
        cursor.execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', 
                      (conv_id, message_data['recipientId']))
    else:
        conv_id = existing_conv[0]
    
    # Save message
    cursor.execute('''
        INSERT INTO messages (id, conversation_id, sender_id, content)
        VALUES (?, ?, ?, ?)
    ''', (message_data['id'], conv_id, message_data['senderId'], message_data['content']))
    
    conn.commit()
    conn.close()
    return conv_id

def get_messages_for_conversation(conversation_id):
    """Get all messages for a conversation"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT m.id, m.content, m.sender_id, m.created_at, u.display_name, u.username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at
    ''', (conversation_id,))
    
    messages = []
    for row in cursor.fetchall():
        messages.append({
            'id': row[0],
            'content': row[1],
            'senderId': row[2],
            'senderName': row[4] or row[3],
            'senderAvatar': None,
            'isRead': False,
            'createdAt': row[3]
        })
    
    conn.close()
    return messages

# Initialize database on startup
init_database()

class ChatHandler(http.server.SimpleHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == '/api/health':
            users_list = get_users()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok', 
                'users': len(users_list),
                'online': len([u for u in users_list if u['isOnline']])
            }).encode())
            return

        if path == '/debug/users':
            users_list = get_users()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'total': len(users_list),
                'online': len([u for u in users_list if u['isOnline']]),
                'users': [{'id': u['id'], 'email': u['email'], 'username': u['username'], 
                         'displayName': u['displayName'], 'isOnline': u['isOnline']} for u in users_list]
            }).encode())
            return

        if path == '/api/users/':
            auth_header = self.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer token-'):
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'No token provided'}).encode())
                return

            user_id = auth_header[13:]  # Remove 'Bearer token-'
            all_users = get_users()
            other_users = [u for u in all_users if u['id'] != user_id]
            
            result = [{'id': u['id'], 'username': u['username'], 'displayName': u['displayName'], 
                      'isOnline': u['isOnline']} for u in other_users]

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return

        if path == '/api/messages/conversations':
            auth_header = self.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer token-'):
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'No token provided'}).encode())
                return

            user_id = auth_header[13:]
            result = get_conversations_for_user(user_id)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return

        # Handle conversation messages
        if path.startswith('/api/messages/conversations/') and path.count('/') == 4:
            auth_header = self.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer token-'):
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'No token provided'}).encode())
                return

            conversation_id = path.split('/')[-1]
            result = get_messages_for_conversation(conversation_id)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return

        # 404
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({'message': 'Not found'}).encode())

    def do_POST(self):
        content_length = int(self.headers.get('content-length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            body = json.loads(post_data) if post_data else {}
        except:
            body = {}

        path = self.path

        if path == '/api/auth/register':
            email = body.get('email')
            password = body.get('password')
            username = body.get('username')
            display_name = body.get('displayName', username)

            # Check if user exists in database
            all_users = get_users()
            if any(u['email'] == email or u['username'] == username for u in all_users):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'Email or username already taken'}).encode())
                return

            # Create new user
            new_user = {
                'id': str(uuid.uuid4()),
                'email': email,
                'username': username,
                'displayName': display_name
            }

            save_user(new_user)
            print(f"✅ User registered: {email}. Total users: {len(get_users())}")

            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'user': {
                    'id': new_user['id'],
                    'email': new_user['email'],
                    'username': new_user['username'],
                    'displayName': new_user['displayName']
                },
                'token': f'token-{new_user["id"]}'
            }).encode())
            return

        if path == '/api/auth/login':
            email = body.get('email')
            password = body.get('password')

            # Find user in database
            all_users = get_users()
            user = next((u for u in all_users if u['email'] == email or u['username'] == email), None)
            
            if not user:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'Invalid credentials'}).encode())
                return

            # Update user online status
            update_user_online(user['id'], True)
            print(f"✅ User logged in: {email}. Online users: {len([u for u in get_users() if u['isOnline']])}")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'username': user['username'],
                    'displayName': user['displayName']
                },
                'token': f'token-{user["id"]}'
            }).encode())
            return

        if path == '/api/messages/send':
            auth_header = self.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer token-'):
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'No token provided'}).encode())
                return

            sender_id = auth_header[13:]
            recipient_id = body.get('recipientId')
            content = body.get('content')

            message_data = {
                'id': str(uuid.uuid4()),
                'senderId': sender_id,
                'recipientId': recipient_id,
                'content': content
            }

            conversation_id = save_message(message_data)
            print(f"✅ Message saved: {sender_id} -> {recipient_id}")

            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'id': message_data['id'],
                'conversationId': conversation_id,
                'content': content,
                'senderId': sender_id,
                'createdAt': datetime.now().isoformat()
            }).encode())
            return

        # 404
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({'message': 'Not found'}).encode())

if __name__ == '__main__':
    PORT = 3001
    with socketserver.TCPServer(("", PORT), ChatHandler) as httpd:
        print('')
        print('🚀🚀🚀 MULTI-USER CHAT SERVER STARTED! 🚀🚀🚀')
        print('')
        print(f'📍 Server: http://localhost:{PORT}')
        print('👥 Users share the SAME data!')
        print(f'🔍 Debug: http://localhost:{PORT}/debug/users')
        print('')
        print('✅ Ready for multiple users to connect!')
        print('✅ Each user will see all other users!')
        print('✅ Real-time messaging between users!')
        print('')
        httpd.serve_forever()
