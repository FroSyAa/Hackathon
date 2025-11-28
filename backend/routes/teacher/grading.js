// Маршруты для проверки работ студентов и выставления оценок
// Только для преподавателей

const express = require('express');
const router = express.Router();

// GET /api/teacher/assignments/pending - получить все непроверенные работы
// Список работ, ожидающих проверки

// GET /api/teacher/assignments/:assignmentId/submissions - посмотреть все работы студентов по заданию
// Преподаватель видит работы всей группы

// POST /api/teacher/grade/:submissionId - выставить оценку и комментарий
// Оценка, комментарий, возможность запросить доработку

// GET /api/teacher/progress/:courseId - журнал успеваемости группы
// Таблица с оценками всех студентов по всем заданиям курса

module.exports = router;
