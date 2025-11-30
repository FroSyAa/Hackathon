document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('courseForm');
    const steps = document.querySelectorAll('.form-step');
    const stepItems = document.querySelectorAll('.step-item');
    const nextBtn = document.querySelector('.form-navigation .next-step');
    const prevBtn = document.querySelector('.form-navigation .prev-step');
    const submitBtn = document.querySelector('.form-navigation .create-course-btn');
    
    let currentStep = 1;
    let theoryTopics = [];
    let practiceTopics = [];
    
    console.log('Кнопки найдены:', { nextBtn, prevBtn, submitBtn });
    
    
    initImagePreview();
    initDragAndDrop();
    initTopicButtons();
    loadGroups();
    updateStep();
    const user = getUser();
    if (user) {
        const nameSpan = document.querySelector('.user-info span');
        if (nameSpan) nameSpan.textContent = formatShortName(user);
    }

    // Подгрузка групп из БД
    async function loadGroups() {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch('/api/common/groups', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            if (!resp.ok) return;
            const data = await resp.json();
            const container = document.querySelector('.groups-container');
            if (!container) return;
            if (!data.groups || data.groups.length === 0) {
                container.innerHTML = '<p>Группы не найдены.</p>';
                return;
            }
            container.innerHTML = data.groups.map(g => `
                <div class="group-item">
                  <label class="group-checkbox">
                    <input type="checkbox" name="group" value="${g}">
                    <span>${g}</span>
                  </label>
                </div>
            `).join('');
        } catch (e) {
            console.error('Ошибка загрузки групп:', e);
        }
    }
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (form) form.addEventListener('submit', handleSubmit);
    
    function nextStep() {
        console.log('function nextStep', currentStep);
        if (validateCurrentStep()) {
            currentStep++;
            updateStep();
        } else {
            console.log('function nextStep failed'); 
        }
    }
    
    function prevStep() {
        currentStep--;
        updateStep();
    }
    
    function updateStep() {
        console.log('Updating step to:', currentStep);
        
        steps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === currentStep);
        });
        
        stepItems.forEach((item, index) => {
            item.classList.remove('active', 'completed');
            if (index + 1 < currentStep) {
                item.classList.add('completed');
            } else if (index + 1 === currentStep) {
                item.classList.add('active');
            }
        });
        
        if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.style.display = currentStep < 3 ? 'inline-flex' : 'none';
        if (submitBtn) submitBtn.style.display = currentStep === 3 ? 'inline-flex' : 'none';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function validateCurrentStep() {
        console.log('function validateCurrentStep:', currentStep);
        
        if (currentStep === 1) {
            const titleInput = form.querySelector('[name="courseTitle"]');
            console.log('Title input:', titleInput, titleInput?.value);
            if (titleInput && titleInput.value.trim()) {
                return true;
            }
            alert('Заполните название курса!');
            titleInput?.focus();
            return false;
        }
        
        if (currentStep === 2) {
            return true;
        }
        
        if (currentStep === 3) {
            const groups = form.querySelectorAll('input[name="group"]:checked');
            if (groups.length > 0) {
                return true;
            }
            alert('Выберите хотя бы одну группу!');
            return false;
        }
        
        return true;
    }
    
    function initImagePreview() {
        const fileInput = form.querySelector('[name="courseImage"]');
        const preview = document.getElementById('imagePreview');
        
        if (fileInput && preview) {
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.src = e.target.result;
                        preview.classList.add('show');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
    
    function initTopicButtons() {
        document.querySelectorAll('.add-topic-btn').forEach(btn => {
            btn.addEventListener('click', addTopic);
        });
    }
    
    // Добавление тем
    function addTopic() {
        const input = this.previousElementSibling;
        const title = input.value.trim();
        
        if (title) {
            const column = this.closest('.materials-column');
            const listId = column.querySelector('.topics-list').id;
            const topics = listId === 'theoryTopics' ? theoryTopics : practiceTopics;
            
            const topic = {
                id: Date.now(),
                title: title
            };
            
            topics.push(topic);
            renderTopics(listId);
            input.value = '';
        } else {
            alert('Введите название темы!');
        }
    }
    
    window.deleteTopic = function(btn) {
        const listId = btn.closest('.topics-list').id;
        const topics = listId === 'theoryTopics' ? theoryTopics : practiceTopics;
        const topicId = parseInt(btn.dataset.topicId);
        
        const index = topics.findIndex(t => t.id === topicId);
        if (index > -1) {
            topics.splice(index, 1);
            renderTopics(listId);
        }
    };
    
    function renderTopics(listId) {
        const list = document.getElementById(listId);
        const topics = listId === 'theoryTopics' ? theoryTopics : practiceTopics;
        
        if (list) {
            list.innerHTML = topics.map(topic => `
                <li class="topic-item" draggable="true" data-topic-id="${topic.id}">
                    <i class="fas fa-grip-vertical topic-drag-handle"></i>
                    <span class="topic-content">${topic.title}</span>
                    <div class="topic-actions">
                        <button class="topic-delete" data-topic-id="${topic.id}" onclick="deleteTopic(this)" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        }
    }
    
    // Drag & Drop (упрощенный)
    function initDragAndDrop() {
        document.querySelectorAll('.topics-list').forEach(list => {
            list.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('drag-over');
            });
            list.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });
            list.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
            });
        });
    }
    
    function handleSubmit(e) {
        e.preventDefault();
        const fd = new FormData();
        const title = form.querySelector('[name="courseTitle"]').value;
        const description = form.querySelector('[name="courseDescription"]').value || '';
        fd.append('title', title);
        fd.append('description', description);

        const fileInput = form.querySelector('[name="courseImage"]');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            fd.append('image', fileInput.files[0]);
        }

        const groups = Array.from(form.querySelectorAll('input[name="group"]:checked')).map(i => i.value);
        fd.append('groups', JSON.stringify(groups));

        fd.append('theoryTopics', JSON.stringify(theoryTopics));
        fd.append('practiceTopics', JSON.stringify(practiceTopics));

        API.teacher.createCourse(fd)
            .then(resp => {
                alert('✅ Курс успешно создан! Перенаправляю на редактирование...');
                window.location.href = `/pages/teacher/edit_course.html?id=${resp.course.id}`;
            })
            .catch(err => {
                console.error('Ошибка создания курса:', err);
                alert('Ошибка создания курса: ' + (err.message || err));
            });
    }
});

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
