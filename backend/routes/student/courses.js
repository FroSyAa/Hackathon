// Маршруты для работы студента с курсами
// Просмотр материалов, отслеживание прогресса

const express = require('express');
const router = express.Router();

// GET /api/student/courses - получить список всех курсов студента
// Курсы, на которые записан студент

// GET /api/student/courses/:courseId/materials - получить материалы курса
// Видео, тексты, презентации в структурированном виде

// POST /api/student/courses/:courseId/progress - отметить материал как изученный
// Шкала прогресса студента по материалам курса

// GET /api/student/courses/:courseId/stats - статистика по курсу
// Сколько пройдено, оценки, прогресс

module.exports = router;
