require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, SuperAdmin } = require('../models');

async function createSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к БД успешно');

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('❌ SUPER_ADMIN_EMAIL или SUPER_ADMIN_PASSWORD не указаны в .env');
      process.exit(1);
    }

    // Проверяем, существует ли уже пользователь
    let user = await User.findOne({ where: { email } });

    if (user) {
      console.log(`ℹ️  Пользователь с email ${email} уже существует (ID: ${user.id})`);
    } else {
      // Создаём пользователя
      user = await User.create({
        email,
        password,
        firstName: 'Super',
        lastName: 'Admin',
        middleName: ''
      });
      console.log(`✅ Создан пользователь Super Admin (ID: ${user.id})`);
    }

    // Проверяем, есть ли уже запись в SuperAdmin
    let superAdmin = await SuperAdmin.findOne({ where: { userId: user.id } });

    if (superAdmin) {
      console.log(`ℹ️  Запись SuperAdmin уже существует для пользователя ${email}`);
    } else {
      // Создаём запись SuperAdmin
      superAdmin = await SuperAdmin.create({
        userId: user.id,
        isMainAdmin: true
      });
      console.log(`✅ Создана запись SuperAdmin (ID: ${superAdmin.id})`);
    }

    console.log('\n✅ Супер-админ успешно создан/обновлён!');
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   SuperAdmin ID: ${superAdmin.id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
