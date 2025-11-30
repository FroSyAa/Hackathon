const express = require('express');
const router = express.Router();
const { Chat, Message, User } = require('../../models');
const { authenticateToken } = require('../../middleware/auth');

// Создать чат (для авторизованного пользователя). По умолчанию с ботом.
router.post('/', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { title } = req.body;

    const chat = await Chat.create({ ownerId, title: title || null, isWithBot: true });
    res.status(201).json({ chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить список чатов текущего пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const chats = await Chat.findAll({ where: { ownerId }, order: [['updatedAt', 'DESC']] });
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить сообщения чата
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findByPk(chatId, { include: [{ model: Message, as: 'messages' }] });
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });
    if (String(chat.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    res.json({ messages: chat.messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Отправить сообщение в чат (пользователь)
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const chat = await Chat.findByPk(chatId);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });
    if (String(chat.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const msg = await Message.create({ chatId, senderId: req.user.id, senderType: 'user', content });

    const botReply = await Message.create({ chatId, senderId: null, senderType: 'bot', content: 'Ответ бота (пока-заглушка)' });

    res.status(201).json({ message: msg, botReply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
