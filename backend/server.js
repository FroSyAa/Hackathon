// Главный файл сервера
// Здесь будет запуск Express приложения, подключение к базе данных и настройка middleware(Но это только в теории, ахвхахва)

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Подключение маршрутов для преподавателей
// app.use('/api/teacher', require('./routes/teacher/materials'));
// app.use('/api/teacher', require('./routes/teacher/grading'));

// Подключение маршрутов для студентов
// app.use('/api/student', require('./routes/student/courses'));
// app.use('/api/student', require('./routes/student/assignments'));

// Подключение общих маршрутов
// app.use('/api/common', require('./routes/common/chat'));
// app.use('/api/common', require('./routes/common/auth'));

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
