const express = require('express');
const router = express.Router();
const { Organization, User, Admin } = require('../../models');
const { authenticateToken, authorizeSuperAdmin } = require('../../middleware/auth');

// Создать организацию
router.post('/', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const { name, city } = req.body;

    const organization = await Organization.create({
      name,
      city
    });

    res.status(201).json({ organization });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все организации
router.get('/', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const organizations = await Organization.findAll();
    res.json({ organizations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить админов организации
router.get('/:orgId/admins', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const { orgId } = req.params;

    const admins = await Admin.findAll({
      where: { organizationId: orgId },
      include: [{ association: 'user', attributes: { exclude: ['password'] } }]
    });

    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать админа для организации
router.post('/:orgId/admins', authenticateToken, authorizeSuperAdmin, async (req, res) => {
  try {
    const { orgId } = req.params;
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
      organizationId: orgId
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