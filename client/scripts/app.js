document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const publicChatBox = document.getElementById('public-chat-box');
    const privateChatBox = document.getElementById('private-chat-box');
    const publicInput = document.getElementById('public-message-input');
    const privateInput = document.getElementById('private-message-input');
    const publicSendBtn = document.getElementById('public-send-btn');
    const privateSendBtn = document.getElementById('private-send-btn');
    const tabPublic = document.getElementById('tab-public');
    const tabPrivate = document.getElementById('tab-private');
    const publicPanel = document.getElementById('public-chat');
    const privatePanel = document.getElementById('private-chat');
    const privateUserSelect = document.getElementById('private-user-select');
    const myUsernameSpan = document.getElementById('my-username');
    const myAvatar = document.getElementById('my-avatar');
    const modalUsername = document.getElementById('modal-username');
    const modalAvatar = document.getElementById('modal-avatar');
    const modalBtn = document.getElementById('modal-btn');
    const usernameModal = document.getElementById('username-modal');

    let username = '';
    let ws = null;
    let onlineUsers = [];
    let publicMessages = [];
    let privateMessages = {}; // { username: [messages] }
    let currentPrivateUser = null;

    // Tab switching
    tabPublic.onclick = () => {
        tabPublic.classList.add('active');
        tabPrivate.classList.remove('active');
        publicPanel.classList.add('active');
        privatePanel.classList.remove('active');
    };
    tabPrivate.onclick = () => {
        tabPrivate.classList.add('active');
        tabPublic.classList.remove('active');
        publicPanel.classList.remove('active');
        privatePanel.classList.add('active');
        updatePrivateUserSelect();
    };

    // Modal logic
    modalUsername.addEventListener('input', () => {
        modalAvatar.textContent = getAvatar(modalUsername.value);
    });
    modalBtn.onclick = () => {
        const name = modalUsername.value.trim();
        if (!name) return;
        username = name;
        usernameModal.style.display = 'none';
        document.querySelector('.chat-app').style.display = '';
        myUsernameSpan.textContent = username;
        myAvatar.textContent = getAvatar(username);
        connectWS();
    };
    modalUsername.addEventListener('keydown', e => {
        if (e.key === 'Enter') modalBtn.click();
    });
    window.onload = () => {
        modalUsername.focus();
        modalAvatar.textContent = getAvatar('');
    };

    // WebSocket logic
    function connectWS() {
        ws = new WebSocket('ws://localhost:3001');
        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "join", username }));
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "users") {
                    onlineUsers = data.users;
                    updateUsersList();
                    updatePrivateUserSelect();
                } else if (data.type === "message") {
                    if (!data.to) {
                        publicMessages.push(data);
                        renderPublicMessages();
                    } else {
                        const other = data.username === username ? data.to : data.username;
                        if (!privateMessages[other]) privateMessages[other] = [];
                        privateMessages[other].push(data);
                        if (currentPrivateUser === other) renderPrivateMessages();
                    }
                } else if (data.type === "server") {
                    // Optionally show server messages
                } else if (data.type === "typing" && data.username !== username) {
                    // Show "User is typing..." somewhere in the UI
                } else if (data.type === "stop_typing" && data.username !== username) {
                    // Hide typing indicator
                }
            } catch {}
        };
    }

    // Sending messages
    publicSendBtn.onclick = () => {
        const msg = publicInput.value.trim();
        if (!msg) return;
        ws.send(JSON.stringify({
            type: "message",
            username,
            text: msg,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            to: null
        }));
        publicInput.value = '';
    };
    privateSendBtn.onclick = () => {
        const msg = privateInput.value.trim();
        if (!msg || !currentPrivateUser) return;
        ws.send(JSON.stringify({
            type: "message",
            username,
            text: msg,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            to: currentPrivateUser
        }));
        privateInput.value = '';
    };

    // Rendering
    function renderPublicMessages() {
        publicChatBox.innerHTML = '';
        publicMessages.forEach(msg => {
            publicChatBox.innerHTML += `<div class="message"><b>${msg.username}:</b> ${msg.text} <span class="timestamp">${msg.timestamp}</span></div>`;
        });
        publicChatBox.scrollTop = publicChatBox.scrollHeight;
    }
    function renderPrivateMessages() {
        if (!currentPrivateUser) return;
        privateChatBox.innerHTML = '';
        (privateMessages[currentPrivateUser] || []).forEach(msg => {
            privateChatBox.innerHTML += `<div class="message"><b>${msg.username}:</b> ${msg.text} <span class="timestamp">${msg.timestamp}</span></div>`;
        });
        privateChatBox.scrollTop = privateChatBox.scrollHeight;
    }

    function updateUsersList() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        onlineUsers.forEach(user => {
            if (user === username) return;
            const li = document.createElement('li');
            li.innerHTML = `<span class="avatar">${getAvatar(user)}</span> <span class="username">${user}</span> <span class="status-indicator">●</span>`;
            usersList.appendChild(li);
        });
        if (usersList.children.length === 0) {
            usersList.innerHTML = '<li class="no-users">No one else online</li>';
        }
    }

    function updatePrivateUserSelect() {
        privateUserSelect.innerHTML = '';
        onlineUsers.forEach(user => {
            if (user !== username) {
                const opt = document.createElement('option');
                opt.value = user;
                opt.textContent = user;
                privateUserSelect.appendChild(opt);
            }
        });
        if (privateUserSelect.options.length > 0) {
            currentPrivateUser = privateUserSelect.value;
            renderPrivateMessages();
        } else {
            currentPrivateUser = null;
            privateChatBox.innerHTML = '<div>No users online for private chat.</div>';
        }
    }
    privateUserSelect.onchange = () => {
        currentPrivateUser = privateUserSelect.value;
        renderPrivateMessages();
    };

    function getAvatar(name) {
        return name[0] ? name[0].toUpperCase() : '?';
    }

    // Add after DOMContentLoaded
    let typingTimeout;
    publicInput.addEventListener('input', () => {
        ws.send(JSON.stringify({ type: "typing", username }));
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            ws.send(JSON.stringify({ type: "stop_typing", username }));
        }, 1500);
    });
});

