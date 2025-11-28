// Маршруты для аутентификации и авторизации
// Для всех пользователей системы

const express = require('express');
const router = express.Router();

// POST /api/auth/register - регистрация нового пользователя
// Email, пароль, роль (студент/преподаватель)

// POST /api/auth/login - вход в систему
// Проверка учетных данных, выдача JWT токена

// POST /api/auth/logout - выход из системы
// Инвалидация токена

// GET /api/auth/me - получить информацию о текущем пользователе
// Профиль, роль, права доступа

// PUT /api/auth/profile - обновить профиль
// Имя, фото, контактные данные

module.exports = router;
