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
    const groupTabs = document.getElementById('group-tabs');
    const publicPanel = document.getElementById('public-chat');
    const privatePanel = document.getElementById('private-chat');
    const groupChatPanel = document.getElementById('group-chat');
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
    const groupsList = document.getElementById('groups-list');
    const createGroupBtn = document.getElementById('create-group-btn');
    const groupModal = document.getElementById('group-modal');
    const tabCreateGroup = document.getElementById('tab-create-group');
    const tabJoinGroup = document.getElementById('tab-join-group');
    const createGroupPanel = document.getElementById('create-group-panel');
    const joinGroupPanel = document.getElementById('join-group-panel');
    const groupNameInput = document.getElementById('group-name-input');
    const groupAvatarInput = document.getElementById('group-avatar-input');
    const groupCodeInput = document.getElementById('group-code-input');
    const groupCreateBtn = document.getElementById('group-create-btn');
    const groupCancelBtn = document.getElementById('group-cancel-btn');
    const joinGroupCodeInput = document.getElementById('join-group-code-input');
    const groupJoinBtn = document.getElementById('group-join-btn');
    const groupCancelBtn2 = document.getElementById('group-cancel-btn2');
    const groupChatBox = document.getElementById('group-chat-box');
    const groupMessageInput = document.getElementById('group-message-input');
    const groupSendBtn = document.getElementById('group-send-btn');

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
    let myGroups = {}; // groupId: { name, avatar, members, admins }
    let groupMessages = {}; // groupId: [messages]
    let currentGroupId = null;

    // Tab switching
    tabPublic.onclick = () => {
        setActiveTab(tabPublic);
        publicPanel.classList.add('active');
        privatePanel.classList.remove('active');
        groupChatPanel.classList.remove('active');
    };
    tabPrivate.onclick = () => {
        setActiveTab(tabPrivate);
        publicPanel.classList.remove('active');
        privatePanel.classList.add('active');
        groupChatPanel.classList.remove('active');
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
            const data = JSON.parse(event.data);
            if (data.type === "users") {
                onlineUsers = data.users;
                updateUsersList();
                updatePrivateUserSelect();
            } else if (data.type === "message" || (data.type === "file" && !data.groupId)) {
                // Public or private
                if (!data.to) {
                    publicMessages.push(data);
                    renderPublicMessages();
                } else {
                    const other = data.username === username ? data.to : data.username;
                    if (!privateMessages[other]) privateMessages[other] = [];
                    privateMessages[other].push(data);
                    if (currentPrivateUser === other) renderPrivateMessages();
                }
            } else if (data.type === "groups_list") {
                myGroups = data.groups;
                renderGroups(myGroups);
                renderGroupTabs(myGroups);
            } else if (data.type === "group_message") {
                if (!groupMessages[data.groupId]) groupMessages[data.groupId] = [];
                groupMessages[data.groupId].push(data);
                if (currentGroupId === data.groupId) renderGroupMessages();
            } else if (data.type === "file" && data.groupId) {
                if (!groupMessages[data.groupId]) groupMessages[data.groupId] = [];
                groupMessages[data.groupId].push(data);
                if (currentGroupId === data.groupId) renderGroupMessages();
            } else if (data.type === "join_group_error") {
                alert(data.message || "Could not join group.");
            }
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
    groupSendBtn.onclick = () => {
        const msg = groupMessageInput.value.trim();
        if (!msg || !currentGroupId) return;
        ws.send(JSON.stringify({
            type: "group_message",
            groupId: currentGroupId,
            username,
            text: msg,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));
        groupMessageInput.value = '';
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

    // Show groups on Home page (Groups list)
    function renderGroups(groups) {
        groupsList.innerHTML = '';
        Object.entries(groups).forEach(([groupId, group]) => {
            if (!group.members.includes(username)) return;
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="avatar" style="background-image:url('${group.avatar || ''}')">${group.avatar ? '' : group.name[0]}</span>
                <span class="group-name">${group.name}</span>
                <span class="group-members">(${group.members.length})</span>
            `;
            groupsList.appendChild(li);
        });
    }

    // Show group chat panel
    function showGroupChat(group) {
        document.querySelectorAll('.chat-panel').forEach(panel => panel.classList.remove('active'));
        groupChatPanel.classList.add('active');
        const groupHeader = document.getElementById('group-chat-header');
        if (groupHeader) {
            groupHeader.innerHTML = `
                <div class="group-header-content">
                    <span class="avatar" style="background-image:url('${group.avatar || ''}')">${group.avatar ? '' : group.name[0]}</span>
                    <span class="group-title">${group.name}</span>
                    <span class="group-members-list">
                        ${group.members.map(m => `
                            <span class="member-pill${onlineUsers.includes(m) ? ' online' : ''}">
                                ${m}
                            </span>
                        `).join('')}
                    </span>
                </div>
            `;
        }
    }

    function renderGroupMessages() {
        if (!currentGroupId) return;
        groupChatBox.innerHTML = '';
        (groupMessages[currentGroupId] || []).forEach(msg => {
            if (msg.type === "file") {
                groupChatBox.innerHTML += `
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
                groupChatBox.innerHTML += `
                    <div class="message">
                        <div class="message-content">
                            <b>${msg.username}:</b> ${msg.text}
                            <span class="timestamp">${msg.timestamp}</span>
                        </div>
                    </div>`;
            }
        });
        groupChatBox.scrollTop = groupChatBox.scrollHeight;
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

    // Emoji Picker for Group Chat
    const emojiBtnGroup = document.getElementById('emoji-btn-group');
    const emojiPickerGroup = document.createElement('emoji-picker');
    emojiPickerGroup.style.position = 'absolute';
    emojiPickerGroup.style.bottom = '60px';
    emojiPickerGroup.style.left = '10px';
    emojiPickerGroup.style.display = 'none';
    document.body.appendChild(emojiPickerGroup);

    emojiBtnGroup.addEventListener('click', () => {
        emojiPickerGroup.style.display = emojiPickerGroup.style.display === 'none' ? 'block' : 'none';
    });
    emojiPickerGroup.addEventListener('emoji-click', event => {
        groupMessageInput.value += event.detail.unicode;
        emojiPickerGroup.style.display = 'none';
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

    // File sending for Group Chat
    const groupFileInput = document.getElementById('group-file-input');
    const groupFileBtn = document.getElementById('group-file-btn');
    groupFileBtn.onclick = () => groupFileInput.click();
    groupFileInput.onchange = () => {
        const file = groupFileInput.files[0];
        if (!file || !currentGroupId) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            ws.send(JSON.stringify({
                type: "file",
                username,
                filename: file.name,
                filetype: file.type,
                data: e.target.result,
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                groupId: currentGroupId // Indicate this is for a group
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
        myUsernameSpan.textContent = profile.displayName;
        myAvatar.style.backgroundImage = profile.avatar ? `url(${profile.avatar})` : '';
        profileModal.style.display = 'none';
    };

    profileCancelBtn.onclick = () => {
        profileModal.style.display = 'none';
    };

    logoutBtn.onclick = () => {
        location.reload();
    };

    // Modal tab switching
    tabCreateGroup.onclick = () => {
        tabCreateGroup.classList.add('active');
        tabJoinGroup.classList.remove('active');
        createGroupPanel.style.display = '';
        joinGroupPanel.style.display = 'none';
    };
    tabJoinGroup.onclick = () => {
        tabJoinGroup.classList.add('active');
        tabCreateGroup.classList.remove('active');
        createGroupPanel.style.display = 'none';
        joinGroupPanel.style.display = '';
    };

    createGroupBtn.onclick = () => {
        groupModal.style.display = 'flex';
        tabCreateGroup.click();
    };

    [groupCancelBtn, groupCancelBtn2].forEach(btn => {
        btn.onclick = () => {
            groupModal.style.display = 'none';
            groupNameInput.value = '';
            groupAvatarInput.value = '';
            groupCodeInput.value = '';
            joinGroupCodeInput.value = '';
        };
    });

    // Group creation: appears on Home page, no auto-join
    groupCreateBtn.onclick = () => {
        const name = groupNameInput.value.trim();
        const code = groupCodeInput.value.trim();
        if (!name || !code) return alert("Group name and code required!");
        let avatar = '';
        const file = groupAvatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                avatar = e.target.result;
                if (ws && ws.readyState === 1) {
                    ws.send(JSON.stringify({
                        type: "create_group",
                        username,
                        groupName: name,
                        groupAvatar: avatar,
                        groupCode: code
                    }));
                } else {
                    alert("Connection not ready. Please refresh.");
                }
                groupModal.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            if (ws && ws.readyState === 1) {
                ws.send(JSON.stringify({
                    type: "create_group",
                    username,
                    groupName: name,
                    groupAvatar: '',
                    groupCode: code
                }));
            } else {
                alert("Connection not ready. Please refresh.");
            }
            groupModal.style.display = 'none';
        }
    };

    groupJoinBtn.onclick = () => {
        const code = joinGroupCodeInput.value.trim();
        if (!code) return alert("Enter a group code!");
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                type: "join_group",
                username,
                groupCode: code
            }));
        } else {
            alert("Connection not ready. Please refresh.");
        }
        groupModal.style.display = 'none';
        joinGroupCodeInput.value = '';
    };

    // Add this function if not present
    function setActiveTab(tabBtn) {
        document.querySelectorAll('.chat-tabs .tab').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');
    }

    // Group tabs: require code to enter group chat
    function renderGroupTabs(groups) {
        groupTabs.innerHTML = '';
        Object.entries(groups).forEach(([groupId, group]) => {
            if (!group.members.includes(username)) return;
            const btn = document.createElement('button');
            btn.className = 'tab';
            btn.textContent = group.name;
            btn.onclick = () => {
                const code = prompt(`Enter code for group "${group.name}":`);
                if (code === group.code) {
                    setActiveTab(btn);
                    publicPanel.classList.remove('active');
                    privatePanel.classList.remove('active');
                    groupChatPanel.classList.add('active');
                    currentGroupId = groupId;
                    showGroupChat(group);
                    renderGroupMessages();
                } else if (code !== null) {
                    alert("Incorrect group code!");
                }
            };
            // Optionally highlight if active
            if (currentGroupId === groupId && groupChatPanel.classList.contains('active')) {
                btn.classList.add('active');
            }

            
            groupTabs.appendChild(btn);
        });
    }
});