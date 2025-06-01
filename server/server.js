const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Store connected users
const users = new Set();

wss.on('connection', (ws) => {
    let username = '';

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join':
                    username = data.username;
                    users.add(username);
                    // Broadcast updated user list to all clients
                    broadcastUsers();
                    // Send welcome message
                    broadcastMessage({
                        type: 'server',
                        text: `${username} has joined the chat!`
                    });
                    break;

                case 'message':
                    if (data.to) {
                        // Private message
                        const targetWs = Array.from(wss.clients).find(client => 
                            client.username === data.to
                        );
                        if (targetWs) {
                            targetWs.send(JSON.stringify({
                                type: 'message',
                                username: username,
                                text: data.text,
                                timestamp: data.timestamp,
                                to: data.to
                            }));
                        }
                        // Send to sender
                        ws.send(JSON.stringify({
                            type: 'message',
                            username: username,
                            text: data.text,
                            timestamp: data.timestamp,
                            to: data.to
                        }));
                    } else {
                        // Public message
                        broadcastMessage({
                            type: 'message',
                            username: username,
                            text: data.text,
                            timestamp: data.timestamp
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (username) {
            users.delete(username);
            broadcastUsers();
            broadcastMessage({
                type: 'server',
                text: `${username} has left the chat.`
            });
        }
    });

    // Store username in the WebSocket object
    ws.username = username;
});

function broadcastUsers() {
    const userList = Array.from(users);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'users',
                users: userList
            }));
        }
    });
}

function broadcastMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 