document.addEventListener('DOMContentLoaded', function() {    
    initTabs();
    initMaterialButtons();
    initDownloads();
    initCourseActions();
    const user = getUser();
    if (user) {
        const nameSpan = document.querySelector('.user-info span');
        if (nameSpan) nameSpan.textContent = formatShortName(user);
    }
    loadCourseFromApi();
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const targetTab = this.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
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

function initMaterialButtons() {
    const addMaterialBtns = document.querySelectorAll('.add-material-btn');
    const modal = document.getElementById('materialModal');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const materialForm = document.getElementById('materialForm');
    addMaterialBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();            
            const tabContent = this.closest('.tab-content');
            const isPractice = tabContent && tabContent.id === 'practice';
            modalTitle.textContent = isPractice ? 'Добавить задание' : 'Добавить материал';
            modal.classList.add('show');
        });
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
    });
    if (modalClose) {
        modalClose.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Файл успешно загружен!');
            closeModal();
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('materialModal');
    if (modal) modal.classList.remove('show');
}

function initDownloads() {
    const downloadLinks = document.querySelectorAll('.material-download');
    downloadLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const materialName = this.previousElementSibling.textContent;
            alert(`Скачивание: ${materialName}`);
            // Здесь будет загрузка файла ЛИБО нужно сделать открытие в новом окне(Всё ещё надеюсь на то, что Никита это сделает)
        });
    });
}

function initCourseActions() {
    const courseActions = document.querySelectorAll('.course-actions a');
    courseActions.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.textContent.trim();
            switch(action) {
                case 'Редактировать курс':
                    alert('Перенаправление на редактирование...');
                    break;
                case 'Статистика':
                    alert('Открытие статистики курса...');
                    break;
            }
        });
    });
}

// Загружает курс и статистику по id из URL
async function loadCourseFromApi() {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    if (!courseId) return;

    try {
        const coursesResp = await API.teacher.getCourses();
        const course = (coursesResp.courses || []).find(c => String(c.id) === String(courseId));
        if (!course) return;

        // Подставляем данные в DOM
        const titleEl = document.querySelector('.course-info h1');
        const descEl = document.querySelector('.course-description');
        if (titleEl) titleEl.textContent = course.title;
        if (descEl) descEl.textContent = course.description || '';

        // Получаем статистику по курсу
        const statsResp = await API.teacher.getStatistics();
        const stat = (statsResp.courseStats || []).find(s => String(s.id) === String(courseId));
        if (stat) {
            const statItems = document.querySelectorAll('.course-stats .stat-item');
            if (statItems && statItems.length >= 3) {
                statItems[0].innerHTML = `<i class="fas fa-users"></i> ${stat.studentCount} студентов`;
                statItems[1].innerHTML = `<i class="fas fa-tasks"></i> ${stat.assignmentCount} заданий`;
                statItems[2].innerHTML = `<i class="fas fa-chart-line"></i> ${stat.progress}% прогресс`;
            }
            const progressEl = document.querySelector('.course-progress span');
            if (progressEl) progressEl.textContent = stat.progress + '%';
        }
        // Загрузим материалы и задания и отрисуем
        try {
            const materialsResp = await API.teacher.getMaterials(courseId);
            const assignmentsResp = await API.teacher.getCourseAssignments(courseId);

            const topicsContainer = document.querySelector('.topics-section');
            if (topicsContainer) {
                // Построим простую разметку: сначала материалы, затем задания
                let html = '';

                html += '<section class="materials-block">';
                html += '<h3>Материалы</h3>';
                if (materialsResp.materials && materialsResp.materials.length > 0) {
                    html += '<ul class="materials-list">';
                    materialsResp.materials.forEach(m => {
                        html += `<li class="material-item"><i class="fas fa-file"></i> <span>${m.title}</span> <a href="/${m.fileUrl || '#'}" class="material-download"><i class="fas fa-download"></i></a></li>`;
                    });
                    html += '</ul>';
                } else {
                    html += '<p>Нет материалов.</p>';
                }
                html += '</section>';

                html += '<section class="assignments-block">';
                html += '<h3>Задания</h3>';
                if (assignmentsResp.assignments && assignmentsResp.assignments.length > 0) {
                    html += '<ul class="assignments-list">';
                    assignmentsResp.assignments.forEach(a => {
                        const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString('ru-RU') : '—';
                        html += `<li class="assignment-item"><i class="fas fa-file-code"></i> <strong>${a.title}</strong> — ${deadline} <a href="#" class="btn btn-small">Открыть</a></li>`;
                    });
                    html += '</ul>';
                } else {
                    html += '<p>Нет заданий.</p>';
                }
                html += '</section>';

                topicsContainer.innerHTML = html;
                // Повесим обработчики на ссылки загрузки
                document.querySelectorAll('.material-download').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const href = this.getAttribute('href');
                        window.open(href, '_blank');
                    });
                });
            }
        } catch (e) {
            console.error('Ошибка загрузки материалов/заданий:', e);
        }
    } catch (err) {
        console.error('Ошибка загрузки курса:', err);
    }
}
