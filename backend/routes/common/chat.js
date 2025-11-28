// Маршруты для чата и коммуникации
// Чат между студентами и преподавателями

const express = require('express');
const router = express.Router();

// GET /api/chat/rooms - получить список чатов пользователя
// Личные чаты, групповые чаты по курсам

// GET /api/chat/rooms/:roomId/messages - получить сообщения чата
// История переписки с пагинацией

// POST /api/chat/rooms/:roomId/messages - отправить сообщение
// Текст, файлы, упоминания пользователей

// POST /api/chat/rooms/create - создать новый чат
// Для преподавателей - создание групповых чатов

// PUT /api/chat/messages/:id/read - отметить сообщение как прочитанное
// Уведомления о непрочитанных сообщениях

module.exports = router;
