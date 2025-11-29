const express = require('express');
const router = express.Router();
const { Course, Assignment, Submission, Student } = require('../../models');
const { authenticateToken, authorizeTeacher } = require('../../middleware/auth');
const { Sequelize } = require('sequelize');

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

// Получить статистику преподавателя
router.get('/statistics', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const teacherId = req.teacher.id;

    // Получить все курсы преподавателя
    const courses = await Course.findAll({
      where: { teacherId },
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [
            {
              model: Submission,
              as: 'submissions'
            }
          ]
        }
      ]
    });

    const courseIds = courses.map(c => c.id);
    const totalCourses = courses.length;

    // Получить все задания
    const assignments = await Assignment.findAll({
      where: { courseId: courseIds }
    });
    const assignmentIds = assignments.map(a => a.id);

    // Получить количество студентов (уникальных)
    const uniqueStudents = await Submission.findAll({
      where: { assignmentId: assignmentIds },
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('studentId')), 'studentId']],
      raw: true
    });
    const totalStudents = uniqueStudents.length;

    // Получить количество работ на проверке
    const pendingSubmissions = await Submission.count({
      where: {
        assignmentId: assignmentIds,
        status: 'pending'
      }
    });

    // Рассчитать успеваемость (процент проверенных работ с оценкой >= 60% от максимума)
    const gradedSubmissions = await Submission.findAll({
      where: {
        assignmentId: assignmentIds,
        status: 'graded'
      },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['maxScore']
        }
      ]
    });

    let successCount = 0;
    gradedSubmissions.forEach(submission => {
      const percentage = (submission.score / submission.assignment.maxScore) * 100;
      if (percentage >= 60) {
        successCount++;
      }
    });

    const successRate = gradedSubmissions.length > 0
      ? Math.round((successCount / gradedSubmissions.length) * 100)
      : 0;

    // Получить статистику по каждому курсу
    const courseStats = await Promise.all(courses.map(async (course) => {
      const courseAssignments = await Assignment.findAll({
        where: { courseId: course.id }
      });
      const courseAssignmentIds = courseAssignments.map(a => a.id);

      // Уникальные студенты на курсе
      const courseStudents = await Submission.findAll({
        where: { assignmentId: courseAssignmentIds },
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('studentId')), 'studentId']],
        raw: true
      });

      // Количество заданий на курсе
      const totalAssignments = courseAssignments.length;

      // Рассчитать прогресс курса (процент выполненных заданий)
      const completedAssignments = await Submission.count({
        where: {
          assignmentId: courseAssignmentIds,
          status: 'graded'
        },
        distinct: true,
        col: 'assignmentId'
      });

      const progress = totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

      return {
        id: course.id,
        studentCount: courseStudents.length,
        assignmentCount: totalAssignments,
        progress
      };
    }));

    res.json({
      totalStudents,
      pendingSubmissions,
      totalCourses,
      successRate,
      courseStats
    });
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