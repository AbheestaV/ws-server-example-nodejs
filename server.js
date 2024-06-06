import WebSocket, { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import winston from 'winston';

// Load env variables
dotenv.config();

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Ensure environment variables are loaded
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    logger.error('One or more environment variables are missing. Please check your .env file.');
    process.exit(1);
}

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        logger.error('Error connecting to MySQL: ', err);
        return;
    }
    logger.info('Connected to MySQL');
});

const clients = new Map(); // Use Map to track clients
const wss = new WebSocketServer({ port: 8080 }); // WebSocket server on port 8080

// Event handler for new connections
wss.on('connection', (ws) => {
    const id = randomUUID();
    clients.set(ws, id);
    logger.info(`New connection assigned id: ${id}`);

    // Message handler
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);

            if (message.type === 'login') {
                const { username, password } = message;
                const user = await getUserByUsername(username);

                if (user && await bcrypt.compare(password, user.password_hash)) {
                    ws.send(JSON.stringify({ type: 'login_success', id, username }));
                } else {
                    ws.send(JSON.stringify({ type: 'login_failure' }));
                }
            } else {
                serverBroadcast(`Client ${clients.get(ws)}: ${data}`);
            }
        } catch (error) {
            logger.error('Error handling message:', error);
        }
    });

    // Close handler
    ws.on('close', () => {
        logger.info(`Connection (id = ${clients.get(ws)}) closed`);
        clients.delete(ws);
    });

    // Assign id to the newly connected client
    ws.send(JSON.stringify({ type: 'assign_id', id }));
});

// Broadcast message every 15 seconds
setInterval(() => {
    logger.info(`Number of connected clients: ${clients.size}`);
    serverBroadcast(`Number of connected clients: ${clients.size}`);
}, 15000);

// Function for broadcasting messages to all clients
function serverBroadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Function to fetch user by username
async function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
            if (err) {
                logger.error('Error fetching user:', err);
                return reject(err);
            }
            resolve(results[0]);
        });
    });
}

logger.info('The server is running and waiting for connections');
