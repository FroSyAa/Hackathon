const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { authenticateToken } = require('../../middleware/auth');

// Вход в систему с выбором роли
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (email === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { email, role: 'superadmin' },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      return res.json({
        user: {
          email,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin'
        },
        token
      });
    }

    const user = await User.findOne({
      where: { email },
      include: [
        { association: 'studentProfile' },
        { association: 'teacherProfile' },
        { association: 'adminProfile' }
      ]
    });

    if (!user) {
      console.warn(`Ошибка, пользователя с таким email нет=${email}`);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.warn(`Ошибка, введён неверный пароль=${user.id} email=${email}`);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    let userRole = null;
    let roleId = null;

    if (role === 'student' && user.studentProfile) {
      userRole = 'student';
      roleId = user.studentProfile.id;
    } else if (role === 'teacher' && user.teacherProfile) {
      userRole = 'teacher';
      roleId = user.teacherProfile.id;
    } else if (role === 'admin' && user.adminProfile) {
      userRole = 'admin';
      roleId = user.adminProfile.id;
    } else {
      console.warn(`Ошибка, роль не соответствует для пользователя id=${user.id} email=${email} запрошеннаяРоль=${role}`);
      return res.status(403).json({ error: 'У вас нет доступа с выбранной ролью' });
    }

    const token = user.generateToken();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: userRole,
        roleId
      },
      token
    });
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
