const WebSocket = require('ws');
const WS_PORT = 3001;
const wss = new WebSocket.Server({ port: WS_PORT, host: '0.0.0.0' });

let clients = new Map();

wss.on('connection', ws => {
    let username = null;
    ws.on('message', msg => {
        try {
            const data = JSON.parse(msg);
            if (data.type === "join") {
                if ([...clients.keys()].includes(data.username)) {
                    ws.send(JSON.stringify({ type: "server", text: "Username already taken." }));
                    ws.close();
                    return;
                }
                username = data.username;
                clients.set(username, ws);
                broadcastUsers();
            } else if (data.type === "message" || data.type === "file") {
                if (data.to && clients.has(data.to)) {
                    clients.get(data.to).send(JSON.stringify(data));
                    if (data.username !== data.to && clients.has(data.username)) {
                        clients.get(data.username).send(JSON.stringify(data));
                    }
                } else {
                    broadcastAll(JSON.stringify(data));
                }
            }
        } catch {}
    });

    ws.on('close', () => {
        if (username) {
            clients.delete(username);
            broadcastUsers();
        }
    });
    ws.on('error', () => {});
});

function broadcastAll(msg) {
    for (const ws of clients.values()) {
        try { ws.send(msg); } catch {}
    }
}

function broadcastUsers() {
    const users = Array.from(clients.keys());
    const msg = JSON.stringify({ type: "users", users });
    broadcastAll(msg);
}

console.log('WebSocket bridge running on ws://localhost:' + WS_PORT);