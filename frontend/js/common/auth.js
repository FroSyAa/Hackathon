document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

// Обработка входа
async function handleLogin(e) {
  e.preventDefault();

  const email = e.target.querySelector('input[name="email"]').value;
  const password = e.target.querySelector('input[name="password"]').value;
  const role = e.target.querySelector('select[name="role"]').value;

  try {
    const data = await API.auth.login(email, password, role);
    saveAuth(data.token, data.user);

    if (data.user.role === 'superadmin') {
      window.location.href = '/pages/superadmin/organizations.html';
    } else if (data.user.role === 'admin') {
      window.location.href = '/pages/admin/teachers.html';
    } else if (data.user.role === 'teacher') {
      window.location.href = '/pages/teacher/main_teacher.html';
    } else {
      window.location.href = '/pages/student/dashboard.html';
    }
  } catch (error) {
    alert('Ошибка входа: ' + error.message);
  }
}

// Выход из системы
function logout() {
  clearAuth();
  window.location.href = '/pages/common/login.html';
}
