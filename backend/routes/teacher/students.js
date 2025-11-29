const express = require('express');
const router = express.Router();
const { User, Student, Enrollment, Course } = require('../../models');
const { authenticateToken, authorizeTeacher } = require('../../middleware/auth');

// Массовая загрузка студентов (JSON)
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

    if (course.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Это не ваш курс' });
    }

    const results = {
      created: [],
      enrolled: [],
      errors: []
    };

    for (const studentData of students) {
      try {
        const { email, password, firstName, lastName, middleName, groupName } = studentData;

        // Проверяем обязательные поля
        if (!email || !password || !firstName || !lastName) {
          results.errors.push({
            email,
            error: 'Отсутствуют обязательные поля'
          });
          continue;
        }

        // Проверяем, существует ли пользователь
        let user = await User.findOne({ where: { email } });
        let student = null;

        if (user) {
          // Пользователь существует, проверяем, есть ли студент
          student = await Student.findOne({ where: { userId: user.id } });

          if (!student) {
            // Пользователь есть, но не студент
            results.errors.push({
              email,
              error: 'Пользователь с таким email уже существует, но не является студентом'
            });
            continue;
          }
        } else {
          // Создаем нового пользователя
          user = await User.create({
            email,
            password,
            firstName,
            lastName,
            middleName: middleName || ''
          });

          // Создаем студента
          student = await Student.create({
            userId: user.id,
            directionId: req.teacher.directionId,
            groupName: groupName || ''
          });

          results.created.push({
            email,
            firstName,
            lastName,
            studentId: student.id
          });
        }

        // Записываем студента на курс (если еще не записан)
        const existingEnrollment = await Enrollment.findOne({
          where: { studentId: student.id, courseId }
        });

        if (!existingEnrollment) {
          await Enrollment.create({
            studentId: student.id,
            courseId
          });

          results.enrolled.push({
            email,
            studentId: student.id
          });
        }

      } catch (error) {
        results.errors.push({
          email: studentData.email || 'unknown',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Массовая загрузка завершена',
      results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить студентов, записанных на курс
router.get('/course/:courseId', authenticateToken, authorizeTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    if (course.teacherId !== req.teacher.id) {
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

module.exports = router;
