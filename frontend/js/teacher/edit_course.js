let courseId = null;
let course = null;

document.addEventListener('DOMContentLoaded', async function() {
  checkAuth();
  const user = getUser();

  if (user.role !== 'teacher') {
    window.location.href = '/pages/student/dashboard.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  courseId = urlParams.get('id');

  if (!courseId) {
    alert('ID курса не указан');
    window.location.href = '/pages/teacher/main_teacher.html';
    return;
  }

  document.getElementById('teacher-name').textContent = formatShortName(user);

  await loadCourseData();
  await loadMaterials();
  await loadAssignments();

  document.getElementById('image-upload').addEventListener('change', handleImageUpload);
  document.getElementById('add-lecture-form').addEventListener('submit', handleAddLecture);
  document.getElementById('add-assignment-form').addEventListener('submit', handleAddAssignment);
  document.getElementById('upload-students-form').addEventListener('submit', handleUploadStudents);
  document.getElementById('students-file').addEventListener('change', handleStudentsFileUpload);

  await loadStudents();
});

// Загрузить данные курса
async function loadCourseData() {
  try {
    const data = await API.teacher.getCourses();
    course = data.courses.find(c => c.id === courseId);

    if (!course) {
      alert('Курс не найден');
      window.location.href = '/pages/teacher/main_teacher.html';
      return;
    }

    document.getElementById('course-title').textContent = course.title;
    document.getElementById('course-description').textContent = course.description || 'Нет описания';

    const imgElement = document.getElementById('course-image');
    if (course.imageUrl && course.imageUrl.trim() !== '') {
      imgElement.src = course.imageUrl;
      imgElement.style.display = 'block';
      imgElement.onerror = function() {
        console.error('Ошибка загрузки изображения:', course.imageUrl.substring(0, 100));
        this.style.display = 'none';
        this.parentElement.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Изображение не загружено</p>';
      };
    } else {
      imgElement.style.display = 'none';
      imgElement.parentElement.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Изображение не загружено</p>';
    }
  } catch (error) {
    console.error('Ошибка загрузки курса:', error);
    alert('Ошибка загрузки курса: ' + error.message);
  }
}

// Загрузить материалы (лекции)
async function loadMaterials() {
  try {
    const data = await API.teacher.getMaterials(courseId);
    const list = document.getElementById('lectures-list');

    if (!data.materials || data.materials.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">Нет лекций</p>';
      return;
    }

    const lectures = data.materials.filter(m => m.type === 'lecture');

    if (lectures.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">Нет лекций</p>';
      return;
    }

    list.innerHTML = lectures.map(lecture => `
      <div class="item-card">
        <div>
          <h4>${lecture.title}</h4>
          <p style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
            <i class="fas fa-calendar"></i> ${new Date(lecture.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div>
          <button class="btn btn-outline btn-small" onclick="viewMaterial('${lecture.id}')">
            <i class="fas fa-eye"></i> Просмотр
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Ошибка загрузки материалов:', error);
  }
}

// Загрузить задания
async function loadAssignments() {
  try {
    const data = await API.teacher.getCourseAssignments(courseId);
    const list = document.getElementById('assignments-list');

    if (!data.assignments || data.assignments.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">Нет заданий</p>';
      return;
    }

    list.innerHTML = data.assignments.map(assignment => `
      <div class="item-card">
        <div>
          <h4>${assignment.title}</h4>
          <p style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
            <i class="fas fa-clock"></i> Дедлайн: ${new Date(assignment.deadline).toLocaleDateString('ru-RU')}
            <span style="margin-left: 1rem;"><i class="fas fa-star"></i> ${assignment.maxScore} баллов</span>
          </p>
        </div>
        <div>
          <button class="btn btn-outline btn-small" onclick="viewAssignment('${assignment.id}')">
            <i class="fas fa-eye"></i> Просмотр
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Ошибка загрузки заданий:', error);
  }
}

// Загрузка изображения
async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Пожалуйста, выберите изображение');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    alert('Размер файла не должен превышать 50MB');
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const imageUrl = e.target.result;

      await API.teacher.updateCourseImage(courseId, imageUrl);

      const imgElement = document.getElementById('course-image');
      imgElement.src = imageUrl;
      imgElement.style.display = 'block';
      imgElement.textContent = '';

      alert('Изображение успешно обновлено!');
    };
    reader.readAsDataURL(file);
  } catch (error) {
    alert('Ошибка загрузки изображения: ' + error.message);
  }
}

// Модальные окна
function openAddLectureModal() {
  document.getElementById('add-lecture-modal').style.display = 'flex';
}

function closeAddLectureModal() {
  document.getElementById('add-lecture-modal').style.display = 'none';
  document.getElementById('add-lecture-form').reset();
}

function openAddAssignmentModal() {
  document.getElementById('add-assignment-modal').style.display = 'flex';
}

function closeAddAssignmentModal() {
  document.getElementById('add-assignment-modal').style.display = 'none';
  document.getElementById('add-assignment-form').reset();
}

