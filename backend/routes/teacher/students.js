const express = require('express');
const router = express.Router();
const { User, Student, Enrollment, Course } = require('../../models');
const { authenticateToken, authorizeTeacher } = require('../../middleware/auth');


// Получить студентов, записанных на курс
router.get('/course/:courseId', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (String(course.teacherId) !== String(req.teacher.id)) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: { exclude: ['password'] }
            }
          ]
        }
      ]
    });

    const students = enrollments.map(e => ({
      id: e.student.id,
      email: e.student.user.email,
      firstName: e.student.user.firstName,
      lastName: e.student.user.lastName,
      middleName: e.student.user.middleName,
      groupName: e.student.groupName,
      enrolledAt: e.createdAt
    }));

    res.json({ students });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить одного студента и записать на курс (если указан courseId)
router.post('/add', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { email, password, firstName, lastName, middleName, groupName, courseId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }

    // Найдём или создадим пользователя
    let user = await User.findOne({ where: { email } });
    let student = null;

    if (user) {
      student = await Student.findOne({ where: { userId: user.id } });
      if (!student) {
        // Пользователь есть, но не студент
        return res.status(400).json({ error: 'Пользователь с таким email существует, но не является студентом' });
      }
    } else {
      user = await User.create({ email, password, firstName, lastName, middleName: middleName || '' });
      student = await Student.create({ userId: user.id, directionId: req.teacher.directionId, groupName: groupName || '' });
    }

    // Если указан courseId — проверим доступ и запишем
    if (courseId) {
      const course = await Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: 'Курс не найден' });
      if (String(course.teacherId) !== String(req.teacher.id)) return res.status(403).json({ error: 'Это не ваш курс' });

      const existingEnrollment = await Enrollment.findOne({ where: { studentId: student.id, courseId } });
      if (!existingEnrollment) {
        await Enrollment.create({ studentId: student.id, courseId });
      }
    }

    res.json({ message: 'Студент добавлен', student: { id: student.id, email: user.email, firstName: user.firstName, lastName: user.lastName, groupName: student.groupName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Массовая загрузка студентов (JSON) — вернуть обратно для удобства преподавателя
router.post('/bulk-upload', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { students, courseId } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Нет студентов для загрузки' });
    }

    // Проверяем, что курс принадлежит преподавателю
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (String(course.teacherId) !== String(req.teacher.id)) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const results = { created: [], enrolled: [], errors: [] };

    for (const studentData of students) {
      try {
        const { email, password, firstName, lastName, middleName, groupName } = studentData;

        if (!email || !password || !firstName || !lastName) {
          results.errors.push({ email, error: 'Отсутствуют обязательные поля' });
          continue;
        }

        let user = await User.findOne({ where: { email } });
        let student = null;

        if (user) {
          student = await Student.findOne({ where: { userId: user.id } });
          if (!student) {
            results.errors.push({ email, error: 'Пользователь с таким email уже существует, но не является студентом' });
            continue;
          }
        } else {
          user = await User.create({ email, password, firstName, lastName, middleName: middleName || '' });
          student = await Student.create({ userId: user.id, directionId: req.teacher.directionId, groupName: groupName || '' });
          results.created.push({ email, firstName, lastName, studentId: student.id });
        }

        const existingEnrollment = await Enrollment.findOne({ where: { studentId: student.id, courseId } });
        if (!existingEnrollment) {
          await Enrollment.create({ studentId: student.id, courseId });
          results.enrolled.push({ email, studentId: student.id });
        }
      } catch (error) {
        results.errors.push({ email: studentData.email || 'unknown', error: error.message });
      }
    }

    res.json({ message: 'Массовая загрузка завершена', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
