from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import time
import os

app = Flask(__name__)
CORS(app)

def get_db_connection():
    max_retries = 30
    retry_count = 0
    
    db_config = {
        'host': os.getenv('DB_HOST', 'db'),
        'database': os.getenv('DB_NAME', 'myapp'),
        'user': os.getenv('DB_USER', 'user'),
        'password': os.getenv('DB_PASSWORD', 'password'),
        'port': int(os.getenv('DB_PORT', '3306'))
    }
    
    while retry_count < max_retries:
        try:
            conn = mysql.connector.connect(**db_config)
            print("Database connection successful!")
            return conn
        except mysql.connector.Error as e:
            print(f"Database connection attempt {retry_count + 1}/30 failed: {e}")
            retry_count += 1
            time.sleep(2)
    
    raise Exception("Could not connect to database after 30 attempts")

def init_db():
    print("Waiting for database connection...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit() 
    cursor.close()
    conn.close()
    print("Database initialized successfully!")

@app.route('/')
def home():
    return jsonify({
        "message": "User Registration Backend is running!",
        "version": "1.0.0",
        "status": "active"
    })

@app.route('/health')
def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "service": "user-registration-backend",
            "database": "connected",
            "timestamp": time.time()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "service": "user-registration-backend",
            "database": "disconnected",
            "error": str(e),
            "timestamp": time.time()
        }), 503

@app.route('/api/test')
def test_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 'MySQL connection successful!' as message")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": result[0]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        
        user_list = []
        for user in users:
            user_list.append({
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "phone": user[3],
                "created_at": str(user[4])
            })
        
        return jsonify({"status": "success", "users": user_list})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/users', methods=['POST'])
def add_user():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"status": "error", "message": "No data provided"})
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        if not name:
            return jsonify({"status": "error", "message": "Name is required"})
        
        if not email:
            return jsonify({"status": "error", "message": "Email is required"})
        
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({"status": "error", "message": "Invalid email format"})
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO users (name, email, phone) VALUES (%s, %s, %s)",
            (name, email, phone if phone else None)
        )
        
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success", 
            "message": "User added successfully",
            "user_id": user_id
        })
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            return jsonify({"status": "error", "message": "Email already exists"})
        return jsonify({"status": "error", "message": "Database integrity error"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"status": "error", "message": "User not found"})
        
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": "User deleted successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"status": "error", "message": "No data provided"})
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        # Validation
        if not name:
            return jsonify({"status": "error", "message": "Name is required"})
        
        if not email:
            return jsonify({"status": "error", "message": "Email is required"})
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET name = %s, email = %s, phone = %s WHERE id = %s",
            (name, email, phone if phone else None, user_id)
        )
        
        conn.commit()
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"status": "error", "message": "User not found"})
        
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "message": "User updated successfully"})
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            return jsonify({"status": "error", "message": "Email already exists"})
        return jsonify({"status": "error", "message": "Database integrity error"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    print("Starting Flask application...")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Database Host: {os.getenv('DB_HOST', 'db')}")
    
    init_db()
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"Flask app running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)