// Обработчик формы входа
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

// Обработка входа
async function handleLogin(e) {
  e.preventDefault();

  const email = e.target.querySelector('input[name="email"]').value;
  const password = e.target.querySelector('input[name="password"]').value;

  try {
    const data = await API.auth.login(email, password);
    saveAuth(data.token, data.user);

    if (data.user.role === 'teacher') {
      window.location.href = '/pages/teacher/dashboard.html';
    } else {
      window.location.href = '/pages/student/dashboard.html';
    }
  } catch (error) {
    alert('Ошибка входа: ' + error.message);
  }
}

// Обработка регистрации
async function handleRegister(e) {
  e.preventDefault();

  const email = e.target.querySelector('input[name="email"]').value;
  const password = e.target.querySelector('input[name="password"]').value;
  const confirmPassword = e.target.querySelector('input[name="confirm-password"]').value;
  const role = e.target.querySelector('select[name="role"]').value;
  const firstName = e.target.querySelector('input[name="firstName"]').value;
  const lastName = e.target.querySelector('input[name="lastName"]').value;

  if (password !== confirmPassword) {
    alert('Пароли не совпадают');
    return;
  }

  try {
    const data = await API.auth.register(email, password, role, firstName, lastName);
    saveAuth(data.token, data.user);

    if (data.user.role === 'teacher') {
      window.location.href = '/pages/teacher/dashboard.html';
    } else {
      window.location.href = '/pages/student/dashboard.html';
    }
  } catch (error) {
    alert('Ошибка регистрации: ' + error.message);
  }
}

// Выход из системы
function logout() {
  clearAuth();
  window.location.href = '/pages/common/login.html';
}