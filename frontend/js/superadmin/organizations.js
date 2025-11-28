document.addEventListener('DOMContentLoaded', async function() {
  checkAuth();
  const user = getUser();

  if (user.role !== 'superadmin') {
    alert('Доступ запрещен');
    window.location.href = '/pages/common/login.html';
    return;
  }

  await loadOrganizations();

  document.getElementById('add-org-btn').addEventListener('click', openModal);
  document.getElementById('add-org-form').addEventListener('submit', handleAddOrganization);
  document.getElementById('add-admin-form').addEventListener('submit', handleAddAdmin);
});

// Загрузка организаций
async function loadOrganizations() {
  try {
    const data = await API.superadmin.getOrganizations();
    const list = document.getElementById('organizations-list');

    if (!data.organizations || data.organizations.length === 0) {
      list.innerHTML = '<p>Нет организаций</p>';
      return;
    }

    list.innerHTML = data.organizations.map(org => `
      <div class="org-card">
        <h3>${org.name}</h3>
        <p>${org.description || 'Нет описания'}</p>
        <button class="btn btn-primary btn-small" onclick="openAdminModal('${org.id}')">
          <i class="fas fa-user-plus"></i> Добавить администратора
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Ошибка загрузки организаций:', error);
    alert('Ошибка загрузки: ' + error.message);
  }
}

// Открыть модальное окно создания организации
function openModal() {
  document.getElementById('add-org-modal').style.display = 'flex';
}

// Закрыть модальное окно создания организации
function closeModal() {
  document.getElementById('add-org-modal').style.display = 'none';
  document.getElementById('add-org-form').reset();
}

// Создать организацию
async function handleAddOrganization(e) {
  e.preventDefault();

  const name = document.getElementById('org-name').value;
  const description = document.getElementById('org-description').value;

  try {
    await API.superadmin.createOrganization(name, description);
    closeModal();
    await loadOrganizations();
    alert('Организация создана');
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

// Открыть модальное окно создания админа
function openAdminModal(orgId) {
  document.getElementById('admin-org-id').value = orgId;
  document.getElementById('add-admin-modal').style.display = 'flex';
}

// Закрыть модальное окно создания админа
function closeAdminModal() {
  document.getElementById('add-admin-modal').style.display = 'none';
  document.getElementById('add-admin-form').reset();
}

// Создать админа ВУЗа
async function handleAddAdmin(e) {
  e.preventDefault();

  const orgId = document.getElementById('admin-org-id').value;
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const firstName = document.getElementById('admin-firstName').value;
  const lastName = document.getElementById('admin-lastName').value;

  try {
    const data = await API.superadmin.createOrgAdmin(orgId, email, password, firstName, lastName);

    const credentials = `Email: ${data.user.email}\nПароль: ${password}`;
    alert(`Администратор создан!\n\n${credentials}\n\nСкопируйте эти данные и передайте администратору.`);

    closeAdminModal();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}