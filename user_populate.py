import mysql.connector
from mysql.connector import Error
import bcrypt
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database connection parameters
db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

# Sample user data
users = [
    {'username': 'alice', 'email': 'alice@example.com', 'password': 'password123'},
    {'username': 'bob', 'email': 'bob@example.com', 'password': 'password123'},
    {'username': 'charlie', 'email': 'charlie@example.com', 'password': 'password123'},
    {'username': 'user1', 'email': 'user1@example.com', 'password': 'password123'}
]

def create_connection():
    """Create a database connection"""
    connection = None
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("Connected to MySQL database")
    except Error as e:
        print(f"Error: '{e}'")
    return connection

def hash_password(password):
    """Hash a password for storing."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

def insert_user(connection, user):
    """Insert a new user into the users table"""
    cursor = connection.cursor()
    hashed_password = hash_password(user['password'])
    insert_query = """
    INSERT INTO users (username, email, password_hash)
    VALUES (%s, %s, %s)
    """
    cursor.execute(insert_query, (user['username'], user['email'], hashed_password))
    connection.commit()
    print(f"User {user['username']} added successfully")

def main():
    connection = create_connection()
    if connection:
        for user in users:
            insert_user(connection, user)
        connection.close()

if __name__ == '__main__':
    main()
