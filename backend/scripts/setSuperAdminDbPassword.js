require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');

async function setPassword() {
  try {
    await sequelize.authenticate();
    console.log('Подключение к БД успешно');

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('SUPER_ADMIN_EMAIL или SUPER_ADMIN_PASSWORD не указаны в .env');
      process.exit(1);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`Пользователь с email ${email} не найден в БД`);
      process.exit(1);
    }

    user.password = password; // модель хэширует пароль в hook'е beforeUpdate
    await user.save();

    console.log(`Пароль пользователя ${email} успешно обновлён в БД.`);
    process.exit(0);
  } catch (err) {
    console.error('Ошибка:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

setPassword();
