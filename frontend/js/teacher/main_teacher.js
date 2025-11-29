document.addEventListener('DOMContentLoaded', async function() {
    checkAuth();
    const user = getUser();

    if (user.role !== 'teacher') {
        window.location.href = '/pages/student/dashboard.html';
        return;
    }

    document.querySelector('.user-info span').textContent = `${user.firstName} ${user.lastName}`;

    await loadStatistics();
    await loadCourses();
    await loadPendingSubmissions();

    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
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
                        <div class="course-meta">
                            <span class="students"><i class="fas fa-users"></i> ${stats.studentCount} студентов</span>
                            <span class="tasks"><i class="fas fa-tasks"></i> ${stats.assignmentCount} заданий</span>
                        </div>
                    </div>
                    <div class="course-actions">
                        <a href="course_detail.html?id=${course.id}" class="btn btn-primary btn-small">Перейти</a>
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