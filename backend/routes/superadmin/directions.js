const express = require('express');
const router = express.Router();
const { Direction, User, Admin } = require('../../models');
const { authenticateToken, authorizeSuperAdmin } = require('../../middleware/auth');

// Создать направление
router.post('/', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    const direction = await Direction.create({ name });

    res.status(201).json({ direction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все направления
router.get('/', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const directions = await Direction.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ directions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить направление
router.delete('/:directionId', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const { directionId } = req.params;

    const direction = await Direction.findByPk(directionId);
    if (!direction) {
      return res.status(404).json({ error: 'Направление не найдено' });
    }

    await direction.destroy();

    res.json({ message: 'Направление удалено успешно' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить админов направления
router.get('/:directionId/admins', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const { directionId } = req.params;

    const admins = await Admin.findAll({
      where: { directionId },
      include: [{ association: 'user', attributes: { exclude: ['password'] } }]
    });

    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать админа для направления
router.post('/:directionId/admins', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const { directionId } = req.params;
    const { email, password, firstName, lastName, middleName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email уже используется' });
    }

    const user = await User.create({
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      middleName: middleName || ''
    });

    const admin = await Admin.create({
      userId: user.id,
      directionId
    });

    const token = user.generateToken();

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'admin',
        adminId: admin.id
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
