const express = require('express');
const router = express.Router();
const { Course, Material, Assignment, Submission, User } = require('../../models');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Получить список всех курсов студента
router.get('/', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить материалы курса
router.get('/:courseId/materials', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const materials = await Material.findAll({
      where: { courseId },
      order: [['createdAt', 'ASC']]
    });

    res.json({ materials });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Статистика по курсу
router.get('/:courseId/stats', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const materialsCount = await Material.count({ where: { courseId } });

    const assignments = await Assignment.findAll({
      where: { courseId },
      include: [
        {
          model: Submission,
          as: 'submissions',
          where: { studentId: req.user.id },
          required: false
        }
      ]
    });

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.submissions.length > 0).length;
    const averageScore = assignments
      .filter(a => a.submissions.length > 0 && a.submissions[0].score !== null)
      .reduce((sum, a, _, arr) => sum + a.submissions[0].score / arr.length, 0);

    res.json({
      materialsCount,
      totalAssignments,
      completedAssignments,
      averageScore: averageScore || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
