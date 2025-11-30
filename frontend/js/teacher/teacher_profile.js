// ../../js/teacher/teacher_profile.js
document.addEventListener('DOMContentLoaded', loadProfile);

async function loadProfile() {
    try {
        const user = getUser();
        if (user) {
            document.getElementById('fullName').textContent = formatFullName(user);
            document.getElementById('organization').textContent = user.organization || 'Не указана';
            document.getElementById('email').textContent = user.email || 'Не указан';
            document.getElementById('regDate').textContent = new Date(user.createdAt).toLocaleDateString('ru-RU');

            document.getElementById('lastName').value = user.lastName || '';
            document.getElementById('firstName').value = user.firstName || '';
            document.getElementById('editOrganization').value = user.organization || '';
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

function formatFullName(user) {
    return `${user.lastName || ''} ${user.firstName || ''} ${user.middleName || ''}`.trim();
}

// Предпросмотр аватара
document.addEventListener('change', function (e) {
    if (e.target.id === 'avatarInput') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('currentAvatar').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
});

async function uploadAvatar() {
    const fileInput = document.getElementById('avatarInput');
    if (!fileInput.files[0]) {
        alert('Выберите фото');
        return;
    }
    // TODO: API вызов для загрузки
    alert('Фото загружено! (API интеграция)');
}

function resetAvatar() {
    document.getElementById('currentAvatar').src = '../../assets/avatar_teacher.jpg';
}

// Сохранение профиля
document.getElementById('profileForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = {
        lastName: document.getElementById('lastName').value,
        firstName: document.getElementById('firstName').value,
        organization: document.getElementById('editOrganization').value
    };
    // TODO: API вызов
    alert('Профиль обновлен!');
    loadProfile();
});

// Смена пароля
document.getElementById('passwordForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        alert('Пароли не совпадают');
        return;
    }
    if (newPass.length < 6) {
        alert('Пароль должен быть не менее 6 символов');
        return;
    }
    // TODO: API вызов
    alert('Пароль изменен!');
    this.reset();
});

function cancelEdit() {
    loadProfile();
}

function deleteProfile() {
    if (confirm('Удалить профиль? Это действие нельзя отменить!')) {
        // TODO: API вызов
        window.location.href = '../../pages/common/login.html';
    }
}
