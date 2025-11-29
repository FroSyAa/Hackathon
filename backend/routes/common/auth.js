const express = require('express');
const router = express.Router();
const { User, Student, Teacher, Admin } = require('../../models');
const { authenticateToken } = require('../../middleware/auth');

// Регистрация студента
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email уже используется' });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    const student = await Student.create({
      userId: user.id,
      organizationId: organizationId || null
    });

    const token = user.generateToken();

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'student',
        studentId: student.id
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        { association: 'studentProfile' },
        { association: 'teacherProfile' },
        { association: 'adminProfile' }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    let role = null;
    let roleId = null;

    if (user.email === process.env.SUPER_ADMIN_EMAIL) {
      role = 'superadmin';
    } else if (user.studentProfile) {
      role = 'student';
      roleId = user.studentProfile.id;
    } else if (user.teacherProfile) {
      role = 'teacher';
      roleId = user.teacherProfile.id;
    } else if (user.adminProfile) {
      role = 'admin';
      roleId = user.adminProfile.id;
    }

    if (!role) {
      return res.status(403).json({ error: 'Роль пользователя не определена' });
    }

    const token = user.generateToken();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
        roleId
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Вход только для суперадмина
router.post('/superadmin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.SUPER_ADMIN_EMAIL &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      // Генерируем токен вручную
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          email,
          role: 'superadmin',
          firstName: 'Super',
          lastName: 'Admin'
        },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      return res.json({
        user: {
          email,
          role: 'superadmin',
          firstName: 'Super',
          lastName: 'Admin'
        },
        token
      });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить профиль текущего пользователя
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { association: 'studentProfile' },
        { association: 'teacherProfile' },
        { association: 'adminProfile' }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    let role = null;
    if (user.email === process.env.SUPER_ADMIN_EMAIL) {
      role = 'superadmin';
    } else if (user.studentProfile) {
      role = 'student';
    } else if (user.teacherProfile) {
      role = 'teacher';
    } else if (user.adminProfile) {
      role = 'admin';
    }

    res.json({ user: { ...user.toJSON(), role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;