// Добавить лекцию
async function handleAddLecture(e) {
  e.preventDefault();

  const title = document.getElementById('lecture-title').value;
  const content = document.getElementById('lecture-content').value;

  try {
    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('type', 'lecture');
    formData.append('title', title);
    formData.append('content', content);

    await API.teacher.uploadMaterial(formData);
    closeAddLectureModal();
    await loadMaterials();
    alert('Лекция добавлена успешно!');
  } catch (error) {
    alert('Ошибка добавления лекции: ' + error.message);
  }
}

// Добавить задание
async function handleAddAssignment(e) {
  e.preventDefault();

  const title = document.getElementById('assignment-title').value;
  const description = document.getElementById('assignment-description').value;
  const deadline = document.getElementById('assignment-deadline').value;
  const maxScore = parseInt(document.getElementById('assignment-maxScore').value);

  try {
    await API.teacher.createAssignment(courseId, {
      title,
      description,
      deadline,
      maxScore
    });

    closeAddAssignmentModal();
    await loadAssignments();
    alert('Задание добавлено успешно!');
  } catch (error) {
    alert('Ошибка добавления задания: ' + error.message);
  }
}

// Просмотр материала/задания
function viewMaterial(materialId) {
  alert(`Просмотр материала ${materialId} будет реализован в следующей версии`);
}

function viewAssignment(assignmentId) {
  alert(`Просмотр задания ${assignmentId} будет реализован в следующей версии`);
}

// Загрузить студентов курса
async function loadStudents() {
  try {
    const data = await API.teacher.getCourseStudents(courseId);
    const list = document.getElementById('students-list');

    if (!data.students || data.students.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">Нет студентов</p>';
      return;
    }

    list.innerHTML = data.students.map(student => `
      <div class="item-card">
        <div>
          <h4>${student.lastName} ${student.firstName} ${student.middleName || ''}</h4>
          <p style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
            <i class="fas fa-envelope"></i> ${student.email}
            ${student.groupName ? `<span style="margin-left: 1rem;"><i class="fas fa-users"></i> ${student.groupName}</span>` : ''}
          </p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Ошибка загрузки студентов:', error);
  }
}

// Модальное окно загрузки студентов
function openUploadStudentsModal() {
  document.getElementById('upload-students-modal').style.display = 'flex';
  document.getElementById('upload-results').style.display = 'none';
}

function closeUploadStudentsModal() {
  document.getElementById('upload-students-modal').style.display = 'none';
  document.getElementById('upload-students-form').reset();
  document.getElementById('upload-results').style.display = 'none';
}

// Обработка загрузки JSON файла
function handleStudentsFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      JSON.parse(content); // Проверяем валидность JSON
      document.getElementById('students-json').value = content;
    } catch (error) {
      alert('Ошибка чтения JSON файла: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Загрузить студентов
async function handleUploadStudents(e) {
  e.preventDefault();

  const jsonText = document.getElementById('students-json').value.trim();

  if (!jsonText) {
    alert('Пожалуйста, введите JSON данные или загрузите файл');
    return;
  }

  try {
    const students = JSON.parse(jsonText);

    if (!Array.isArray(students)) {
      alert('JSON должен содержать массив студентов');
      return;
    }

    if (students.length === 0) {
      alert('Массив студентов пуст');
      return;
    }

    const result = await API.teacher.bulkUploadStudents(courseId, students);

    // Показываем результаты
    const resultsDiv = document.getElementById('upload-results');
    resultsDiv.style.display = 'block';

    let html = '<h4>Результаты загрузки:</h4>';

    if (result.results.created.length > 0) {
      html += `<p style="color: green;"><strong>Создано студентов: ${result.results.created.length}</strong></p>`;
      html += '<ul style="font-size: 0.9rem;">';
      result.results.created.forEach(s => {
        html += `<li>${s.lastName} ${s.firstName} (${s.email})</li>`;
      });
      html += '</ul>';
    }

    if (result.results.enrolled.length > 0) {
      html += `<p style="color: blue;"><strong>Записано на курс (существующие): ${result.results.enrolled.length}</strong></p>`;
    }

    if (result.results.errors.length > 0) {
      html += `<p style="color: red;"><strong>Ошибки: ${result.results.errors.length}</strong></p>`;
      html += '<ul style="font-size: 0.9rem;">';
      result.results.errors.forEach(e => {
        html += `<li>${e.email}: ${e.error}</li>`;
      });
      html += '</ul>';
    }

    resultsDiv.innerHTML = html;

    await loadStudents();

    if (result.results.errors.length === 0) {
      setTimeout(() => {
        closeUploadStudentsModal();
      }, 3000);
    }

  } catch (error) {
    alert('Ошибка загрузки студентов: ' + error.message);
  }
}

// Форматирует имя в строку `Фамилия И.О.`
function formatShortName(user) {
  if (!user) return '';
  const last = user.lastName || '';
  const first = user.firstName || '';
  const middle = user.middleName || '';
  const f = first ? first.charAt(0) + '.' : '';
  const m = middle ? middle.charAt(0) + '.' : '';
  return `${last} ${f}${m}`.trim();
}
