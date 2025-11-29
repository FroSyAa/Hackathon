let pendingOrgId = null;
let pendingOrgName = null;

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
  document.getElementById('password-check-form').addEventListener('submit', handlePasswordCheck);
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
        <p><i class="fas fa-map-marker-alt"></i> ${org.city}</p>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-primary btn-small" onclick="openAdminModal('${org.id}')">
            <i class="fas fa-user-plus"></i> Добавить администратора
          </button>
          <button class="btn btn-outline btn-small" onclick="viewAdmins('${org.id}', '${org.name}')" style="border:2px solid #004C97;color:#004C97;">
            <i class="fas fa-eye"></i> Просмотр админов
          </button>
        </div>
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
  const city = document.getElementById('org-city').value;

  try {
    await API.superadmin.createOrganization(name, city);
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

  try {
    const data = await API.superadmin.createOrgAdmin(orgId, email, password, '', '');

    const credentials = `Email: ${data.user.email}\nПароль: ${password}`;
    alert(`Администратор создан!\n\n${credentials}\n\nСкопируйте эти данные и передайте администратору.`);

    closeAdminModal();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

// Запросить пароль перед просмотром админов
function viewAdmins(orgId, orgName) {
  pendingOrgId = orgId;
  pendingOrgName = orgName;
  document.getElementById('password-check-modal').style.display = 'flex';
  document.getElementById('superadmin-password-check').value = '';
}

// Проверить пароль и показать админов
async function handlePasswordCheck(e) {
  e.preventDefault();
  const password = document.getElementById('superadmin-password-check').value;

  // Проверяем пароль супер-админа
  if (password !== '123456') {  // Здесь должен быть пароль из процесса входа
    alert('Неверный пароль!');
    return;
  }

  closePasswordModal();
  await loadAdminsList(pendingOrgId, pendingOrgName);
}

// Загрузить список админов
async function loadAdminsList(orgId, orgName) {
  try {
    const data = await API.superadmin.getOrgAdmins(orgId);
    const modal = document.getElementById('view-admins-modal');
    const content = document.getElementById('admins-list-content');

    if (!data.admins || data.admins.length === 0) {
      content.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Нет администраторов для этой организации</p>';
    } else {
      content.innerHTML = `
        <h3 style="color:#004C97;margin-bottom:1rem;">${orgName}</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f7fa;">
              <th style="padding:1rem;text-align:left;color:#004C97;font-weight:600;border-bottom:2px solid #004C97;">Email</th>
              <th style="padding:1rem;text-align:left;color:#004C97;font-weight:600;border-bottom:2px solid #004C97;">Дата создания</th>
            </tr>
          </thead>
          <tbody>
            ${data.admins.map(admin => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:1rem;">${admin.user.email}</td>
                <td style="padding:1rem;">${new Date(admin.createdAt).toLocaleDateString('ru-RU')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    modal.style.display = 'flex';
  } catch (error) {
    alert('Ошибка загрузки: ' + error.message);
  }
}

// Закрыть модальное окно проверки пароля
function closePasswordModal() {
  document.getElementById('password-check-modal').style.display = 'none';
  document.getElementById('password-check-form').reset();
}

// Закрыть модальное окно просмотра админов
function closeViewAdminsModal() {
  document.getElementById('view-admins-modal').style.display = 'none';
}
