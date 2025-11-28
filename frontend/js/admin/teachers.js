let teacherPasswords = {};

document.addEventListener('DOMContentLoaded', async function() {
  checkAuth();
  const user = getUser();

  if (user.role !== 'admin') {
    alert('Доступ запрещен');
    window.location.href = '/pages/common/login.html';
    return;
  }

  document.getElementById('admin-name').textContent = `${user.firstName} ${user.lastName}`;

  await loadTeachers();

  document.getElementById('add-teacher-btn').addEventListener('click', openModal);
  document.getElementById('add-teacher-form').addEventListener('submit', handleAddTeacher);

  generatePassword();
});

// Генерация случайного пароля
function generatePassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  document.getElementById('teacher-password').value = password;
}

// Загрузка преподавателей
async function loadTeachers() {
  try {
    const data = await API.admin.getTeachers();
    const tbody = document.getElementById('teachers-tbody');

    if (!data.teachers || data.teachers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Нет преподавателей</td></tr>';
      return;
    }

    tbody.innerHTML = data.teachers.map(teacher => {
      const user = teacher.user;
      const password = teacherPasswords[teacher.id] || '••••••••';
      const createdAt = new Date(teacher.createdAt).toLocaleDateString('ru-RU');

      return `
        <tr>
          <td>${user.firstName} ${user.lastName}</td>
          <td>${user.email}</td>
          <td class="password-cell">${password}</td>
          <td>${createdAt}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Ошибка загрузки преподавателей:', error);
    alert('Ошибка загрузки: ' + error.message);
  }
}

// Открыть модальное окно
function openModal() {
  generatePassword();
  document.getElementById('add-teacher-modal').style.display = 'flex';
}

// Закрыть модальное окно
function closeModal() {
  document.getElementById('add-teacher-modal').style.display = 'none';
  document.getElementById('add-teacher-form').reset();
}

// Создать преподавателя
async function handleAddTeacher(e) {
  e.preventDefault();

  const email = document.getElementById('teacher-email').value;
  const password = document.getElementById('teacher-password').value;
  const firstName = document.getElementById('teacher-firstName').value;
  const lastName = document.getElementById('teacher-lastName').value;

  try {
    const data = await API.admin.createTeacher(email, password, firstName, lastName);

    teacherPasswords[data.user.teacherId] = password;

    const credentials = `ФИО: ${firstName} ${lastName}\nEmail: ${email}\nПароль: ${password}`;
    alert(`Преподаватель создан!\n\n${credentials}\n\nСкопируйте эти данные и передайте преподавателю.`);

    closeModal();
    await loadTeachers();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}