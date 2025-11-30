const express = require('express');
const router = express.Router();
const { User, Student, Teacher, Admin, SuperAdmin } = require('../../models');
const { authenticateToken } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const { sequelize } = require('../../config/database');

// Вход в систему с выбором роли
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (email === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
      const jwt = require('jsonwebtoken');

      const existingUser = await User.findOne({ where: { email } });

      if (!existingUser) {
        return res.status(401).json({ error: 'Супер-админ не найден в БД. Запустите npm run create-superadmin' });
      }

      const token = jwt.sign(
        { id: existingUser.id, email, role: 'superadmin' },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      return res.json({
        user: {
          id: existingUser.id,
          email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
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

// Изменить пароль текущего пользователя
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Требуются оба пароля' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ error: 'Текущий пароль неверен' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить профиль текущего пользователя
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, middleName } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (middleName !== undefined) user.middleName = middleName;

    await user.save();

    res.json({ user: { ...user.toJSON() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Загрузка аватара текущего пользователя
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'avatars'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}${ext}`);
  }
});
const avatarUpload = multer({ storage: avatarStorage });

router.post('/me/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const avatarPath = `/uploads/avatars/${req.file.filename}`.replace(/\\/g, '/');
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    user.avatar = avatarPath;
    await user.save();
    res.json({ user: { ...user.toJSON() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить текущего пользователя
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    await sequelize.transaction(async (t) => {
      // удаляем профиль преподавателя/студента/админа если есть
      await Student.destroy({ where: { userId: req.user.id }, transaction: t });
      await Teacher.destroy({ where: { userId: req.user.id }, transaction: t });
      await Admin.destroy({ where: { userId: req.user.id }, transaction: t });
      await SuperAdmin.destroy({ where: { userId: req.user.id }, transaction: t });

      // затем удаляем пользователя
      await User.destroy({ where: { id: req.user.id }, transaction: t });
    });

    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
