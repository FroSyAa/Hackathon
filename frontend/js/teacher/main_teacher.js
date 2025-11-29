document.addEventListener('DOMContentLoaded', async function () {
    // ✅ 1. Проверяем авторизацию
    checkAuth();
    const user = getUser();

    if (user.role !== 'teacher') {
        window.location.href = '/pages/student/dashboard.html';
        return;
    }

    // ✅ 2. Устанавливаем имя преподавателя
    document.querySelector('.user-info span').textContent = formatShortName(user);

    // ✅ 3. Загружаем данные
    await loadStatistics();
    await loadCourses();
    await loadPendingSubmissions();

    // ✅ 4. Период статистики
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            periodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ✅ 5. Анимация карточек
    const statCards = document.querySelectorAll('.stat-card');
    setTimeout(() => {
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }, 500);

    // ✅ 6. МЕНЮ ПРОФИЛЯ ПРЕПОДАВАТЕЛЯ (БЫЛО ОТДЕЛЬНО)
    initProfileMenu();
});

function initProfileMenu() {
    const userInfo = document.getElementById('userInfo');
    const profileMenu = document.getElementById('profileMenu');

    if (userInfo && profileMenu) {
        // Клик по имени/аватару
        userInfo.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleProfileMenu();
        });

        // Закрытие при клике вне меню
        document.addEventListener('click', function () {
            profileMenu.classList.remove('show');
            userInfo.classList.remove('clicking');
        });

        // Закрытие при клике на пункт меню
        profileMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                profileMenu.classList.remove('show');
                userInfo.classList.remove('clicking');
            });
        });
    }

    function toggleProfileMenu() {
        const isVisible = profileMenu.classList.contains('show');
        profileMenu.classList.toggle('show', !isVisible);
        userInfo.classList.add('clicking');

        // Закрытие через 5 сек
        setTimeout(() => {
            profileMenu.classList.remove('show');
            userInfo.classList.remove('clicking');
        }, 5000);
    }
}

let courseStatistics = {};

// Загрузка статистики
async function loadStatistics() {
    try {
        const data = await API.teacher.getStatistics();

        // Обновить статистические карточки
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-number').textContent = data.totalStudents;
            statCards[1].querySelector('.stat-number').textContent = data.pendingSubmissions;
            statCards[2].querySelector('.stat-number').textContent = data.totalCourses;
            statCards[3].querySelector('.stat-number').textContent = data.successRate + '%';
        }

        // Сохранить статистику по курсам для использования в loadCourses
        data.courseStats.forEach(stat => {
            courseStatistics[stat.id] = stat;
        });
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загрузка курсов
async function loadCourses() {
    try {
        const data = await API.teacher.getCourses();
        const coursesGrid = document.querySelector('.courses-grid');

        if (!data.courses || data.courses.length === 0) {
            coursesGrid.innerHTML = '<p>Нет курсов. Создайте свой первый курс!</p>';
            return;
        }

        coursesGrid.innerHTML = data.courses.map(course => {
            const stats = courseStatistics[course.id] || { studentCount: 0, assignmentCount: 0, progress: 0 };

            return `
                <div class="course-card">
                    <div class="course-image">
                        <img src="../../assets/course_placeholder.jpg" alt="${course.title}">
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
                        <a href="#" class="btn btn-outline btn-small">Статистика</a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
    }
}

// Загрузка работ на проверке
async function loadPendingSubmissions() {
    try {
        const data = await API.teacher.getPendingSubmissions();
        const pendingList = document.querySelector('.pending-list');

        if (!data.submissions || data.submissions.length === 0) {
            pendingList.innerHTML = '<p>Нет работ на проверке</p>';
            document.querySelector('.badge.urgent').textContent = '0';
            return;
        }

        document.querySelector('.badge.urgent').textContent = data.submissions.length;

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

// Форматирует имя в строку `Фамилия И.О.`
function formatShortName(user) {
    if (!user) return '';
    const last = user.lastName || '';
    const first = user.firstName || '';
    const middle = user.middleName || '';
    const f = first ? first.charAt(0) + '.' : '';
    const m = middle ? middle.charAt(0) + '.' : '';
    return `${last} ${f}${m}`.trim();
}

// ✅ ИНИЦИАЛИЗАЦИЯ УВЕДОМЛЕНИЙ
function initNotifications() {
    const bell = document.getElementById('notificationBell');
    const panel = document.getElementById('notificationPanel');

    if (!bell || !panel) return;

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
    panel.classList.toggle('show');
}

function hideNotifications() {
    document.getElementById('notificationPanel').classList.remove('show');
}

// ✅ Загрузка уведомлений
async function loadNotifications() {
    // Пример уведомлений
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
        },
        {
            id: 3,
            avatar: '../../assets/student.png',
            title: 'Система',
            message: 'Новый студент записался на курс "Python"',
            time: '1 час назад',
            unread: false
        }
    ];

    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');
    const panelCount = document.getElementById('panelCount');

    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.unread ? 'unread' : ''}" onclick="markAsRead(${notif.id})">
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
    panelCount.textContent = `${unreadCount} новых`;
}

function markAsRead(id) {
    // TODO: API пометить как прочитанное
    showNotification('Уведомление отмечено как прочитанное', 'success');
}
