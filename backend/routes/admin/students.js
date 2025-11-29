const express = require('express');
const router = express.Router();
const { User, Student } = require('../../models');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

// Создать студента
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, middleName, groupName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email уже используется' });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      middleName
    });

    const student = await Student.create({
      userId: user.id,
      organizationId: req.admin.organizationId,
      groupName
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

// Получить всех студентов организации
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { organizationId: req.admin.organizationId },
      include: [{ association: 'user', attributes: { exclude: ['password'] } }]
    });

    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
