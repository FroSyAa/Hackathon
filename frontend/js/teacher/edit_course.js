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
  const teacherNameEl = document.getElementById('teacher-name');
  if (teacherNameEl) teacherNameEl.textContent = formatShortName(user);

  await loadCourseData();
  await loadMaterials();
  await loadAssignments();
  await loadStudents();

  const imgUploadEl = document.getElementById('image-upload');
  if (imgUploadEl) imgUploadEl.addEventListener('change', handleImageUpload);

  const addLectureForm = document.getElementById('add-lecture-form');
  if (addLectureForm) addLectureForm.addEventListener('submit', handleAddLecture);

  const addAssignmentForm = document.getElementById('add-assignment-form');
  if (addAssignmentForm) addAssignmentForm.addEventListener('submit', handleAddAssignment);

  const addStudentBtn = document.querySelector('.btn-outline[onclick="openAddStudentModal()"]');
  if (addStudentBtn) addStudentBtn.addEventListener('click', openAddStudentModal);

  const addStudentForm = document.getElementById('add-student-form');
  if (addStudentForm) addStudentForm.addEventListener('submit', handleAddStudent);

  await loadGroupsForModal();
});

// Загрузить данные курса
async function loadCourseData() {
  try {
    const data = await API.teacher.getCourses();
    course = data.courses.find(c => String(c.id) === String(courseId));

    if (!course) {
      alert('Курс не найден');
      window.location.href = '/pages/teacher/main_teacher.html';
      return;
    }

      const titleInput = document.getElementById('course-title');
      const descInput = document.getElementById('course-description');
      if (titleInput) titleInput.value = course.title || '';
      if (descInput) descInput.value = course.description || '';

    const imgElement = document.getElementById('course-image');
    if (course.imageUrl && course.imageUrl.trim() !== '') {
      let imageUrl = course.imageUrl.trim();
      if (!imageUrl.startsWith('http')) {
        if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads')) {
          const host = API_URL.replace(/\/api\/?$/, '');
          imageUrl = host + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
        } else {
          imageUrl = imageUrl.startsWith('/') ? imageUrl : ('/' + imageUrl);
        }
      }
        if (imgElement) {
          const placeholder = document.getElementById('course-image-placeholder');
          imgElement.src = imageUrl;
          imgElement.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
          imgElement.onerror = function() {
            console.error('Ошибка загрузки изображения:', course.imageUrl.substring(0, 100));
            this.style.display = 'none';
            const ph = document.getElementById('course-image-placeholder');
            if (ph) ph.style.display = 'flex';
          };
        }
    } else {
      if (imgElement) {
        imgElement.style.display = 'none';
        const ph = document.getElementById('course-image-placeholder');
        if (ph) ph.style.display = 'flex';
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки курса:', error);
    alert('Ошибка загрузки курса: ' + error.message);
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
    formData.append('type', 'text');
    formData.append('title', title);
    formData.append('description', content);

    await API.teacher.uploadMaterial(formData);
    closeAddLectureModal();
    await loadMaterials();
    alert('Теория добавлена успешно!');
  } catch (error) {
    alert('Ошибка добавления теори: ' + error.message);
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

// Загрузить материалы курса (лекции и практики)
async function loadMaterials() {
  try {
    const data = await API.teacher.getMaterials(courseId);
    const list = document.getElementById('lectures-list');
    if (!list) return;

    const materials = (data && data.materials) ? data.materials : [];
    if (!materials || materials.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">Нет лекций</p>';
      return;
    }

    list.innerHTML = materials.map(m => {
      const fileUrl = m.fileUrl || m.file || '';
      let href = '';
      if (fileUrl) {
        if (fileUrl.startsWith('http')) href = fileUrl;
        else {
          const host = API_URL.replace(/\/api\/?$/, '');
          href = host + (fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl);
        }
      }

        return `
        <div class="item-card">
          <div>
            <h4>${m.title || '(без названия)'}${m.id ? ' — ID: ' + m.id : ''}</h4>
            <p style="color:#666; font-size:0.9rem; margin-top:0.25rem;"></p>
          </div>
          <div>
            ${href ? `<a class="btn btn-outline" href="${href}" target="_blank">Открыть</a>` : ''}
            <button class="btn btn-danger" onclick="confirmDeleteMaterial('${m.id}')">Удалить</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Ошибка загрузки материалов:', e);
  }
}

// Загрузить задания курса
async function loadAssignments() {
  try {
    const data = await API.teacher.getAssignments(courseId);
    const list = document.getElementById('assignments-list');
    if (!list) return;

    const assignments = (data && data.assignments) ? data.assignments : [];
    if (!assignments || assignments.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #666;">Нет заданий</p>';
      return;
    }

    list.innerHTML = assignments.map(a => `
      <div class="item-card">
        <div>
          <h4>${a.title || '(без названия)'}${a.id ? ' — ID: ' + a.id : ''}</h4>
          <p style="color:#666; font-size:0.9rem; margin-top:0.25rem;">Дедлайн: ${a.deadline ? new Date(a.deadline).toLocaleString('ru-RU') : 'не указан'}</p>
        </div>
        <div>
          <a class="btn btn-outline" href="#" onclick="viewAssignment(${a.id})">Открыть</a>
          <button class="btn btn-danger" onclick="confirmDeleteAssignment('${a.id}')">Удалить</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Ошибка загрузки заданий:', e);
  }
}

// Загрузить студентов курса
async function loadStudents() {
  try {
    const data = await API.teacher.getCourseStudents(courseId);
    const list = document.getElementById('students-list');
    if (!list) return;

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

// Открыть/закрыть модалки добавления студента
function openAddStudentModal() {
  const modal = document.getElementById('add-student-modal');
  if (modal) modal.style.display = 'flex';
}

function closeAddStudentModal() {
  const modal = document.getElementById('add-student-modal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('add-student-form');
  if (form) form.reset();
}

// Добавить одного студента
async function handleAddStudent(e) {
  e.preventDefault();
  const email = document.getElementById('student-email').value.trim();
  const password = document.getElementById('student-password').value.trim();
  const lastName = document.getElementById('student-lastName').value.trim();
  const firstName = document.getElementById('student-firstName').value.trim();
  const middleName = document.getElementById('student-middleName').value.trim();
  const groupNameEl = document.getElementById('student-groupName');
  const groupName = groupNameEl ? groupNameEl.value.trim() : '';

  if (!email || !password || !lastName || !firstName) {
    alert('Заполните обязательные поля');
    return;
  }

  try {
    const resp = await API.teacher.addStudent(courseId, { email, password, firstName, lastName, middleName, groupName });
    alert('Студент добавлен');
    closeAddStudentModal();
    await loadStudents();
  } catch (err) {
    console.error('Ошибка добавления студента:', err);
    alert('Ошибка добавления студента: ' + (err.message || err));
  }
}

async function loadGroupsForModal() {
  try {
    const data = await fetchAPI('/common/groups');
    const sel = document.getElementById('student-groupName');
    if (!sel) return;
    sel.innerHTML = '<option value="">Выберите группу</option>' + (data.groups && data.groups.length ? data.groups.map(g => `<option value="${g}">${g}</option>`).join('') : '');
  } catch (e) {
    console.error('Ошибка загрузки групп (модал):', e);
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
    const formData = new FormData();
    formData.append('image', file);

    const resp = await API.teacher.uploadCourseImage(courseId, formData);
    const newUrl = resp && resp.imageUrl ? resp.imageUrl : (resp.course && resp.course.imageUrl ? resp.course.imageUrl : null);

    const imgElement = document.getElementById('course-image');
    if (imgElement && newUrl) {
      let imageUrl = newUrl;
      if (!imageUrl.startsWith('http')) {
        if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads')) {
          const host = API_URL.replace(/\/api\/?$/, '');
          imageUrl = host + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
        }
      }
      imgElement.src = imageUrl;
      imgElement.style.display = 'block';
      const ph = document.getElementById('course-image-placeholder');
      if (ph) ph.style.display = 'none';
    }

    alert('Изображение успешно обновлено!');
  } catch (error) {
    alert('Ошибка загрузки изображения: ' + error.message);
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

//  Удаление материала
window.confirmDeleteMaterial = async function(materialId) {
  if (!confirm('Удалить материал? Это действие необратимо.')) return;
  try {
    await API.teacher.deleteMaterial(materialId);
    await loadMaterials();
  } catch (err) {
    console.error('Ошибка удаления материала:', err);
    alert('Ошибка удаления материала: ' + (err.message || err));
  }
}

// Удаление задания
window.confirmDeleteAssignment = async function(assignmentId) {
  if (!confirm('Удалить задание и все связанные материалы/работы?')) return;
  try {
    await API.teacher.deleteAssignment(courseId, assignmentId);
    await loadAssignments();
    await loadMaterials();
  } catch (err) {
    console.error('Ошибка удаления задания:', err);
    alert('Ошибка удаления задания: ' + (err.message || err));
  }
}
