const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
require('./models');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/common/auth'));
app.use('/api/superadmin/directions', require('./routes/superadmin/directions'));
app.use('/api/admin/teachers', require('./routes/admin/teachers'));
app.use('/api/admin/students', require('./routes/admin/students'));
app.use('/api/teacher/courses', require('./routes/teacher/courses'));
app.use('/api/teacher/materials', require('./routes/teacher/materials'));
app.use('/api/teacher/students', require('./routes/teacher/students'));
app.use('/api/teacher', require('./routes/teacher/grading'));
app.use('/api/chats', require('./routes/common/chats'));
app.use('/api/common/groups', require('./routes/common/groups'));
app.use('/api/common/notifications', require('./routes/common/notifications'));
app.use('/api/student/courses', require('./routes/student/courses'));
app.use('/api/student/assignments', require('./routes/student/assignments'));

app.get('/', (req, res) => {
  res.json({ message: 'API работает' });
});

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