const API_URL = 'http://localhost:3000/api';

// Получить токен из localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Сохранить токен и данные пользователя
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

// Очистить авторизацию
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Получить данные пользователя
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Проверить авторизацию
function checkAuth() {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = '/pages/common/login.html';
    return false;
  }
  return true;
}

// Базовый fetch с токеном
async function fetchAPI(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    clearAuth();
    window.location.href = '/pages/common/login.html';
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка сервера');
  }

  return data;
}

// API методы
const API = {
  auth: {
    login: (email, password, role) =>
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
      }),

    getProfile: () => fetchAPI('/auth/me')
  },

  teacher: {
    getCourses: () => fetchAPI('/teacher/courses'),
    createCourse: (title, description) =>
      fetchAPI('/teacher/courses', {
        method: 'POST',
        body: JSON.stringify({ title, description })
      }),

    createAssignment: (courseId, data) =>
      fetchAPI(`/teacher/courses/${courseId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    uploadMaterial: (formData) =>
      fetchAPI('/teacher/materials', {
        method: 'POST',
        body: formData
      }),

    getMaterials: (courseId) => fetchAPI(`/teacher/materials/${courseId}`),

    getPendingSubmissions: () => fetchAPI('/teacher/assignments/pending'),

    gradeSubmission: (submissionId, score, feedback, status) =>
      fetchAPI(`/teacher/grade/${submissionId}`, {
        method: 'POST',
        body: JSON.stringify({ score, feedback, status })
      }),

    getProgress: (courseId) => fetchAPI(`/teacher/progress/${courseId}`),

    getStatistics: () => fetchAPI('/teacher/courses/statistics')
  },

  student: {
    getCourses: () => fetchAPI('/student/courses'),
    getMaterials: (courseId) => fetchAPI(`/student/courses/${courseId}/materials`),
    getStats: (courseId) => fetchAPI(`/student/courses/${courseId}/stats`),
    getAssignments: () => fetchAPI('/student/assignments'),
    submitAssignment: (assignmentId, formData) =>
      fetchAPI(`/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      }),
    getFeedback: (assignmentId) => fetchAPI(`/student/assignments/${assignmentId}/feedback`)
  },

  superadmin: {
    getOrganizations: () => fetchAPI('/superadmin/organizations'),
    createOrganization: (name, city) =>
      fetchAPI('/superadmin/organizations', {
        method: 'POST',
        body: JSON.stringify({ name, city })
      }),
    getOrgAdmins: (orgId) => fetchAPI(`/superadmin/organizations/${orgId}/admins`),
    createOrgAdmin: (orgId, email, password, firstName, lastName) =>
      fetchAPI(`/superadmin/organizations/${orgId}/admins`, {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName })
      })
  },

  admin: {
    getTeachers: () => fetchAPI('/admin/teachers'),
    createTeacher: (email, password, firstName, lastName, middleName) =>
      fetchAPI('/admin/teachers', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, middleName })
      }),
    getStudents: () => fetchAPI('/admin/students'),
    createStudent: (email, password, firstName, lastName, middleName, groupName) =>
      fetchAPI('/admin/students', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, middleName, groupName })
      })
  }
};
