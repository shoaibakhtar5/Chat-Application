const WebSocket = require('ws');
const WS_PORT = 3001;
const wss = new WebSocket.Server({ port: WS_PORT, host: '0.0.0.0' });

let clients = new Map();
let groups = {}; // groupId: { name, avatar, code, members: [username], admins: [username] }

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
                // FIX: Broadcast group list to ALL clients, not just the new one
                broadcastAll(JSON.stringify({ type: "groups_list", groups }));
            } else if (data.type === "message") {
                if (data.to && clients.has(data.to)) {
                    clients.get(data.to).send(JSON.stringify(data));
                    if (data.username !== data.to && clients.has(data.username)) {
                        clients.get(data.username).send(JSON.stringify(data));
                    }
                } else {
                    broadcastAll(JSON.stringify(data));
                }
            } else if (data.type === "file") {
                if (data.groupId && groups[data.groupId]) {
                    // Group file: send to all group members
                    groups[data.groupId].members.forEach(member => {
                        if (clients.has(member)) {
                            clients.get(member).send(JSON.stringify(data));
                        }
                    });
                } else if (data.to && clients.has(data.to)) {
                    // Private file
                    clients.get(data.to).send(JSON.stringify(data));
                    if (data.username !== data.to && clients.has(data.username)) {
                        clients.get(data.username).send(JSON.stringify(data));
                    }
                } else {
                    // Public file
                    broadcastAll(JSON.stringify(data));
                }
            } else if (data.type === "create_group") {
                const groupId = "group_" + Date.now();
                groups[groupId] = {
                    name: data.groupName,
                    avatar: data.groupAvatar,
                    code: data.groupCode,
                    members: [data.username],
                    admins: [data.username]
                };
                broadcastAll(JSON.stringify({ type: "groups_list", groups }));
                // Notify creator of the new group ID
                if (clients.has(data.username)) {
                    clients.get(data.username).send(JSON.stringify({ type: "group_created", groupId }));
                }
                console.log('Broadcasting groups_list:', groups);
            } else if (data.type === "join_group") {
                const groupId = Object.keys(groups).find(id => groups[id].code === data.groupCode);
                if (groupId && !groups[groupId].members.includes(data.username)) {
                    groups[groupId].members.push(data.username);
                    broadcastAll(JSON.stringify({ type: "groups_list", groups }));
                    // Notify joiner of the group ID
                    if (clients.has(data.username)) {
                        clients.get(data.username).send(JSON.stringify({ type: "group_joined", groupId }));
                    }
                } else {
                    if (clients.has(data.username)) {
                        clients.get(data.username).send(JSON.stringify({ type: "join_group_error", message: "Invalid code or already joined." }));
                    }
                }
            } else if (data.type === "group_message") {
                if (groups[data.groupId]) {
                    groups[data.groupId].members.forEach(member => {
                        if (clients.has(member)) {
                            clients.get(member).send(JSON.stringify(data));
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Error handling message:', e);
        }
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