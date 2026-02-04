#!/usr/bin/env python3
import sqlite3
import os

# Test database connection
DB_PATH = os.path.join(os.path.dirname(__file__), 'db', 'chat.db')

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("✅ Tables in database:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Check users
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"✅ Total users: {user_count}")
    
    # Show some users
    cursor.execute("SELECT id, email, username, display_name, is_online FROM users LIMIT 5")
    users = cursor.fetchall()
    print("✅ Recent users:")
    for user in users:
        status = "🟢 Online" if user[4] else "⚫ Offline"
        print(f"  - {user[2]} ({user[1]}) - {status}")
    
    conn.close()
    print("✅ Database connection successful!")
    
except Exception as e:
    print(f"❌ Database error: {e}")
