let pendingDirectionId = null;
let pendingDirectionName = null;

document.addEventListener('DOMContentLoaded', async function() {
  checkAuth();
  const user = getUser();

  if (user.role !== 'superadmin') {
    alert('Доступ запрещен');
    window.location.href = '/pages/common/login.html';
    return;
  }

  await loadDirections();

  document.getElementById('add-direction-btn').addEventListener('click', openModal);
  document.getElementById('add-direction-form').addEventListener('submit', handleAddDirection);
  document.getElementById('add-admin-form').addEventListener('submit', handleAddAdmin);
  document.getElementById('password-check-form').addEventListener('submit', handlePasswordCheck);
});

// Загрузка направлений
async function loadDirections() {
  try {
    const data = await API.superadmin.getDirections();
    const list = document.getElementById('directions-list');

    if (!data.directions || data.directions.length === 0) {
      list.innerHTML = '<p>Нет направлений</p>';
      return;
    }

    list.innerHTML = data.directions.map(dir => `
      <div class="org-card">
        <h3><i class="fas fa-compass"></i> ${dir.name}</h3>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:1rem;">
          <button class="btn btn-primary btn-small" onclick="openAdminModal('${dir.id}')">
            <i class="fas fa-user-plus"></i> Добавить администратора
          </button>
          <button class="btn btn-outline btn-small" onclick="viewAdmins('${dir.id}', '${dir.name}')" style="border:2px solid #004C97;color:#004C97;">
            <i class="fas fa-eye"></i> Просмотр админов
          </button>
          <button class="btn btn-outline btn-small" onclick="deleteDirection('${dir.id}', '${dir.name}')" style="border:2px solid #dc3545;color:#dc3545;">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Ошибка загрузки направлений:', error);
    alert('Ошибка загрузки: ' + error.message);
  }
}

// Открыть модальное окно создания направления
function openModal() {
  document.getElementById('add-direction-modal').style.display = 'flex';
}

// Закрыть модальное окно создания направления
function closeModal() {
  document.getElementById('add-direction-modal').style.display = 'none';
  document.getElementById('add-direction-form').reset();
}

// Создать направление
async function handleAddDirection(e) {
  e.preventDefault();

  const name = document.getElementById('direction-name').value;

  try {
    await API.superadmin.createDirection(name);
    closeModal();
    await loadDirections();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

// Удалить направление
async function deleteDirection(directionId, directionName) {
  if (!confirm(`Вы уверены, что хотите удалить направление "${directionName}"?\n\nЭто действие также удалит всех администраторов, преподавателей и студентов этого направления.`)) {
    return;
  }

  try {
    await API.superadmin.deleteDirection(directionId);
    await loadDirections();
    alert('Направление удалено');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
}

// Открыть модальное окно добавления администратора
function openAdminModal(directionId) {
  document.getElementById('admin-direction-id').value = directionId;
  document.getElementById('add-admin-modal').style.display = 'flex';
}

// Закрыть модальное окно добавления администратора
function closeAdminModal() {
  document.getElementById('add-admin-modal').style.display = 'none';
  document.getElementById('add-admin-form').reset();
}

// Создать администратора направления
async function handleAddAdmin(e) {
  e.preventDefault();

  const directionId = document.getElementById('admin-direction-id').value;
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const firstName = document.getElementById('admin-firstName').value;
  const lastName = document.getElementById('admin-lastName').value;
  const middleName = document.getElementById('admin-middleName').value;

  try {
    await API.superadmin.createDirectionAdmin(directionId, email, password, firstName, lastName, middleName);
    closeAdminModal();
    alert('Администратор создан');
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

// Просмотр администраторов направления (с проверкой пароля)
function viewAdmins(directionId, directionName) {
  pendingDirectionId = directionId;
  pendingDirectionName = directionName;
  document.getElementById('password-check-modal').style.display = 'flex';
  document.getElementById('superadmin-password-check').focus();
}

// Обработка проверки пароля
async function handlePasswordCheck(e) {
  e.preventDefault();

  const password = document.getElementById('superadmin-password-check').value;

  // Проверка пароля супер-админа
  if (password !== '123456') { // значение из SUPER_ADMIN_PASSWORD в .env
    alert('Неверный пароль!');
    return;
  }

  // Закрыть модальное окно проверки пароля
  document.getElementById('password-check-modal').style.display = 'none';
  document.getElementById('password-check-form').reset();

  // Загрузить список администраторов
  await loadAdminsList(pendingDirectionId, pendingDirectionName);
}

// Закрыть модальное окно проверки пароля
function closePasswordModal() {
  document.getElementById('password-check-modal').style.display = 'none';
  document.getElementById('password-check-form').reset();
  pendingDirectionId = null;
  pendingDirectionName = null;
}

// Загрузить список администраторов направления
async function loadAdminsList(directionId, directionName) {
  try {
    const data = await API.superadmin.getDirectionAdmins(directionId);
    const modal = document.getElementById('view-admins-modal');
    const list = document.getElementById('admins-list');

    document.getElementById('admins-modal-title').textContent = `Администраторы направления: ${directionName}`;

    if (!data.admins || data.admins.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#666;">Нет администраторов</p>';
    } else {
      list.innerHTML = data.admins.map(admin => `
        <div style="padding:1rem;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong style="color:#004C97;">${admin.user.firstName} ${admin.user.lastName} ${admin.user.middleName || ''}</strong>
            <br>
            <span style="color:#666;font-size:0.9rem;">
              <i class="fas fa-envelope"></i> ${admin.user.email}
            </span>
          </div>
        </div>
      `).join('');
    }

    modal.style.display = 'flex';
  } catch (error) {
    alert('Ошибка загрузки администраторов: ' + error.message);
  }
}

// Закрыть модальное окно просмотра администраторов
function closeViewAdminsModal() {
  document.getElementById('view-admins-modal').style.display = 'none';
}

// Выход
function logout() {
  clearAuth();
  window.location.href = '/pages/common/login.html';
}
