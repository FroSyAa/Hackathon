document.addEventListener('DOMContentLoaded', async function() {
    checkAuth();
    const user = getUser();

    if (user.role !== 'teacher') {
        window.location.href = '/pages/student/dashboard.html';
        return;
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

        if (!data.submissions || data.submissions.length === 0) {
            submissionsList.innerHTML = '<p>Нет работ на проверке</p>';
            return;
        }

        submissionsList.innerHTML = data.submissions.map(submission => {
            const deadline = new Date(submission.Assignment.deadline);
            const submittedAt = new Date(submission.submittedAt);

            return `
                <div class="submission-card">
                    <div class="submission-info">
                        <h3>${submission.User.firstName} ${submission.User.lastName}</h3>
                        <p><strong>Задание:</strong> ${submission.Assignment.title}</p>
                        <p><strong>Курс:</strong> ${submission.Assignment.Course?.title || 'Не указан'}</p>
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
        const data = await API.teacher.getSubmissionDetail?.(submissionId);

        if (!data) {
            alert('Не удалось загрузить детали работы');
            return;
        }

        const detailContainer = document.getElementById('submission-detail');
        if (!detailContainer) return;

        const submission = data.submission;
        const submittedAt = new Date(submission.submittedAt);

        detailContainer.innerHTML = `
            <h2>Работа студента: ${submission.User.firstName} ${submission.User.lastName}</h2>
            <div class="detail-info">
                <p><strong>Задание:</strong> ${submission.Assignment.title}</p>
                <p><strong>Описание задания:</strong> ${submission.Assignment.description}</p>
                <p><strong>Максимальный балл:</strong> ${submission.Assignment.maxScore}</p>
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