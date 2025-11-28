const express = require('express');
const router = express.Router();
const { Submission, Assignment, User, Course } = require('../../models');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Получить все непроверенные работы
router.get('/assignments/pending', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const courses = await Course.findAll({ where: { teacherId: req.user.id } });
    const courseIds = courses.map(c => c.id);

    const assignments = await Assignment.findAll({ where: { courseId: courseIds } });
    const assignmentIds = assignments.map(a => a.id);

    const submissions = await Submission.findAll({
      where: { assignmentId: assignmentIds, status: 'pending' },
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Assignment, as: 'assignment', attributes: ['id', 'title', 'courseId'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все работы студентов по заданию
router.get('/assignments/:assignmentId/submissions', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    if (assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Это не ваше задание' });
    }

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Выставить оценку и комментарий
router.post('/grade/:submissionId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback, status } = req.body;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [{ model: Course, as: 'course' }]
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    if (submission.assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Это не ваша работа для проверки' });
    }

    if (score > submission.assignment.maxScore) {
      return res.status(400).json({ error: 'Оценка превышает максимальный балл' });
    }

    await submission.update({ score, feedback, status: status || 'graded' });

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Журнал успеваемости группы
router.get('/progress/:courseId', authenticateToken, authorizeRole('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const assignments = await Assignment.findAll({
      where: { courseId },
      include: [
        {
          model: Submission,
          as: 'submissions',
          include: [{ model: User, as: 'student', attributes: ['id', 'firstName', 'lastName'] }]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
