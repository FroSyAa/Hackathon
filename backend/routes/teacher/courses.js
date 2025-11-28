const express = require('express');
const router = express.Router();
const { Course, Assignment } = require('../../models');
const { authenticateToken, authorizeTeacher } = require('../../middleware/auth');

// Создать курс
router.post('/', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { title, description } = req.body;

    const course = await Course.create({
      title,
      description,
      teacherId: req.teacher.id
    });

    res.status(201).json({ course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все курсы преподавателя
router.get('/', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { teacherId: req.teacher.id }
    });

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать задание
router.post('/:courseId/assignments', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, deadline, maxScore, attachments } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const assignment = await Assignment.create({
      courseId,
      title,
      description,
      deadline,
      maxScore,
      attachments
    });

    res.status(201).json({ assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;