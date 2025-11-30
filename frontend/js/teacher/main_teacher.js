document.addEventListener('DOMContentLoaded', async function () {
        checkAuth();
    const user = getUser();

    if (user.role !== 'teacher') {
        window.location.href = '/pages/student/dashboard.html';
        return;
    }
    const teacherNameEl = document.getElementById('teacherName') || document.querySelector('.user-info span');
    if (teacherNameEl) {
        teacherNameEl.textContent = formatShortName(user);
    }
    initProfileMenu();
    initNotifications();  
    await loadStatistics();
    await loadCourses();
    await loadPendingSubmissions();
    loadNotifications();
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            periodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    const statCards = document.querySelectorAll('.stat-card');
    setTimeout(() => {
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }, 500);
});

function initProfileMenu() {
    const userInfo = document.getElementById('userInfo');
    const profileMenu = document.getElementById('profileMenu');

    if (userInfo && profileMenu) {
        userInfo.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleProfileMenu();
        });

        document.addEventListener('click', function () {
            profileMenu.classList.remove('show');
            userInfo.classList.remove('clicking');
        });

        profileMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                profileMenu.classList.remove('show');
                userInfo.classList.remove('clicking');
            });
        });
    }
}

function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    const userInfo = document.getElementById('userInfo');

    const isVisible = profileMenu.classList.contains('show');
    profileMenu.classList.toggle('show', !isVisible);
    userInfo.classList.add('clicking');

    setTimeout(() => {
        profileMenu.classList.remove('show');
        userInfo.classList.remove('clicking');
    }, 5000);
}

function initNotifications() {
    const notificationContainer = document.getElementById('notificationContainer');
    const bell = document.getElementById('notificationBell');
    const panel = document.getElementById('notificationPanel');
    
    if (!notificationContainer || !bell || !panel) {
        console.log('❌ Элементы уведомлений не найдены в DOM');
        return;
    }

    // Клик по колокольчику
    bell.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleNotifications();
    });

    // Закрытие при клике вне панели
    document.addEventListener('click', function (e) {
        if (!notificationContainer.contains(e.target)) {
            hideNotifications();
        }
    });
}

function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('show');
    }
}

function hideNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}

