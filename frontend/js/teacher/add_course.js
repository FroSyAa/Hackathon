document.addEventListener('DOMContentLoaded', function() {
    // Правильные селекторы для кнопок
    const form = document.getElementById('courseForm');
    const steps = document.querySelectorAll('.form-step');
    const stepItems = document.querySelectorAll('.step-item');
    const nextBtn = document.querySelector('.form-navigation .next-step');
    const prevBtn = document.querySelector('.form-navigation .prev-step');
    const submitBtn = document.querySelector('.form-navigation .create-course-btn');
    
    let currentStep = 1;
    let theoryTopics = [];
    let practiceTopics = [];
    
    console.log('Кнопки найдены:', { nextBtn, prevBtn, submitBtn }); // DEBUG
    
    // Инициализация
    initImagePreview();
    initDragAndDrop();
    initTopicButtons();
    updateStep();
    
    // Навигация - ПРЯМАЯ привязка
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (form) form.addEventListener('submit', handleSubmit);
    
    function nextStep() {
        console.log('Next clicked, currentStep:', currentStep); // DEBUG
        if (validateCurrentStep()) {
            currentStep++;
            updateStep();
        } else {
            console.log('Validation failed'); // DEBUG
        }
    }
    
    function prevStep() {
        currentStep--;
        updateStep();
    }
    
    function updateStep() {
        console.log('Updating step to:', currentStep); // DEBUG
        
        // Обновляем видимость шагов
        steps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === currentStep);
        });
        
        // Обновляем индикатор шагов
        stepItems.forEach((item, index) => {
            item.classList.remove('active', 'completed');
            if (index + 1 < currentStep) {
                item.classList.add('completed');
            } else if (index + 1 === currentStep) {
                item.classList.add('active');
            }
        });
        
        // Обновляем кнопки
        if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.style.display = currentStep < 3 ? 'inline-flex' : 'none';
        if (submitBtn) submitBtn.style.display = currentStep === 3 ? 'inline-flex' : 'none';
        
        // Прокрутка к верху
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function validateCurrentStep() {
        console.log('Validating step:', currentStep); // DEBUG
        
        if (currentStep === 1) {
            const titleInput = form.querySelector('[name="courseTitle"]');
            console.log('Title input:', titleInput, titleInput?.value); // DEBUG
            if (titleInput && titleInput.value.trim()) {
                return true;
            }
            alert('Заполните название курса!');
            titleInput?.focus();
            return false;
        }
        
        if (currentStep === 2) {
            // Для шага 2 можно не проверять, если темы необязательны
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
    
    // Предпросмотр изображения
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
    
    // Инициализация кнопок добавления тем
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
        
        const formData = new FormData(form);
        const courseData = {
            title: formData.get('courseTitle'),
            category: formData.get('courseCategory'),
            groups: Array.from(formData.getAll('group')),
            theoryTopics: theoryTopics,
            practiceTopics: practiceTopics
        };
        
        console.log('Создан курс:', courseData);
        alert('✅ Курс успешно создан!\n\n' + JSON.stringify(courseData, null, 2));
    }
});
