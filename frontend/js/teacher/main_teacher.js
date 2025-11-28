document.addEventListener('DOMContentLoaded', function() {
    const periodBtns = document.querySelectorAll('.period-btn');
    const currentPeriodSpan = document.getElementById('current-period');
    
    let currentPeriod = 'week';
    
    // Функция получения текущей даты для отображения периода
    function getPeriodText(period) {
        const now = new Date();
        
        switch(period) {
            case 'week':
                const startWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return `последние 7 дней (${startWeek.toLocaleDateString('ru-RU')} - ${now.toLocaleDateString('ru-RU')})`;
            case 'month':
                return `за ${now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`;
            case 'year':
                return `за ${now.getFullYear()} год`;
            default:
                return 'последняя неделя';
        }
    }
    
    // Обработчики кнопок переключения периода
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс со всех кнопок
            periodBtns.forEach(b => b.classList.remove('active'));
            // Добавляем активный класс на текущую кнопку
            this.classList.add('active');
            
            const period = this.dataset.period;
            
            // Меняем только текст периода
            currentPeriodSpan.textContent = getPeriodText(period);
            currentPeriod = period;
        });
    });
    
    // Инициализация - показываем текущий период
    if (currentPeriodSpan) {
        currentPeriodSpan.textContent = getPeriodText(currentPeriod);
    }
    
    // Добавляем эффект появления карточек (без изменения статистики)
    const statCards = document.querySelectorAll('.stat-card');
    setTimeout(() => {
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }, 500);
});
