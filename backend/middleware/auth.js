const jwt = require('jsonwebtoken');
const { User, Student, Teacher, Admin } = require('../models');

// Проверка JWT токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный токен' });
    }
    req.user = user;
    next();
  });
}

// Проверка супер-админа
function authorizeSuperAdmin(req, res, next) {
  if (req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  next();
}

// Проверка роли студента
async function authorizeStudent(req, res, next) {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    req.student = student;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Проверка роли преподавателя
async function authorizeTeacher(req, res, next) {
  try {
    const teacher = await Teacher.findOne({ where: { userId: req.user.id } });
    if (!teacher) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    req.teacher = teacher;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Проверка роли администратора ВУЗа
async function authorizeAdmin(req, res, next) {
  try {
    const admin = await Admin.findOne({ where: { userId: req.user.id } });
    if (!admin) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    req.admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  authenticateToken,
  authorizeSuperAdmin,
  authorizeStudent,
  authorizeTeacher,
  authorizeAdmin
};