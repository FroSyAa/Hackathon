document.addEventListener('DOMContentLoaded', async function() {
    checkAuth();
    const user = getUser();

    if (user.role !== 'teacher') {
        window.location.href = '/pages/student/dashboard.html';
        return;
    }

    // Формат имени пользователя в шапке 
    if (user) {
        const nameSpan = document.querySelector('.user-info span');
        if (nameSpan) nameSpan.textContent = formatShortName(user);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const submissionId = urlParams.get('id');

    if (submissionId) {
        await loadSubmissionDetail(submissionId);
        setupGradingForm(submissionId);
    } else {
        await loadAllSubmissions();
    }
});

// Загрузка всех работ на проверке
async function loadAllSubmissions() {
    try {
        const data = await API.teacher.getPendingSubmissions();
            const submissionsList = document.getElementById('submissions-list');

            if (!submissionsList) return;

            if (!data.submissions || data.submissions.length === 0) {
                submissionsList.innerHTML = '<p>Нет работ на проверке</p>';
                return;
            }

            submissionsList.innerHTML = data.submissions.map(submission => {
            const assignment = submission.assignment || submission.Assignment || {};
            const deadline = assignment.deadline ? new Date(assignment.deadline) : new Date();
            const submittedAt = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
            const student = submission.student && submission.student.user ? submission.student.user : (submission.User || {});

            return `
                <div class="submission-card">
                    <div class="submission-info">
                        <h3>${student.lastName ? student.lastName + ' ' + (student.firstName ? student.firstName : '') : (student.firstName || '')}</h3>
                        <p><strong>Задание:</strong> ${assignment.title || ''}</p>
                        <p><strong>Курс:</strong> ${assignment.courseId || 'Не указан'}</p>
                        <p><strong>Сдано:</strong> ${submittedAt.toLocaleString('ru-RU')}</p>
                        <p><strong>Дедлайн:</strong> ${deadline.toLocaleString('ru-RU')}</p>
                    </div>
                    <div class="submission-actions">
                        <a href="grading.html?id=${submission.id}" class="btn btn-primary">Проверить</a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
        alert('Ошибка загрузки работ: ' + error.message);
    }
}

// Загрузка детальной информации о работе
async function loadSubmissionDetail(submissionId) {
    try {
        const data = await API.teacher.getPendingSubmissions();
        const found = data.submissions.find(s => String(s.id) === String(submissionId));
        if (!found) {
            alert('Не удалось загрузить детали работы');
            return;
        }

        const detailContainer = document.getElementById('submission-detail');
        if (!detailContainer) return;

        const submission = found;
        const submittedAt = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
        const student = submission.student && submission.student.user ? submission.student.user : (submission.User || {});
        const assignment = submission.assignment || submission.Assignment || {};

        detailContainer.innerHTML = `
            <h2>Работа студента: ${student.lastName ? student.lastName + ' ' + (student.firstName || '') : (student.firstName || '')}</h2>
            <div class="detail-info">
                <p><strong>Задание:</strong> ${assignment.title || ''}</p>
                <p><strong>Описание задания:</strong> ${assignment.description || ''}</p>
                <p><strong>Максимальный балл:</strong> ${assignment.maxScore || ''}</p>
                <p><strong>Сдано:</strong> ${submittedAt.toLocaleString('ru-RU')}</p>
                ${submission.comment ? `<p><strong>Комментарий студента:</strong> ${submission.comment}</p>` : ''}
                ${submission.fileUrl ? `<p><a href="${submission.fileUrl}" target="_blank" class="btn btn-outline">Скачать файл</a></p>` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Ошибка загрузки детальной информации:', error);
    }
}

// Настройка формы оценивания
function setupGradingForm(submissionId) {
    const gradingForm = document.getElementById('grading-form');
    if (!gradingForm) return;

    gradingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const score = parseInt(e.target.querySelector('input[name="score"]').value);
        const feedback = e.target.querySelector('textarea[name="feedback"]').value;
        const status = e.target.querySelector('select[name="status"]').value;

        try {
            await API.teacher.gradeSubmission(submissionId, score, feedback, status);
            alert('Оценка успешно выставлена');
            window.location.href = 'grading.html';
        } catch (error) {
            alert('Ошибка при выставлении оценки: ' + error.message);
        }
    });
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