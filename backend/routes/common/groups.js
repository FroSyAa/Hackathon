const express = require('express');
const router = express.Router();
const { Student } = require('../../models');
const { authenticateToken } = require('../../middleware/auth');

// Получить список уникальных групп студентов
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Student.findAll({
      attributes: ['groupName'],
      where: {},
      raw: true
    });

    const unique = Array.from(new Set(groups.map(g => g.groupName).filter(Boolean)));
    res.json({ groups: unique });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
