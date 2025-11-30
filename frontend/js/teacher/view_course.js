let courseId = null;

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

// Устанавливает активную вкладку по id
function setActiveTab(tabId) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const content = document.getElementById(tabId);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
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
            if (modalTitle) modalTitle.textContent = isPractice ? 'Добавить задание' : 'Добавить материал';
            const topic = this.dataset.topic;
            if (modal) {
                modal.dataset.topic = topic || '';
                modal.dataset.isPractice = isPractice ? '1' : '0';
            }
            if (!isPractice && modalTitle) modalTitle.textContent = 'Добавить файлы';
            modal.classList.add('show');
        });
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
    });
    if (modalClose && !modalClose.dataset.listenerAttached) {
        modalClose.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
        modalClose.dataset.listenerAttached = '1';
    }
    if (modal && !modal.dataset.listenerAttached) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
        modal.dataset.listenerAttached = '1';
    }
    if (materialForm && !materialForm.dataset.listenerAttached) {
        materialForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = materialForm.querySelector('button[type="submit"]');
            const modalEl = document.getElementById('materialModal');
            if (modalEl && modalEl.dataset.uploading === '1') {
                console.warn('Upload already in progress for this modal - ignoring submit');
                return;
            }
            try {
                if (modalEl) modalEl.dataset.uploading = '1';
                if (submitBtn) submitBtn.disabled = true;
                console.debug('Submitting material form', { courseId, filesCount: (document.getElementById('materialFiles') && document.getElementById('materialFiles').files.length) || 0 });
                const titleInput = materialForm.querySelector('input[type="text"]');
                const title = titleInput ? titleInput.value.trim() : '';
                const fileInput = document.getElementById('materialFiles') || materialForm.querySelector('input[type="file"]');
                const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];

                const modalElActual = document.getElementById('materialModal');
                const topic = modalElActual ? modalElActual.dataset.topic : '';
                const isPractice = modalElActual ? modalElActual.dataset.isPractice === '1' : false;

                const formData = new FormData();
                formData.append('courseId', courseId || '');
                if (topic) {
                    if (isPractice) {
                        formData.append('assignmentId', topic);
                    } else {
                        formData.append('parentId', topic);
                    }
                }

                const prevTab = document.querySelector('.tab-btn.active') ? document.querySelector('.tab-btn.active').dataset.tab : 'theory';

                if (files.length > 0) {
                    for (const f of files) {
                        formData.append('files', f, f.name);
                    }
                } else {
                    formData.append('title', title || 'Без названия');
                    formData.append('description', materialForm.querySelector('textarea') ? materialForm.querySelector('textarea').value : '');
                    formData.append('type', 'text');
                }

                if (title) formData.append('title', title);

                // Client-side dedupe: build a simple fingerprint for the upload
                try {
                    window.__recentMaterialUploads = window.__recentMaterialUploads || new Set();
                    const names = files.map(f => `${f.name}:${f.size}`).join('|');
                    const fingerprint = `${courseId}::${topic || ''}::${isPractice ? 'assign:' + (topic||'') : 'parent:' + (topic||'') }::${names}`;
                    if (window.__recentMaterialUploads.has(fingerprint)) {
                        console.warn('Duplicate upload suppressed (client):', fingerprint);
                        return;
                    }
                    window.__recentMaterialUploads.add(fingerprint);
                    setTimeout(() => window.__recentMaterialUploads.delete(fingerprint), 5000);
                } catch (e) {
                    console.warn('Failed to compute upload fingerprint', e);
                }

                console.trace('Calling uploadMaterial for', { courseId, topic, isPractice, filesCount: files.length });
                const resp = await API.teacher.uploadMaterial(formData);
                console.debug('Material upload response:', resp);
                closeModal();
                await loadCourseFromApi();
                // restore previous tab (keep the user on the same tab)
                try { setActiveTab(prevTab); } catch (e) { /* ignore */ }
            } catch (err) {
                console.error('Ошибка загрузки материала:', err);
                alert('Ошибка загрузки материала: ' + (err.message || err));
            } finally {
                if (submitBtn) submitBtn.disabled = false;
                if (modalEl) delete modalEl.dataset.uploading;
            }
        });
        materialForm.dataset.listenerAttached = '1';
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('materialModal');
    if (modal) modal.classList.remove('show');
    const materialForm = document.getElementById('materialForm');
    try {
        if (materialForm) materialForm.reset();
    } catch (e) {
        console.warn('Failed to reset material form', e);
    }
}


