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
    const profileModal = document.getElementById('profile-modal');
    const openProfileBtn = document.getElementById('open-profile-btn');
    const profileAvatarInput = document.getElementById('profile-avatar-input');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    const profileDisplayName = document.getElementById('profile-displayname');
    const profileStatus = document.getElementById('profile-status');
    const profileSaveBtn = document.getElementById('profile-save-btn');
    const profileCancelBtn = document.getElementById('profile-cancel-btn');
    const logoutBtn = document.getElementById('logout-btn');

    let username = '';
    let ws = null;
    let onlineUsers = [];
    let publicMessages = [];
    let privateMessages = {}; // { username: [messages] }
    let currentPrivateUser = null;
    let profile = {
        avatar: '', // base64 string
        displayName: '',
        status: ''
    };

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

    // Show profile modal on first load
    window.onload = () => {
        profileModal.style.display = 'block';
    };

    // WebSocket logic
    function connectWS() {
        ws = new WebSocket('ws://192.168.10.17:3001');
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
                } else if (data.type === "message" || data.type === "file") {
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
            if (msg.type === "file") {
                publicChatBox.innerHTML += `
                    <div class="message">
                        <div class="message-content">
                            <b>${msg.username}:</b>
                            <a href="${msg.data}" download="${msg.filename}" target="_blank">
                                📎 ${msg.filename}
                            </a>
                            <span class="timestamp">${msg.timestamp}</span>
                        </div>
                    </div>`;
            } else {
                publicChatBox.innerHTML += `
                    <div class="message">
                        <div class="message-content">
                            <b>${msg.username}:</b> ${msg.text}
                            <span class="timestamp">${msg.timestamp}</span>
                        </div>
                    </div>`;
            }
        });
        publicChatBox.scrollTop = publicChatBox.scrollHeight;
    }

    function renderPrivateMessages() {
        if (!currentPrivateUser) return;
        privateChatBox.innerHTML = '';
        (privateMessages[currentPrivateUser] || []).forEach(msg => {
            if (msg.type === "file") {
                privateChatBox.innerHTML += `
                    <div class="message">
                        <div class="message-content">
                            <b>${msg.username}:</b>
                            <a href="${msg.data}" download="${msg.filename}" target="_blank">
                                📎 ${msg.filename}
                            </a>
                            <span class="timestamp">${msg.timestamp}</span>
                        </div>
                    </div>`;
            } else {
                privateChatBox.innerHTML += `
                    <div class="message">
                        <div class="message-content">
                            <b>${msg.username}:</b> ${msg.text}
                            <span class="timestamp">${msg.timestamp}</span>
                        </div>
                    </div>`;
            }
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

    // Emoji Picker for Public Chat
    const emojiBtnPublic = document.getElementById('emoji-btn-public');
    const emojiPickerPublic = document.createElement('emoji-picker');
    emojiPickerPublic.style.position = 'absolute';
    emojiPickerPublic.style.bottom = '60px';
    emojiPickerPublic.style.left = '10px';
    emojiPickerPublic.style.display = 'none';
    document.body.appendChild(emojiPickerPublic);

    emojiBtnPublic.addEventListener('click', () => {
        emojiPickerPublic.style.display = emojiPickerPublic.style.display === 'none' ? 'block' : 'none';
    });
    emojiPickerPublic.addEventListener('emoji-click', event => {
        publicInput.value += event.detail.unicode;
        emojiPickerPublic.style.display = 'none';
    });

    // Emoji Picker for Private Chat
    const emojiBtnPrivate = document.getElementById('emoji-btn-private');
    const emojiPickerPrivate = document.createElement('emoji-picker');
    emojiPickerPrivate.style.position = 'absolute';
    emojiPickerPrivate.style.bottom = '60px';
    emojiPickerPrivate.style.left = '10px';
    emojiPickerPrivate.style.display = 'none';
    document.body.appendChild(emojiPickerPrivate);

    emojiBtnPrivate.addEventListener('click', () => {
        emojiPickerPrivate.style.display = emojiPickerPrivate.style.display === 'none' ? 'block' : 'none';
    });
    emojiPickerPrivate.addEventListener('emoji-click', event => {
        privateInput.value += event.detail.unicode;
        emojiPickerPrivate.style.display = 'none';
    });

    // File sending for Public Chat
    const publicFileInput = document.getElementById('public-file-input');
    const publicFileBtn = document.getElementById('public-file-btn');
    publicFileBtn.onclick = () => publicFileInput.click();
    publicFileInput.onchange = () => {
        const file = publicFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            ws.send(JSON.stringify({
                type: "file",
                username,
                filename: file.name,
                filetype: file.type,
                data: e.target.result,
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                to: null
            }));
        };
        reader.readAsDataURL(file);
    };

    // File sending for Private Chat
    const privateFileInput = document.getElementById('private-file-input');
    const privateFileBtn = document.getElementById('private-file-btn');
    privateFileBtn.onclick = () => privateFileInput.click();
    privateFileInput.onchange = () => {
        const file = privateFileInput.files[0];
        if (!file || !currentPrivateUser) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            ws.send(JSON.stringify({
                type: "file",
                username,
                filename: file.name,
                filetype: file.type,
                data: e.target.result,
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                to: currentPrivateUser
            }));
        };
        reader.readAsDataURL(file);
    };

    // Profile logic
    openProfileBtn.onclick = () => {
        profileModal.style.display = 'block';
        profileAvatarPreview.style.backgroundImage = profile.avatar ? `url(${profile.avatar})` : '';
        profileDisplayName.value = profile.displayName || username;
        profileStatus.value = profile.status || '';
    };

    profileAvatarInput.onchange = () => {
        const file = profileAvatarInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            profile.avatar = e.target.result;
            profileAvatarPreview.style.backgroundImage = `url(${profile.avatar})`;
        };
        reader.readAsDataURL(file);
    };

    profileSaveBtn.onclick = () => {
        profile.displayName = profileDisplayName.value.trim() || username;
        profile.status = profileStatus.value.trim();
        if (!username) {
            username = profile.displayName;
            document.querySelector('.chat-app').style.display = '';
            connectWS();
        }
        // Update UI
        myUsernameSpan.textContent = profile.displayName;
        myAvatar.style.backgroundImage = profile.avatar ? `url(${profile.avatar})` : '';
        // Optionally show status somewhere
        profileModal.style.display = 'none';
    };

    profileCancelBtn.onclick = () => {
        profileModal.style.display = 'none';
    };

    logoutBtn.onclick = () => {
        // Optionally: ws.close();
        location.reload();
    };
});

