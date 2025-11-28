const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Assignment, Submission, Course } = require('../../models');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: './uploads/assignments/',
  filename: (_req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Получить список всех заданий студента
router.get('/', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        {
          model: Submission,
          as: 'submissions',
          where: { studentId: req.user.id },
          required: false
        }
      ],
      order: [['deadline', 'ASC']]
    });

    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Посмотреть конкретное задание
router.get('/:id', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    res.json({ assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Загрузить работу
router.post('/:id/submit', authenticateToken, authorizeRole('student'), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    const existingSubmission = await Submission.findOne({
      where: { assignmentId: id, studentId: req.user.id }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'Работа уже сдана' });
    }

    const submission = await Submission.create({
      assignmentId: id,
      studentId: req.user.id,
      fileUrl: req.file ? req.file.path : null,
      comment,
      status: 'pending'
    });

    res.status(201).json({ submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Посмотреть оценку и комментарии
router.get('/:id/feedback', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findOne({
      where: { assignmentId: id, studentId: req.user.id },
      include: [{ model: Assignment, as: 'assignment', attributes: ['id', 'title', 'maxScore'] }]
    });

    if (!submission) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Загрузить исправленную версию
router.put('/:id/resubmit', authenticateToken, authorizeRole('student'), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const submission = await Submission.findOne({
      where: { assignmentId: id, studentId: req.user.id }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    if (submission.status !== 'returned') {
      return res.status(400).json({ error: 'Работа не отправлена на доработку' });
    }

    await submission.update({
      fileUrl: req.file ? req.file.path : submission.fileUrl,
      comment,
      status: 'pending',
      score: null,
      feedback: null
    });

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
