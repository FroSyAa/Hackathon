let mockChats = [];
let currentChatId = 0;

document.addEventListener('DOMContentLoaded', async function () {
    await loadChats();
    bindChatEvents();
    showNoChatSelected();
});

function showNoChatSelected() {
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    const container = document.getElementById('messagesContainer');
    container.innerHTML = `
        <div class="welcome-message">
            <h3>👋 Добро пожаловать!</h3>
            <p>Выберите чат слева для начала общения</p>
        </div>
    `;
    document.getElementById('chatTitle').textContent = 'Чаты';
    document.getElementById('chatStatus').textContent = 'Выберите чат';
    setTimeout(() => document.getElementById('messageInput')?.focus(), 100);
}

function bindChatEvents() {
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', function (e) {
            if (e.target.classList.contains('delete-chat-btn')) return;
            switchChat(this.dataset.chat);
        });
    });

    document.querySelectorAll('.delete-chat-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteChat(this.dataset.chat);
        });
    });

    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('messageInput').onkeypress = function (e) {
        if (e.key === 'Enter' && currentChatId > 0) {
            sendMessage();
            return false;
        }
    };

    document.getElementById('sidebarToggle').onclick = () => {
        document.getElementById('chatSidebar').classList.toggle('open');
    };

    const newChatBtn = document.querySelector('.new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
    }
}

async function createNewChat() {
    const name = prompt('Введите имя участника чата:');
    if (!name || name.trim() === '') {
        alert('Введите имя для чата!');
        return;
    }
    try {
        const data = await API.common.createChat(name.trim());
        await loadChats();
        const chatId = data.chat && data.chat.id;
        if (chatId) switchChat(chatId.toString());
    } catch (err) {
        console.warn('Create chat failed, falling back to local mock', err);
        const newChatId = mockChats.length + 1;
        const newChat = {
            id: newChatId,
            name: name.trim(),
            avatar: '../../assets/student.png',
            messages: []
        };
        mockChats.unshift(newChat);
        renderChats();
        switchChat(newChatId.toString());
    }
}

function deleteChat(chatId) {
    if (!confirm('Удалить чат?')) return;
    try {
        mockChats = mockChats.filter(c => String(c.id) !== String(chatId));
        renderChats();
        if (currentChatId == chatId) { currentChatId = 0; showNoChatSelected(); }
    } catch (e) {
        console.warn('Failed to delete chat locally', e);
    }
}

function updateChatDataAttributes() {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach((item, index) => {
        item.dataset.chat = index + 1;
        const delBtn = item.querySelector('.delete-chat-btn');
        if (delBtn) delBtn.dataset.chat = index + 1;
    });
}

async function switchChat(chatId) {
    currentChatId = parseInt(chatId);
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    const el = document.querySelector(`[data-chat="${chatId}"]`);
    if (el) el.classList.add('active');
    try {
        const data = await API.common.getChatMessages(chatId);
        const title = el ? (el.querySelector('.chat-name')?.textContent || 'Чат') : 'Чат';
        document.getElementById('chatTitle').textContent = title;
        document.getElementById('chatStatus').textContent = 'В сети';
        loadMessages((data.messages || []).map(m => ({ type: m.senderType === 'bot' || !m.senderId ? 'received' : 'sent', author: '', time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: m.content })));
    } catch (err) {
        console.warn('Failed to load messages from server, falling back to local', err);
        const chat = mockChats.find(c => String(c.id) === String(chatId)) || { messages: [] };
        document.getElementById('chatTitle').textContent = chat.name || 'Чат';
        loadMessages(chat.messages || []);
    }
}

function loadMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.type}`;
        if (msg.type === 'received') {
            div.innerHTML = `
                <img src="../../assets/student.png" class="msg-avatar" alt="${msg.author}">
                <div class="msg-bubble">
                    <div class="msg-header">
                        <span class="msg-author">${msg.author}</span>
                        <span class="msg-time">${msg.time}</span>
                    </div>
                    <p>${msg.text}</p>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="msg-bubble">
                    <div class="msg-header">
                        <span class="msg-time">${msg.time}</span>
                    </div>
                    <p>${msg.text}</p>
                </div>
            `;
        }
        container.appendChild(div);
    });
    scrollToBottom();
}

function sendMessage() {
    if (currentChatId === 0) {
        alert('Сначала выберите чат!');
        return;
    }
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'message sent';
    div.innerHTML = `
        <div class="msg-bubble">
            <div class="msg-header">
                <span class="msg-time">${time}</span>
            </div>
            <p>${text}</p>
        </div>
    `;
    document.getElementById('messagesContainer').appendChild(div);

    input.value = '';
    scrollToBottom();

    (async () => {
        try {
            await API.common.postChatMessage(currentChatId, text);
            const data = await API.common.getChatMessages(currentChatId);
            loadMessages((data.messages || []).map(m => ({ type: m.senderType === 'bot' || !m.senderId ? 'received' : 'sent', author: '', time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: m.content })));
        } catch (err) {
            console.warn('Failed to send message, fallback to local echo', err);
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const replyDiv = document.createElement('div');
            replyDiv.className = 'message received';
            replyDiv.innerHTML = `
                <img src="../../assets/student.png" class="msg-avatar" alt="Ответ">
                <div class="msg-bubble">
                    <div class="msg-header">
                        <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>Понял! Отличная работа 🚀</p>
                </div>
            `;
            document.getElementById('messagesContainer').appendChild(replyDiv);
            scrollToBottom();
        }
    })();
}

async function loadChats() {
    try {
        const data = await API.common.getChats();
        mockChats = (data.chats || []).map(c => ({ id: c.id, name: c.title || 'Чат', avatar: '../../assets/student.png' }));
        renderChats();
    } catch (err) {
        console.warn('Failed to load chats from server, using mock', err);
        if (!mockChats || mockChats.length === 0) {
            mockChats = [{ id: 1, name: 'Иванов И.И.', avatar: '../../assets/student.png', messages: [] }];
        }
        renderChats();
    }
}

function renderChats() {
    const chatsList = document.getElementById('chatsList');
    if (!chatsList) return;
    chatsList.innerHTML = '';
    mockChats.forEach(c => {
        const el = document.createElement('div');
        el.className = 'chat-item';
        el.dataset.chat = c.id;
        el.innerHTML = `
            <img src="${c.avatar}" alt="${c.name}" class="chat-avatar">
            <div class="chat-info">
                <div class="chat-name">${c.name}</div>
                <div class="chat-preview">&nbsp;</div>
                <div class="chat-time">&nbsp;</div>
            </div>
            <div class="chat-status"></div>
            <button class="delete-chat-btn" data-chat="${c.id}" title="Удалить">❌</button>
        `;
        chatsList.appendChild(el);
    });
    bindChatEvents();
}

function scrollToBottom() {
    document.getElementById('messagesContainer').scrollTop = document.getElementById('messagesContainer').scrollHeight;
}
