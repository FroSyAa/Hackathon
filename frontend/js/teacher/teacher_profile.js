document.addEventListener('DOMContentLoaded', initProfilePage);

function initProfilePage() {
  console.debug('teacher_profile: init (clean)');
  setupAvatarControls();
  loadProfile();
  const profileForm = document.getElementById('profileForm');
  if (profileForm) profileForm.addEventListener('submit', onSubmitProfile);
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) passwordForm.addEventListener('submit', onChangePassword);
  const uploadBtn = document.getElementById('uploadAvatarBtn');
  if (uploadBtn) uploadBtn.addEventListener('click', uploadAvatar);
}

function setupAvatarControls() {
  const avatarInput = document.getElementById('avatarInput');
  const uploadBtn = document.getElementById('uploadAvatarBtn');
  const currentAvatar = document.getElementById('currentAvatar');
  if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.classList.remove('btn-primary'); uploadBtn.classList.add('btn-disabled'); }
  if (!avatarInput) { console.debug('teacher_profile: no avatarInput element'); return; }
  avatarInput.addEventListener('change', () => {
    console.debug('teacher_profile: avatarInput change event');
    const file = avatarInput.files && avatarInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { if (currentAvatar) currentAvatar.src = e.target.result; };
      reader.readAsDataURL(file);
      if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.classList.remove('btn-disabled'); uploadBtn.classList.add('btn-primary'); }
    } else {
      if (currentAvatar) currentAvatar.src = '../../assets/avatar_teacher.jpg';
      if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.classList.remove('btn-primary'); uploadBtn.classList.add('btn-disabled'); }
    }
  });
}

async function loadProfile() {
  try {
    const user = getUser(); if (!user) return;
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const setValue = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setText('fullName', formatFullName(user));
    setText('organization', user.organization || 'Не указана');
    setText('email', user.email || 'Не указан');
    if (user.createdAt) setText('regDate', new Date(user.createdAt).toLocaleDateString('ru-RU'));
    setValue('lastName', user.lastName || ''); setValue('firstName', user.firstName || ''); setValue('editOrganization', user.organization || '');
    const abs = getAbsoluteAvatarUrl(user.avatar || '') || '../../assets/avatar_teacher.jpg';
    const currentAvatar = document.getElementById('currentAvatar');
    if (currentAvatar) {
      currentAvatar.src = abs;
      currentAvatar.onerror = async function () {
        console.error('Failed to load avatar image:', abs);
        try {
          const resp = await fetch(abs, { method: 'GET' });
          console.debug('Avatar fetch status:', resp.status);
        } catch (e) { console.error('Avatar fetch error:', e); }
      };
    }
    document.querySelectorAll('.avatar').forEach(i => { if (i) i.src = abs; });
  } catch (err) { console.error('Ошибка загрузки профиля:', err); }
}

function getAbsoluteAvatarUrl(p) {
  if (!p) return '';
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  try {
    const backendOrigin = (typeof API_URL === 'string') ? API_URL.replace(/\/api\/?$/, '') : window.location.origin;
    if (p.startsWith('/uploads') || p.startsWith('uploads')) {
      return backendOrigin + (p.startsWith('/') ? p : '/' + p);
    }
    if (p.startsWith('/')) return backendOrigin + p;
  } catch (e) {
  }
  return p;
}

function formatFullName(user) { return `${user.lastName || ''} ${user.firstName || ''} ${user.middleName || ''}`.trim(); }

async function uploadAvatar() {
  console.debug('teacher_profile: uploadAvatar triggered (clean)');
  const fileInput = document.getElementById('avatarInput'); const uploadBtn = document.getElementById('uploadAvatarBtn');
  if (!fileInput || !fileInput.files[0]) { alert('Выберите фото'); return; }
  try {
    if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = 'Сохраняется...'; }
    const form = new FormData(); form.append('avatar', fileInput.files[0]);
    const res = await API.auth.uploadAvatar(form);
    if (res && res.user) {
      const existing = getUser() || {};
      if (existing.role) res.user.role = existing.role;
      if (existing.roleId) res.user.roleId = existing.roleId;
      saveAuth(getToken(), res.user);
      const abs = getAbsoluteAvatarUrl(res.user.avatar||'')||'../../assets/avatar_teacher.jpg';
      const currentAvatar = document.getElementById('currentAvatar'); if (currentAvatar) currentAvatar.src = abs;
      document.querySelectorAll('.avatar').forEach(i=>{ if(i) i.src = abs; });
      alert('Фото загружено'); fileInput.value='';
      if(uploadBtn){ uploadBtn.disabled=true; uploadBtn.innerHTML='<i class="fas fa-upload"></i> Загрузить'; uploadBtn.classList.remove('btn-primary'); uploadBtn.classList.add('btn-disabled'); }
    } else alert('Фото загружено (без подтверждения от сервера)');
  } catch (err) { console.error(err); alert('Ошибка при загрузке фото: '+(err.message||err)); if(uploadBtn){ uploadBtn.disabled=false; uploadBtn.innerHTML='<i class="fas fa-upload"></i> Загрузить'; uploadBtn.classList.remove('btn-disabled'); uploadBtn.classList.add('btn-primary'); } }
}

async function onSubmitProfile(e) {
  e.preventDefault();
  const data = {
    lastName: document.getElementById('lastName')?.value,
    firstName: document.getElementById('firstName')?.value,
    middleName: document.getElementById('middleName')?.value
  };
  try {
    const res = await API.auth.updateProfile(data);
    if (res && res.user) {
      const existing = getUser() || {};
      if (existing.role) res.user.role = existing.role;
      if (existing.roleId) res.user.roleId = existing.roleId;
      saveAuth(getToken(), res.user);
      alert('Профиль обновлен!');
      loadProfile();
    } else alert('Профиль обновлён');
  } catch (err) { console.error(err); alert('Ошибка обновления профиля: '+err.message); }
}

async function onChangePassword(e) { e.preventDefault(); const current = document.getElementById('currentPassword')?.value; const newPass = document.getElementById('newPassword')?.value; const confirm = document.getElementById('confirmPassword')?.value; if (newPass !== confirm) { alert('Пароли не совпадают'); return; } if (!newPass || newPass.length<6) { alert('Пароль должен быть не менее 6 символов'); return; } try { await API.auth.changePassword(current, newPass); alert('Пароль изменён'); e.target.reset(); } catch (err) { console.error(err); alert('Ошибка изменения пароля: '+err.message); } }

function cancelEdit(){ loadProfile(); }

function deleteProfile(){ if(!confirm('Удалить профиль? Это действие нельзя отменить!')) return; API.auth.deleteProfile().then(()=>{ clearAuth(); alert('Профиль удалён'); window.location.href='../../pages/common/login.html'; }).catch(err=>{ console.error(err); alert('Ошибка при удалении профиля: '+err.message); }); }