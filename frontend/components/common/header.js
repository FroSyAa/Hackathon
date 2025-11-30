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
        <div class="header-right">
          <div class="notifications" id="headerNotifications" style="position:relative;">
            <button id="notifToggle" class="notif-btn">🔔 <span id="notifBadge" class="badge" style="display:none">0</span></button>
            <div id="notifDropdown" class="notif-dropdown" style="display:none; position:absolute; right:0; top:36px; background:#fff; border:1px solid #ddd; width:320px; box-shadow:0 6px 18px rgba(0,0,0,0.08); z-index:1000;">
              <div id="notifList" style="max-height:320px; overflow:auto;"></div>
              <div style="padding:0.5rem; text-align:center; border-top:1px solid #eee;"><a href="/pages/common/notifications.html">Показать все</a></div>
            </div>
          </div>
          <div class="user-info">
            <span>${formatShortName(user)}</span>
            <button onclick="logout()">Выйти</button>
          </div>
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
    // load notifications
    try {
      const btn = document.getElementById('notifToggle');
      const drop = document.getElementById('notifDropdown');
      const list = document.getElementById('notifList');
      const badge = document.getElementById('notifBadge');
      if (btn) {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (drop.style.display === 'none') {
            // fetch last 3
            try {
              const data = await API.common.getNotifications(3);
              const items = (data.notifications || []).map(n => `<div style="padding:0.75rem;border-bottom:1px solid #f0f0f0;"><strong>${escapeHtml(n.title)}</strong><div style="font-size:0.9rem;color:#555">${escapeHtml(n.body || '')}</div><div style="font-size:0.8rem;color:#999;margin-top:0.25rem">${new Date(n.createdAt).toLocaleString('ru-RU')}</div></div>`);
              list.innerHTML = items.join('') || '<div style="padding:0.75rem;color:#666">Нет уведомлений</div>';
              drop.style.display = 'block';
              badge.style.display = (data.notifications && data.notifications.length) ? 'inline-block' : 'none';
              badge.textContent = data.notifications ? data.notifications.length : 0;
            } catch (err) {
              list.innerHTML = '<div style="padding:0.75rem;color:#c00">Ошибка загрузки уведомлений</div>';
              drop.style.display = 'block';
            }
          } else {
            drop.style.display = 'none';
          }
        });
        document.addEventListener('click', () => { if (drop) drop.style.display = 'none'; });
      }
    } catch (e) {
      console.warn('Notifications init failed', e);
    }
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s];
  });
}

function formatShortName(user) {
  if (!user) return '';
  const last = user.lastName || '';
  const first = user.firstName || '';
  const middle = user.middleName || '';
  const f = first ? first.charAt(0) + '.' : '';
  const m = middle ? middle.charAt(0) + '.' : '';
  return `${last} ${f}${m}`.trim();
}