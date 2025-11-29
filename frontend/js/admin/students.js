let studentPasswords = {};
let allStudents = [];

document.addEventListener('DOMContentLoaded', async function() {
  checkAuth();
  const user = getUser();

  if (user.role !== 'admin') {
    alert('Доступ запрещен');
    window.location.href = '/pages/common/login.html';
    return;
  }

  document.getElementById('admin-name').textContent = `${user.firstName} ${user.lastName}`;

  await loadStudents();

  document.getElementById('add-student-btn').addEventListener('click', openModal);
  document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
  document.getElementById('group-filter').addEventListener('change', filterByGroup);

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
  document.getElementById('student-password').value = password;
}

// Загрузка студентов
async function loadStudents() {
  try {
    const data = await API.admin.getStudents();
    allStudents = data.students || [];

    // Заполнить фильтр групп
    const groups = [...new Set(allStudents.map(s => s.groupName).filter(g => g))];
    const groupFilter = document.getElementById('group-filter');
    groupFilter.innerHTML = '<option value="">Все группы</option>';
    groups.forEach(group => {
      groupFilter.innerHTML += `<option value="${group}">${group}</option>`;
    });

    renderStudents(allStudents);
  } catch (error) {
    console.error('Ошибка загрузки студентов:', error);
    alert('Ошибка загрузки: ' + error.message);
  }
}

// Отрисовка студентов
function renderStudents(students) {
  const tbody = document.getElementById('students-tbody');

  if (!students || students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Нет студентов</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(student => {
    const user = student.user;
    const password = studentPasswords[student.id] || '••••••••';
    const createdAt = new Date(student.createdAt).toLocaleDateString('ru-RU');
    const fullName = `${user.lastName} ${user.firstName}${user.middleName ? ' ' + user.middleName : ''}`;
    const groupName = student.groupName || '-';

    return `
      <tr>
        <td>${fullName}</td>
        <td>${user.email}</td>
        <td>${groupName}</td>
        <td class="password-cell">${password}</td>
        <td>${createdAt}</td>
      </tr>
    `;
  }).join('');
}

// Фильтрация по группам
function filterByGroup() {
  const selectedGroup = document.getElementById('group-filter').value;

  if (!selectedGroup) {
    renderStudents(allStudents);
  } else {
    const filtered = allStudents.filter(s => s.groupName === selectedGroup);
    renderStudents(filtered);
  }
}

// Открыть модальное окно
function openModal() {
  generatePassword();
  document.getElementById('add-student-modal').style.display = 'flex';
}

// Закрыть модальное окно
function closeModal() {
  document.getElementById('add-student-modal').style.display = 'none';
  document.getElementById('add-student-form').reset();
}

// Создать студента
async function handleAddStudent(e) {
  e.preventDefault();

  const email = document.getElementById('student-email').value;
  const password = document.getElementById('student-password').value;
  const firstName = document.getElementById('student-firstName').value;
  const lastName = document.getElementById('student-lastName').value;
  const middleName = document.getElementById('student-middleName').value;
  const groupName = document.getElementById('student-groupName').value;

  try {
    const data = await API.admin.createStudent(email, password, firstName, lastName, middleName, groupName);

    studentPasswords[data.user.studentId] = password;

    const fullName = `${lastName} ${firstName}${middleName ? ' ' + middleName : ''}`;
    const credentials = `ФИО: ${fullName}\nГруппа: ${groupName || 'Не указана'}\nEmail: ${email}\nПароль: ${password}`;
    alert(`Студент создан!\n\n${credentials}\n\nСкопируйте эти данные и передайте студенту.`);

    closeModal();
    await loadStudents();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}
