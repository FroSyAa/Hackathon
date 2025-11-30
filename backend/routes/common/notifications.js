const express = require('express');
const router = express.Router();
const { Notification } = require('../../models');
const { authenticateToken } = require('../../middleware/auth');

// Получить последние N уведомлений для пользователя (по умолчанию 3)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit
    });
    res.json({ notifications });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Создать уведомление (используется сервером)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, body, userId } = req.body;
    // Только админы/сервисы должны вызывать это; здесь разрешаем авторизованным
    const not = await Notification.create({ userId: userId || req.user.id, title, body });
    res.status(201).json({ notification: not });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