async function loadNotifications() {
    const notifications = [
        {
            id: 1,
            avatar: '../../assets/student.png',
            title: 'Иван Иванов',
            message: 'Отправил работу по заданию "Алгоритмы" на проверку',
            time: '2 мин назад',
            unread: true
        },
        {
            id: 2,
            avatar: '../../assets/student.png',
            title: 'Мария Петрова',
            message: 'Задала вопрос по курсу "Веб-разработка"',
            time: '15 мин назад',
            unread: true
        }
    ];

    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');
    const panelCount = document.getElementById('panelCount');
    if (!list || !badge || !panelCount) {
        return;
    }

    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.unread ? 'unread' : ''}" data-notification-id="${notif.id}">
            <img src="${notif.avatar}" alt="Аватар" class="notification-avatar">
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
        </div>
    `).join('');

    // Обновляем счетчики
    const unreadCount = notifications.filter(n => n.unread).length;
    badge.textContent = unreadCount;
    panelCount.textContent = unreadCount ? `${unreadCount} новых` : 'Нет новых';
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function () {
            markAsRead(this.dataset.notificationId);
        });
    });
}

function markAsRead(notificationId) {
    console.log(`✅ Отмечено как прочитанное: ${notificationId}`);
    showNotification('Уведомление отмечено как прочитанное', 'success');
    loadNotifications(); 
}

let courseStatistics = {};

async function loadStatistics() {
    try {
        const data = await API.teacher.getStatistics();

        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-number').textContent = data.totalStudents;
            statCards[1].querySelector('.stat-number').textContent = data.pendingSubmissions;
            statCards[2].querySelector('.stat-number').textContent = data.totalCourses;
            statCards[3].querySelector('.stat-number').textContent = data.successRate + '%';
        }

        data.courseStats.forEach(stat => {
            courseStatistics[stat.id] = stat;
        });
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

async function loadCourses() {
    try {
        const data = await API.teacher.getCourses();
        const coursesGrid = document.querySelector('.courses-grid');

        if (!data.courses || data.courses.length === 0) {
            if (coursesGrid) coursesGrid.innerHTML = '<p>Нет курсов.</p>';
            return;
        }

        if (!coursesGrid) return;
        // Build course cards with image URL resolution and fallback
        coursesGrid.innerHTML = data.courses.map(course => {
            const stats = courseStatistics[course.id] || { studentCount: 0, assignmentCount: 0, progress: 0 };

            let imageUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23004C97"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="white"%3ECourse%3C/text%3E%3C/svg%3E';
            if (course.imageUrl && course.imageUrl.trim() !== '') {
                const raw = course.imageUrl.trim();
                if (raw.startsWith('http')) {
                    imageUrl = raw;
                } else if (raw.startsWith('/uploads') || raw.startsWith('uploads')) {
                    const host = API_URL.replace(/\/api\/?$/, '');
                    imageUrl = host + (raw.startsWith('/') ? raw : '/' + raw);
                } else {
                    imageUrl = raw;
                }
            }

            const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect width=%22400%22 height=%22200%22 fill=%22%23004C97%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2224%22 fill=%22white%22%3ECourse%3C/text%3E%3C/svg%3E';

            return `
                <div class="course-card">
                    <div class="course-image">
                        <img src="${imageUrl}" alt="${course.title}" onerror="this.src='${fallbackImage}'">
                        <div class="course-progress">
                            <span>${stats.progress}%</span>
                        </div>
                    </div>
                    <div class="course-info">
                        <h3>${course.title}</h3>
                        <p class="course-short-description">${course.description || ''}</p>
                        <div class="course-meta">
                            <span class="students"><i class="fas fa-users"></i> ${stats.studentCount} студентов</span>
                            <span class="tasks"><i class="fas fa-tasks"></i> ${stats.assignmentCount} заданий</span>
                        </div>
                    </div>
                    <div class="course-actions">
                        <a href="view_course.html?id=${course.id}" class="btn btn-primary btn-small">Перейти</a>
                        <a href="edit_course.html?id=${course.id}" class="btn btn-outline btn-small">Редактировать</a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
    }
}

async function loadPendingSubmissions() {
    try {
        const data = await API.teacher.getPendingSubmissions();
        const pendingList = document.querySelector('.pending-list');
        const badgeUrgent = document.querySelector('.badge.urgent');

        if (!data.submissions || data.submissions.length === 0) {
            if (pendingList) pendingList.innerHTML = '<p>Нет работ на проверке</p>';
            if (badgeUrgent) badgeUrgent.textContent = '0';
            return;
        }

        if (badgeUrgent) badgeUrgent.textContent = String(data.submissions.length);
        if (!pendingList) return;

        pendingList.innerHTML = data.submissions.map(submission => {
            const deadline = new Date(submission.assignment.deadline);
            const isUrgent = deadline - new Date() < 24 * 60 * 60 * 1000;
            const student = submission.student.user;

            return `
                <div class="pending-item ${isUrgent ? 'priority' : ''}">
                    <div class="pending-left">
                        <img src="../../assets/student.png" alt="Студент" class="student-avatar">
                        <div class="student-info">
                            <h4>${student.firstName} ${student.lastName}</h4>
                            <div class="assignment-info">
                                <i class="fas fa-file-code"></i>
                                <span>${submission.assignment.title}</span>
                            </div>
                        </div>
                    </div>
                    <div class="pending-deadline ${isUrgent ? 'urgent' : ''}">
                        <i class="fas fa-clock"></i>
                        <strong>${deadline.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</strong>
                        ${isUrgent ? '<span>Срочно</span>' : ''}
                    </div>
                    <div class="pending-actions">
                        <a href="grading.html?id=${submission.id}" class="btn btn-${isUrgent ? 'warning' : 'primary'} btn-small">Проверить</a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
    }
}

function formatShortName(user) {
    if (!user) return '';
    const last = user.lastName || '';
    const first = user.firstName || '';
    const middle = user.middleName || '';
    const f = first ? first.charAt(0) + '.' : '';
    const m = middle ? middle.charAt(0) + '.' : '';
    return `${last} ${f}${m}`.trim();
}
