from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
from datetime import datetime
import uuid

# In-memory storage
users = []
conversations = []
messages = []

class ChatHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _get_user_id_from_token(self):
        auth_header = self.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
            if token.startswith('mock-token-'):
                return token[11:]
        return None

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
            return

        if path == '/api/users/':
            user_id = self._get_user_id_from_token()
            if not user_id:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'No token provided'}).encode())
                return

            query_params = urllib.parse.parse_qs(parsed_url.query)
            search = query_params.get('search', [None])[0]

            filtered_users = [u for u in users if u['id'] != user_id]
            
            if search:
                search_lower = search.lower()
                filtered_users = [u for u in filtered_users 
                    if search_lower in u['displayName'].lower() or search_lower in u['username'].lower()]

            result = [{'id': u['id'], 'username': u['username'], 'displayName': u['displayName'], 'isOnline': u['isOnline']} 
                     for u in filtered_users]

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return

        if path == '/api/messages/conversations':
            user_id = self._get_user_id_from_token()
            if not user_id:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'No token provided'}).encode())
                return

            user_conversations = [conv for conv in conversations if user_id in conv['participants']]
            
            result = []
            for conv in user_conversations:
                conv_messages = [m for m in messages if m['conversationId'] == conv['id']]
                last_message = conv_messages[-1] if conv_messages else None
                
                other_participant_id = next((p for p in conv['participants'] if p != user_id), None)
                other_user = next((u for u in users if u['id'] == other_participant_id), None)
                
                result.append({
                    'id': conv['id'],
                    'name': other_user['displayName'] if other_user else 'Unknown',
                    'lastMessage': last_message['content'] if last_message else '',
                    'lastMessageTime': last_message['createdAt'] if last_message else conv['createdAt'],
                    'participants': [{
                        'id': other_user['id'] if other_user else '',
                        'username': other_user['username'] if other_user else '',
                        'displayName': other_user['displayName'] if other_user else '',
                        'isOnline': other_user['isOnline'] if other_user else False
                    }]
                })
            
            result.sort(key=lambda x: x['lastMessageTime'], reverse=True)

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

            # Check if user exists
            existing_user = next((u for u in users if u['email'] == email or u['username'] == username), None)
            if existing_user:
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
                'displayName': display_name,
                'password': password,  # In production, hash this!
                'isOnline': True,
                'createdAt': datetime.now().isoformat()
            }

            users.append(new_user)

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
                'token': f'mock-token-{new_user["id"]}'
            }).encode())
            return

        if path == '/api/auth/login':
            email = body.get('email')
            password = body.get('password')

            # Find user
            user = next((u for u in users if u['email'] == email or u['username'] == email), None)
            if not user or user['password'] != password:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'Invalid credentials'}).encode())
                return

            user['isOnline'] = True

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
                'token': f'mock-token-{user["id"]}'
            }).encode())
            return

        if path == '/api/messages/send':
            user_id = self._get_user_id_from_token()
            if not user_id:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'No token provided'}).encode())
                return

            conversation_id = body.get('conversationId')
            recipient_id = body.get('recipientId')
            content = body.get('content')

            conv_id = conversation_id

            if not conv_id and recipient_id:
                # Check if conversation exists
                existing = next((conv for conv in conversations 
                    if user_id in conv['participants'] and recipient_id in conv['participants'] and not conv.get('isGroup', False)), None)
                
                if existing:
                    conv_id = existing['id']
                else:
                    conv_id = str(uuid.uuid4())
                    conversations.append({
                        'id': conv_id,
                        'isGroup': False,
                        'participants': [user_id, recipient_id],
                        'createdAt': datetime.now().isoformat()
                    })

            message_id = str(uuid.uuid4())
            new_message = {
                'id': message_id,
                'conversationId': conv_id,
                'senderId': user_id,
                'content': content,
                'createdAt': datetime.now().isoformat(),
                'isRead': False
            }

            messages.append(new_message)

            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'id': message_id,
                'conversationId': conv_id,
                'content': content,
                'senderId': user_id,
                'createdAt': new_message['createdAt']
            }).encode())
            return

        # 404
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({'message': 'Not found'}).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 3001), ChatHandler)
    print("🚀 Multi-user chat server running on http://localhost:3001")
    print("📱 Ready for real Gmail logins and friend connections!")
    print("👥 Users can register with different emails and connect!")
    server.serve_forever()
