const express = require('express');
const router = express.Router();
const { Course, Assignment, Submission, Student } = require('../../models');
const { authenticateToken, authorizeTeacher } = require('../../middleware/auth');
const { Sequelize } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'courses');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// Создать курс 
router.post('/', authenticateToken, authorizeTeacher, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/courses/${req.file.filename}`;
    }

    const course = await Course.create({
      title,
      description,
      imageUrl,
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

// Получить все задания курса (для преподавателя)
router.get('/:courseId/assignments', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const assignments = await Assignment.findAll({ where: { courseId }, order: [['deadline', 'ASC']] });

    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить статистику преподавателя
router.get('/statistics', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const teacherId = req.teacher.id;

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

    const assignments = await Assignment.findAll({
      where: { courseId: courseIds }
    });
    const assignmentIds = assignments.map(a => a.id);

    const uniqueStudents = await Submission.findAll({
      where: { assignmentId: assignmentIds },
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('studentId')), 'studentId']],
      raw: true
    });
    const totalStudents = uniqueStudents.length;

    const pendingSubmissions = await Submission.count({
      where: {
        assignmentId: assignmentIds,
        status: 'pending'
      }
    });

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

    const courseStats = await Promise.all(courses.map(async (course) => {
      const courseAssignments = await Assignment.findAll({
        where: { courseId: course.id }
      });
      const courseAssignmentIds = courseAssignments.map(a => a.id);

      const courseStudents = await Submission.findAll({
        where: { assignmentId: courseAssignmentIds },
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('studentId')), 'studentId']],
        raw: true
      });

      const totalAssignments = courseAssignments.length;

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

// Обновить изображение курса
router.patch('/:courseId/image', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { imageUrl } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    await course.update({ imageUrl });

    res.json({ course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить поля курса (title, description)
router.patch('/:courseId', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: 'Курс не найден' });
    if (course.teacherId !== req.teacher.id) return res.status(403).json({ error: 'Это не ваш курс' });

    await course.update({ title: title || course.title, description: description || course.description });

    res.json({ course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Загрузить изображение курса (multipart) и сохранить файл
router.post('/:courseId/image/upload', authenticateToken, authorizeTeacher, upload.single('image'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не передан' });
    }

    try {
      if (course.imageUrl && (course.imageUrl.startsWith('/uploads/courses') || course.imageUrl.startsWith('uploads/courses'))) {
        const existingPath = path.join(__dirname, '..', '..', course.imageUrl.replace(/^\//, ''));
        if (fs.existsSync(existingPath)) {
          fs.unlinkSync(existingPath);
        }
      }
    } catch (e) {
    }

    const imageUrl = `/uploads/courses/${req.file.filename}`;
    await course.update({ imageUrl });

    res.json({ course, imageUrl });
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

router.delete('/:courseId/assignments/:assignmentId', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: 'Курс не найден' });
    if (course.teacherId !== req.teacher.id) return res.status(403).json({ error: 'Это не ваш курс' });

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Задание не найдено' });
    if (String(assignment.courseId) !== String(courseId)) return res.status(400).json({ error: 'Задание не принадлежит этому курсу' });
    
    await require('../../models').Material.destroy({ where: { assignmentId } });
    await require('../../models').Submission.destroy({ where: { assignmentId } });
    await assignment.destroy();

    res.json({ message: 'Задание и связанные данные удалены' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;