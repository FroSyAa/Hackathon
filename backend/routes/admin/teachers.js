const express = require('express');
const router = express.Router();
const { User, Teacher } = require('../../models');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

// Создать преподавателя
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

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

    const teacher = await Teacher.create({
      userId: user.id,
      organizationId: req.admin.organizationId
    });

    const token = user.generateToken();

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'teacher',
        teacherId: teacher.id
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить всех преподавателей организации
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      where: { organizationId: req.admin.organizationId },
      include: [{ association: 'user', attributes: { exclude: ['password'] } }]
    });

    res.json({ teachers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;