const mockChats = [
    { id: 1, name: 'Иванов И.И.', avatar: '../../assets/student.png', messages: [
        {type: 'received', author: 'Иванов И.И.', time: '14:32', text: 'Привет! Отличный подход с DFS!'},
        {type: 'sent', time: '14:35', text: 'Спасибо! Оптимизировал по времени.'}
    ]},
    { id: 2, name: 'Петров П.П.', avatar: '../../assets/student.png', messages: [
        {type: 'received', author: 'Петров П.П.', time: '15:10', text: 'Не понял задание по графам'},
        {type: 'sent', time: '15:12', text: 'Смотри пример с adjacency list'}
    ]},
    { id: 3, name: 'Сидорова А.А.', avatar: '../../assets/student.png', messages: [
        {type: 'received', author: 'Сидорова А.А.', time: '12:15', text: 'Проверьте мою работу!'}
    ]},
    { id: 4, name: 'Козлов К.К.', avatar: '../../assets/student.png', messages: [
        {type: 'received', author: 'Козлов К.К.', time: '10:30', text: 'Спасибо за разъяснение!'}
    ]}
];

let currentChatId = 0;

document.addEventListener('DOMContentLoaded', function() {
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
        item.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-chat-btn')) return;
            switchChat(this.dataset.chat);
        });
    });

    document.querySelectorAll('.delete-chat-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteChat(this.dataset.chat);
        });
    });

    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('messageInput').onkeypress = function(e) {
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

function createNewChat() {
    const name = prompt('Введите имя участника чата:');
    if (!name || name.trim() === '') {
        alert('Введите имя для чата!');
        return;
    }

    const newChatId = mockChats.length + 1;
    const newChat = {
        id: newChatId,
        name: name.trim(),
        avatar: '../../assets/student.png',
        messages: []
    };

    mockChats.push(newChat);

    const chatsList = document.getElementById('chatsList');
    const newChatEl = document.createElement('div');
    newChatEl.className = 'chat-item';
    newChatEl.dataset.chat = newChatId;
    newChatEl.innerHTML = `
        <img src="../../assets/student.png" alt="${name.trim()}" class="chat-avatar">
        <div class="chat-info">
            <div class="chat-name">${name.trim()}</div>
            <div class="chat-preview">Новый чат</div>
            <div class="chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
        <div class="chat-status"></div>
        <button class="delete-chat-btn" data-chat="${newChatId}" title="Удалить">❌</button>
    `;

    chatsList.insertBefore(newChatEl, chatsList.firstChild);

    newChatEl.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-chat-btn')) return;
        switchChat(this.dataset.chat);
    });
    const delBtn = newChatEl.querySelector('.delete-chat-btn');
    delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteChat(this.dataset.chat);
    });

    switchChat(newChatId.toString());
}

function deleteChat(chatId) {
    if (!confirm(`Удалить чат "${mockChats[chatId-1]?.name}"?`)) return;

    mockChats.splice(chatId - 1, 1);
    const chatEl = document.querySelector(`[data-chat="${chatId}"]`);
    if (chatEl) chatEl.remove();

    if (currentChatId == chatId) {
        currentChatId = 0;
        showNoChatSelected();
    }

    updateChatDataAttributes();
}

function updateChatDataAttributes() {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach((item, index) => {
        item.dataset.chat = index + 1;
        const delBtn = item.querySelector('.delete-chat-btn');
        if(delBtn) delBtn.dataset.chat = index + 1;
    });
}

function switchChat(chatId) {
    currentChatId = parseInt(chatId);

    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-chat="${chatId}"]`).classList.add('active');

    const chat = mockChats[currentChatId - 1];
    document.getElementById('chatTitle').textContent = chat.name;
    
    const chatStatus = document.getElementById('chatStatus');
    const statusEl = document.querySelector(`[data-chat="${chatId}"] .chat-status`);
    if (statusEl && statusEl.classList.contains('online')) {
        chatStatus.textContent = 'В сети';
    } else {
        chatStatus.textContent = 'Был(а) в сети недавно';
    }

    const unread = document.querySelector(`[data-chat="${chatId}"] .chat-unread`);
    if (unread) unread.style.display = 'none';

    loadMessages(chat.messages);
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

    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
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

    setTimeout(() => {
        const chat = mockChats[currentChatId - 1];
        const replyDiv = document.createElement('div');
        replyDiv.className = 'message received';
        replyDiv.innerHTML = `
            <img src="../../assets/student.png" class="msg-avatar" alt="${chat.name}">
            <div class="msg-bubble">
                <div class="msg-header">
                    <span class="msg-author">${chat.name}</span>
                    <span class="msg-time">${new Date(Date.now() + 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                </div>
                <p>Понял! Отличная работа 🚀</p>
            </div>
        `;
        document.getElementById('messagesContainer').appendChild(replyDiv);
        scrollToBottom();
    }, 800);
}

function scrollToBottom() {
    document.getElementById('messagesContainer').scrollTop = document.getElementById('messagesContainer').scrollHeight;
}
