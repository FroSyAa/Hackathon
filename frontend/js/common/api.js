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

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  }

  if (response.status === 401 || response.status === 403) {
    clearAuth();
    const msg = data && data.error ? data.error : 'Unauthorized';
    if (!window.location.pathname.endsWith('/pages/common/login.html')) {
      window.location.href = '/pages/common/login.html';
    }
    throw new Error(msg);
  }

  if (!response.ok) {
    throw new Error((data && data.error) || 'Ошибка сервера');
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

    updateCourseImage: (courseId, imageUrl) =>
      fetchAPI(`/teacher/courses/${courseId}/image`, {
        method: 'PATCH',
        body: JSON.stringify({ imageUrl })
      }),

    createAssignment: (courseId, data) =>
      fetchAPI(`/teacher/courses/${courseId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    getAssignments: (courseId) => fetchAPI(`/teacher/courses/${courseId}/assignments`),

    uploadMaterial: (formData) =>
      fetchAPI('/teacher/materials', {
        method: 'POST',
        body: formData
      }),

    getMaterials: (courseId) => fetchAPI(`/teacher/materials/${courseId}`),
    getCourseAssignments: (courseId) => fetchAPI(`/teacher/courses/${courseId}/assignments`),

    getPendingSubmissions: () => fetchAPI('/teacher/assignments/pending'),

    gradeSubmission: (submissionId, score, feedback, status) =>
      fetchAPI(`/teacher/grade/${submissionId}`, {
        method: 'POST',
        body: JSON.stringify({ score, feedback, status })
      }),

    getProgress: (courseId) => fetchAPI(`/teacher/progress/${courseId}`),

    getStatistics: () => fetchAPI('/teacher/courses/statistics'),

    bulkUploadStudents: (courseId, students) =>
      fetchAPI('/teacher/students/bulk-upload', {
        method: 'POST',
        body: JSON.stringify({ courseId, students })
      }),

    getCourseStudents: (courseId) => fetchAPI(`/teacher/students/course/${courseId}`)
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
    getDirections: () => fetchAPI('/superadmin/directions'),
    createDirection: (name) =>
      fetchAPI('/superadmin/directions', {
        method: 'POST',
        body: JSON.stringify({ name })
      }),
    deleteDirection: (directionId) =>
      fetchAPI(`/superadmin/directions/${directionId}`, {
        method: 'DELETE'
      }),
    getDirectionAdmins: (directionId) => fetchAPI(`/superadmin/directions/${directionId}/admins`),
    createDirectionAdmin: (directionId, email, password, firstName, lastName, middleName) =>
      fetchAPI(`/superadmin/directions/${directionId}/admins`, {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, middleName })
      })
  },

  admin: {
    getTeachers: () => fetchAPI('/admin/teachers'),
    createTeacher: (email, password, firstName, lastName, middleName) =>
      fetchAPI('/admin/teachers', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, middleName })
      }),
    deleteTeacher: (teacherId) =>
      fetchAPI(`/admin/teachers/${teacherId}`, {
        method: 'DELETE'
      }),
    getStudents: () => fetchAPI('/admin/students'),
    createStudent: (email, password, firstName, lastName, middleName, groupName) =>
      fetchAPI('/admin/students', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, middleName, groupName })
      }),
    deleteStudent: (studentId) =>
      fetchAPI(`/admin/students/${studentId}`, {
        method: 'DELETE'
      })
  }
};
