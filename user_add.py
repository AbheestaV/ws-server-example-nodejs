import os
import mysql.connector
from bcrypt import hashpw, gensalt

# Get MySQL connection details from environment variables
mysql_host = os.getenv('DB_HOST')
mysql_user = os.getenv('DB_USER')
mysql_password = os.getenv('DB_PASSWORD')
mysql_database = os.getenv('DB_DATABASE')

# Connect to the MySQL database
conn = mysql.connector.connect(
    host=mysql_host,
    user=mysql_user,
    password=mysql_password,
    database=mysql_database
)
cursor = conn.cursor()


# Credentials 
username = "user1"
password = "password123"
email = "user@example.com"

# Hash a password using bcrypt
password_hash = hashpw(password.encode('utf-8'), gensalt())

# Insert a new user into the 'users' table
add_user = ("INSERT INTO users (username, email, password_hash) "
            "VALUES (%s, %s, %s)")
user_data = (username, email, password_hash.decode('utf-8'))

cursor.execute(add_user, user_data)
conn.commit()

# Close the cursor and connection
cursor.close()
conn.close()
