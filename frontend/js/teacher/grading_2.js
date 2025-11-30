const studentsData = [
    { id: 1, lastName: 'Иванов', group: 'ИТ-21', topic: 'Сортировка пузырьком', status: 'сдано', files: ['ivanov_task1.py'] },
    { id: 2, lastName: 'Петров', group: 'ИТ-21', topic: 'Сортировка пузырьком', status: 'проверка', files: ['petrov_task1.py'] },
    { id: 3, lastName: 'Сидоров', group: 'ИТ-22', topic: 'Хеш-таблицы', status: 'не сдано', files: [] },
    { id: 4, lastName: 'Козлов', group: 'ИТ-21', topic: 'Сортировка пузырьком', status: 'сдано', files: ['kozlov_task1.py'] }
];

function renderStudents(students) {
    const container = document.getElementById('studentsList');
    if (!container) {
        console.error('❌ #studentsList не найден!');
        return;
    }
    container.innerHTML = students.map(student => `
        <div class="student-card ${student.status}" data-student-id="${student.id}">
            <div class="student-header">
                <h3 class="student-name">${student.lastName}</h3>
                <span class="status-badge status-${student.status}">${getStatusIcon(student.status)} ${student.status}</span>
            </div>
            <div class="student-details">
                <div class="detail-item">
                    <i class="fas fa-users"></i> ${student.group}
                </div>
                <div class="detail-item">
                    <i class="fas fa-book"></i> ${student.topic}
                </div>
            </div>
            ${student.files.length > 0 ? 
                `<div class="files-count">
                    <i class="fas fa-file-code"></i> Файлов: ${student.files.length}
                </div>` : 
                `<div class="no-files">
                    <i class="fas fa-folder-open"></i> Нет файлов
                </div>`
            }
        </div>
    `).join('');
    updateStats(students);
}

function getStatusIcon(status) {
    return { 'сдано': '', 'проверка': '', 'не сдано': '' }[status] || '';
}

function updateStats(students) {
    const total = document.getElementById('totalCount');
    const done = document.getElementById('doneCount');
    if (total) total.textContent = students.length;
    if (done) done.textContent = students.filter(s => s.status === 'сдано').length;
}

function filterStudents() {
    const searchStudent = document.getElementById('searchStudent')?.value.toLowerCase() || '';
    const searchGroup = document.getElementById('searchGroup')?.value.toLowerCase() || '';
    const searchTopic = document.getElementById('searchTopic')?.value.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || '';
    
    const filtered = studentsData.filter(student => 
        (!searchStudent || student.lastName.toLowerCase().includes(searchStudent)) &&
        (!searchGroup || student.group.toLowerCase().includes(searchGroup)) &&
        (!searchTopic || student.topic.toLowerCase().includes(searchTopic)) &&
        (!status || student.status === status)
    );
    renderStudents(filtered);
    showNotification(`🔍 Найдено: ${filtered.length} студентов`);
}

function clearFilters() {
    document.getElementById('searchStudent').value = '';
    document.getElementById('searchGroup').value = '';
    document.getElementById('searchTopic').value = '';
    document.getElementById('filterStatus').value = '';
    renderStudents(studentsData);
    showNotification('🧹 Фильтры очищены!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 100px; right: 20px; 
        background: linear-gradient(135deg, #10b981, #059669); 
        color: white; padding: 16px 24px; border-radius: 12px; 
        font-weight: 600; z-index: 10001; box-shadow: 0 10px 30px rgba(16,185,129,0.4);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    renderStudents(studentsData);
    
    // КНОПКИ
    document.getElementById('searchBtn').onclick = filterStudents;
    document.getElementById('clearBtn').onclick = clearFilters;
    
    // Enter в input
    ['searchStudent', 'searchGroup', 'searchTopic'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.onkeypress = function(e) {
                if (e.key === 'Enter') filterStudents();
            };
        }
    });
});
