// Middleware для проверки аутентификации
// Проверка JWT токена, защита маршрутов

// authenticateToken - проверить, что пользователь вошел в систему
// Извлечение токена из заголовка, проверка подписи

// authorizeRole - проверить роль пользователя
// Разрешить доступ только студентам или только преподавателям

// Пример использования:
// router.get('/teacher/materials', authenticateToken, authorizeRole('teacher'), ...)

module.exports = {
  // authenticateToken,
  // authorizeRole
};
