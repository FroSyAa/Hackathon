const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Material, Course } = require('../../models');
const { authenticateToken, authorizeTeacher } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: './uploads/materials/',
  filename: (_req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Загрузка нового учебного материала
router.post('/', authenticateToken, authorizeTeacher, upload.single('file'), async (req, res) => {
  try {
    const { courseId, title, description, type } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const material = await Material.create({
      courseId,
      title,
      description,
      type,
      fileUrl: req.file ? req.file.path : null,
      version: 1
    });

    res.status(201).json({ material });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все материалы курса
router.get('/:courseId', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const materials = await Material.findAll({
      where: { courseId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ materials });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Редактировать материал
router.put('/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const material = await Material.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!material) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    if (material.course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш материал' });
    }

    await material.update({ title, description, version: material.version + 1 });

    res.json({ material });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить материал
router.delete('/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!material) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    if (material.course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш материал' });
    }

    await material.destroy();

    res.json({ message: 'Материал удален' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;