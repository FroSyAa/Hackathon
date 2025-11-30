require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Teacher, Direction } = require('../models');

async function createProfile(email, directionName) {
  try {
    await sequelize.authenticate();
    console.log('Подключение к БД успешно');

    if (!email) {
      console.error('Usage: node createTeacherProfile.js <email> [directionName]');
      process.exit(1);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`Пользователь с email ${email} не найден`);
      process.exit(1);
    }

    const exists = await Teacher.findOne({ where: { userId: user.id } });
    if (exists) {
      console.log(`Teacher profile уже существует для пользователя ${email} (id=${exists.id})`);
      process.exit(0);
    }

    // Найдём направление
    let direction = null;
    if (directionName) {
      direction = await Direction.findOne({ where: { name: directionName } });
    }
    if (!direction) {
      // если не найдено, берём первое доступное
      direction = await Direction.findOne();
    }
    if (!direction) {
      console.error('Directions пусты — создайте направление перед добавлением преподавателя');
      process.exit(1);
    }

    const teacher = await Teacher.create({ userId: user.id, directionId: direction.id });
    console.log(`Создан teacherProfile id=${teacher.id} для пользователя ${email}, direction=${direction.name}`);
    process.exit(0);
  } catch (err) {
    console.error('Ошибка:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
createProfile(args[0], args[1]);
