const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Material, Course, Assignment } = require('../../models');
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

const recentUploads = new Map();

// Загрузка нового учебного материала или добавление файлов к существующему материалу (parentId)
router.post('/', authenticateToken, authorizeTeacher, upload.any(), async (req, res) => {
  try {
    const { courseId, title, description, type, parentId, assignmentId } = req.body;

    console.debug('[materials] upload request:', {
      courseId,
      parentId,
      assignmentId,
      filesCount: req.files ? req.files.length : 0,
      type
    });

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    if (parentId) {
      const parentMaterial = await Material.findByPk(parentId);
      if (!parentMaterial) {
        return res.status(400).json({ error: 'Родительский материал не найден' });
      }
      if (String(parentMaterial.courseId) !== String(courseId)) {
        return res.status(400).json({ error: 'Родительский материал принадлежит другому курсу' });
      }
    }

    if (assignmentId) {
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        return res.status(400).json({ error: 'Задание (assignment) не найдено' });
      }
      if (String(assignment.courseId) !== String(courseId)) {
        return res.status(400).json({ error: 'Задание принадлежит другому курсу' });
      }
    }

    try {
      const filePart = (req.files || []).map(f => `${f.originalname}:${f.size}`).join('|');
      const fp = `${req.teacher && req.teacher.id ? req.teacher.id : 'anon'}|${courseId}|${parentId||''}|${assignmentId||''}|${filePart}`;
      if (recentUploads.has(fp)) {
        console.warn('[materials] duplicate upload suppressed by server cache', fp);
        return res.status(200).json({ duplicate: true });
      }
      recentUploads.set(fp, Date.now());
      setTimeout(() => recentUploads.delete(fp), 5000);
    } catch (e) {
      console.warn('Failed to compute upload fingerprint', e);
    }

    if (req.files && req.files.length > 0 && parentId) {
      const created = [];
      for (const file of req.files) {
        const mat = await Material.create({
          courseId,
          title: file.originalname || title || 'Файл',
          description: description || null,
          type: type || 'pdf',
          fileUrl: file.path,
          parentId: parentId,
          version: 1
        });
        created.push(mat);
      }
      return res.status(201).json({ materials: created });
    }

    if (req.files && req.files.length > 0 && assignmentId) {
      const created = [];
      for (const file of req.files) {
        const mat = await Material.create({
          courseId,
          title: file.originalname || title || 'Файл',
          description: description || null,
          type: type || 'pdf',
          fileUrl: file.path,
          assignmentId: assignmentId,
          version: 1
        });
        created.push(mat);
      }
      return res.status(201).json({ materials: created });
    }

    if (req.files && req.files.length > 0) {
      const created = [];
      for (const file of req.files) {
        const mat = await Material.create({
          courseId,
          title: file.originalname || title || 'Файл',
          description: description || null,
          type: type || 'pdf',
          fileUrl: file.path,
          version: 1
        });
        created.push(mat);
      }
      return res.status(201).json({ materials: created });
    }

    // If no files were uploaded, only create a text material when explicitly requested
    if ((!req.files || req.files.length === 0)) {
      if (type === 'text') {
        const materialData = {
          courseId,
          title: title || 'Без названия',
          description: description || null,
          type: 'text',
          fileUrl: null,
          parentId: parentId || null,
          assignmentId: assignmentId || null,
          version: 1
        };
        const material = await Material.create(materialData);
        return res.status(201).json({ material });
      }
      return res.status(400).json({ error: 'Нет файлов для загрузки и не указано создание текстового материала' });
    }
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