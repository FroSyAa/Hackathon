document.addEventListener('DOMContentLoaded', function() {    
    initTabs();
    initMaterialButtons();
    initDownloads();
    initCourseActions();
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const targetTab = this.dataset.tab;
            // Убираем active у всех кнопок
            tabBtns.forEach(b => b.classList.remove('active'));
            // Добавляем active на текущую
            this.classList.add('active');
            // Убираем active у всего контента
            tabContents.forEach(content => content.classList.remove('active'));
            // Показываем нужный контент
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
        // Принудительно включаем кликабельность
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
    });
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
    // Закрытие модалки
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
    // Форма
    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('✅ Файл успешно загружен!');
            closeModal();
        });
    }
    // ESC
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
            alert(`📥 Скачивание: ${materialName}`);
            // Здесь будет реальная загрузка файла ЛИБО нужно сделать открытие в новом окне
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
                    alert('🔄 Перенаправление на редактирование...');
                    break;
                case 'Статистика':
                    alert('📊 Открытие статистики курса...');
                    break;
            }
        });
    });
}