// Подтверждение удаления материала
window.confirmDeleteMaterial = async function(materialId) {
    if (!confirm('Удалить файл?')) return;
    const prevTab = document.querySelector('.tab-btn.active') ? document.querySelector('.tab-btn.active').dataset.tab : 'theory';
    try {
        await API.teacher.deleteMaterial(materialId);
        await loadCourseFromApi();
        try { setActiveTab(prevTab); } catch (e) { /* ignore */ }
    } catch (err) {
        console.error('Ошибка удаления материала:', err);
        alert('Ошибка удаления материала: ' + (err.message || err));
    }
}

function initDownloads() {
    return;
}

function initCourseActions() {
    const courseActions = document.querySelectorAll('.course-actions a');
    courseActions.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.textContent.trim();
            switch(action) {
                case 'Редактировать курс':
                    const params = new URLSearchParams(window.location.search);
                    const cid = params.get('id');
                    if (cid) {
                        window.location.href = `/pages/teacher/edit_course.html?id=${cid}`;
                    } else {
                        alert('Не удалось определить id курса для редактирования');
                    }
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
    courseId = params.get('id');
    if (!courseId) return;

    try {
        const coursesResp = await API.teacher.getCourses();
        const course = (coursesResp.courses || []).find(c => String(c.id) === String(courseId));
        if (!course) return;

        const titleEl = document.querySelector('.course-info h1');
        const descEl = document.querySelector('.course-description');
        const breadcrumbSpan = document.querySelector('.breadcrumbs span');
        const coverImg = document.querySelector('.course-cover img');
        if (titleEl) titleEl.textContent = course.title;
        if (descEl) descEl.textContent = course.description || '';
        if (breadcrumbSpan) breadcrumbSpan.textContent = `/ ${course.title}`;
        try { document.title = `${course.title} - Курс`; } catch (e) { }

        if (coverImg) {
            if (course.imageUrl && course.imageUrl.trim() !== '') {
                let imageUrl = course.imageUrl.trim();
                if (!imageUrl.startsWith('http')) {
                    if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads')) {
                        const host = API_URL.replace(/\/api\/?$/, '');
                        imageUrl = host + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
                    } else {
                        imageUrl = imageUrl.startsWith('/') ? imageUrl : ('/' + imageUrl);
                    }
                }
                coverImg.src = imageUrl;
            } else {
                const coverBlock = document.querySelector('.course-cover');
                if (coverBlock) coverBlock.style.display = 'none';
            }
        }

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
        try {
            const materialsResp = await API.teacher.getMaterials(courseId);
            const assignmentsResp = await API.teacher.getCourseAssignments(courseId);

            const contentContainer = document.querySelector('.course-content');
            if (contentContainer) {
                let html = '';
                html += `<div class="tab-content active" id="theory">`;
                html += `<div class="topics-section">`;
                if (materialsResp.materials && materialsResp.materials.length > 0) {
                    const all = materialsResp.materials;
                    const attachmentsByParent = {};
                    all.forEach(it => {
                        if (it.parentId) {
                            attachmentsByParent[it.parentId] = attachmentsByParent[it.parentId] || [];
                            attachmentsByParent[it.parentId].push(it);
                        }
                    });

                    // Top-level materials for theory: those without parentId AND not attached to an assignment
                    const parents = all.filter(it => !it.parentId && !it.assignmentId);

                    parents.forEach(m => {
                        const children = attachmentsByParent[m.id] || [];
                        html += `<div class="topic-item"><div class="topic-header"><h3>${m.title || '(без названия)'}</h3><div class="topic-actions"><button class="btn btn-primary btn-small add-material-btn" data-topic="${m.id}"><i class="fas fa-plus"></i> Добавить файлы</button></div></div>`;
                        html += `<div class="materials-list">`;
                        if (m.fileUrl) {
                            let fileHref = m.fileUrl || '#';
                            if (fileHref && !fileHref.startsWith('http')) {
                                if (fileHref.startsWith('/uploads') || fileHref.startsWith('uploads')) {
                                    const host = API_URL.replace(/\/api\/?$/, '');
                                    fileHref = host + (fileHref.startsWith('/') ? fileHref : '/' + fileHref);
                                } else {
                                    fileHref = fileHref.startsWith('/') ? fileHref : ('/' + fileHref);
                                }
                            }
                            const filename = decodeURIComponent((fileHref || '').split('/').pop() || m.title || 'file');
                            html += `<div class="material-row" style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;"><a class="material-item material-link" style="flex:1;text-decoration:none;color:inherit;" href="${fileHref}" download="${filename}" rel="noopener noreferrer"><i class="fas fa-file"></i><span>${m.title}</span></a><button class="material-delete btn btn-danger" style="margin-left:0.5rem;" onclick="confirmDeleteMaterial('${m.id}')">Удалить</button></div>`;
                        }
                        children.forEach(child => {
                            let fileHref = child.fileUrl || '#';
                            if (fileHref && !fileHref.startsWith('http')) {
                                if (fileHref.startsWith('/uploads') || fileHref.startsWith('uploads')) {
                                    const host = API_URL.replace(/\/api\/?$/, '');
                                    fileHref = host + (fileHref.startsWith('/') ? fileHref : '/' + fileHref);
                                } else {
                                    fileHref = fileHref.startsWith('/') ? fileHref : ('/' + fileHref);
                                }
                            }
                            const filename = decodeURIComponent((fileHref || '').split('/').pop() || child.title || 'file');
                            html += `<div class="material-row" style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;"><a class="material-item material-link" style="flex:1;text-decoration:none;color:inherit;" href="${fileHref}" download="${filename}" rel="noopener noreferrer"><i class="fas fa-file"></i><span>${child.title}</span></a><button class="material-delete btn btn-danger" style="margin-left:0.5rem;" onclick="confirmDeleteMaterial('${child.id}')">Удалить</button></div>`;
                        });

                        if (children.length === 0 && !m.fileUrl) {
                            html += '<p style="color:#666; padding:0.5rem 0;">Нет файлов в теории.</p>';
                        }

                        html += `</div></div>`;
                    });
                } else {
                    html += '<p>Нет материалов.</p>';
                }
                html += `</div></div>`;

                html += `<div class="tab-content" id="practice">`;
                html += `<div class="topics-section">`;
                if (assignmentsResp.assignments && assignmentsResp.assignments.length > 0) {
                    const allMaterials = materialsResp.materials || [];
                    assignmentsResp.assignments.forEach(a => {
                        const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString('ru-RU') : '—';
                        const children = allMaterials.filter(m => String(m.assignmentId) === String(a.id));
                        html += `<div class="topic-item"><div class="topic-header"><h3>${a.title}</h3><div class="topic-actions"><button class="btn btn-primary btn-small add-material-btn" data-topic="${a.id}"><i class="fas fa-plus"></i> Добавить файлы</button></div></div>`;
                        html += `<div class="materials-list">`;
                        if (children.length > 0) {
                            children.forEach(child => {
                                let fileHref = child.fileUrl || '#';
                                if (fileHref && !fileHref.startsWith('http')) {
                                    if (fileHref.startsWith('/uploads') || fileHref.startsWith('uploads')) {
                                        const host = API_URL.replace(/\/api\/?$/, '');
                                        fileHref = host + (fileHref.startsWith('/') ? fileHref : '/' + fileHref);
                                    } else {
                                        fileHref = fileHref.startsWith('/') ? fileHref : ('/' + fileHref);
                                    }
                                }
                                const filename = decodeURIComponent((fileHref || '').split('/').pop() || child.title || 'file');
                                html += `<div class="material-row" style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;"><a class="material-item material-link" style="flex:1;text-decoration:none;color:inherit;" href="${fileHref}" download="${filename}" rel="noopener noreferrer"><i class="fas fa-file"></i><span>${child.title}</span></a><button class="material-delete btn btn-danger" style="margin-left:0.5rem;" onclick="confirmDeleteMaterial('${child.id}')">Удалить</button></div>`;
                            });
                        } else {
                            html += `<p style="color:#666; padding:0.5rem 0;">Нет файлов у задания. Дата дедлайна: ${deadline}</p>`;
                        }
                        html += `</div></div>`;
                    });
                } else {
                    html += '<p>Нет заданий.</p>';
                }
                html += `</div></div>`;

                contentContainer.innerHTML = html;

                initTabs();
                initMaterialButtons();
                initDownloads();
            }
        } catch (e) {
            console.error('Ошибка загрузки материалов/заданий:', e);
        }
    } catch (err) {
        console.error('Ошибка загрузки курса:', err);
    }
}
