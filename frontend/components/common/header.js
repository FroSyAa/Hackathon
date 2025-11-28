// Шапка
function renderHeader() {
  const user = getUser();
  if (!user) return '';

  const teacherNav = `
    <nav>
      <a href="/pages/teacher/dashboard.html">Мой класс</a>
      <a href="/pages/teacher/grading.html">Оценка работ</a>
    </nav>
  `;

  const studentNav = `
    <nav>
      <a href="/pages/student/dashboard.html">Мой класс</a>
      <a href="/pages/student/assignments.html">Задания</a>
    </nav>
  `;

  return `
    <header class="main-header">
      <div class="header-content">
        <h1>Панель управления</h1>
        ${user.role === 'teacher' ? teacherNav : studentNav}
        <div class="user-info">
          <span>${user.firstName} ${user.lastName}</span>
          <button onclick="logout()">Выйти</button>
        </div>
      </div>
    </header>
  `;
}

// Добавить шапку на страницу
document.addEventListener('DOMContentLoaded', () => {
  const headerContainer = document.getElementById('header');
  if (headerContainer) {
    headerContainer.innerHTML = renderHeader();
  }
});