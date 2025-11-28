// Маршруты для работы с домашними заданиями\Практиками\Лабами\Курсачами и т.д.
// Загрузка работ, просмотр оценок

const express = require('express');
const router = express.Router();

// GET /api/student/assignments - получить список всех заданий
// Активные задания, дедлайны, статусы

// GET /api/student/assignments/:id - посмотреть конкретное задание
// Описание, требования, файлы для скачивания

// POST /api/student/assignments/:id/submit - загрузить работу
// Файл работы, комментарий студента

// GET /api/student/assignments/:id/feedback - посмотреть оценку и комментарии
// После проверки преподавателем студент видит оценку

// PUT /api/student/assignments/:id/resubmit - загрузить исправленную версию
// Если преподаватель запросил доработку

module.exports = router;
