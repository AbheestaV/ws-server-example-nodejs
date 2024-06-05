import WebSocket, { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import mysql from 'mysql';
import dotenv from 'dotenv';

// Load env variable
dotenv.config();

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        return;
    }
    console.log('Connected to MySQL');
});

const clients = new Map(); // has to be a Map instead of {} due to non-string keys
const wss = new WebSocketServer({ port: 8080 }); // initiate a new server that listens on port 8080

// set up event handlers and do other things upon a client connecting to the server
wss.on('connection', (ws) => {
    // create an id to track the client
    const id = randomUUID();
    clients.set(ws, id);
    console.log(`new connection assigned id: ${id}`);

    // send a message to all connected clients upon receiving a message from one of the connected clients
    ws.on('message', async (data) => {
        const message = JSON.parse(data);

        if(message.type === 'login') {
            const { username, password } = message;
            const user = await getUserByUsername(username);

            if (user && await bcrypt.compare(password, user.password_hash)) {
                ws.send(JSON.stringify({ type: 'login_success', id, username}));
            } else {
                ws.send(JSON.stringify({ type: 'login_failure' }));
            }
        } else {
            serverBroadcast('Client ${clients.get(ws)} ${data}');
        }

        
    });

    // stop tracking the client upon that client closing the connection
    ws.on('close', () => {
        console.log(`connection (id = ${clients.get(ws)}) closed`);
        clients.delete(ws);
    });

    // send the id back to the newly connected client
    ws.send(JSON.stringify({ type: 'assign_id', id}));
});

// send a message to all the connected clients about how many of them there are every 15 seconds
setInterval(() => {
    console.log(`Number of connected clients: ${clients.size}`);
    serverBroadcast(`Number of connected clients: ${clients.size}`);
}, 15000);

// function for sending a message to every connected client
function serverBroadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

async function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return reject(err);
            }
            resolve(results[0]);
        });
    });
}


console.log('The server is running and waiting for connections');