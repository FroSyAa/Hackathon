const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
require('./models');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/common/auth'));
app.use('/api/teacher/courses', require('./routes/teacher/courses'));
app.use('/api/teacher/materials', require('./routes/teacher/materials'));
app.use('/api/teacher', require('./routes/teacher/grading'));
app.use('/api/student/courses', require('./routes/student/courses'));
app.use('/api/student/assignments', require('./routes/student/assignments'));

app.get('/', (req, res) => {
  res.json({ message: 'API работает' });
});

// Синхронизация БД и запуск сервера
async function start() {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('База данных синхронизирована');

    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Ошибка запуска:', error.message);
    process.exit(1);
  }
}

start();
