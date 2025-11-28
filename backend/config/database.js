// Конфигурация подключения к базе данных PostgreSQL

// Здесь будет настройка Sequelize ORM для работы с PostgreSQL
// Параметры подключения берутся из переменных окружения (.env файла)

// Пример конфигурации:
// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: 'postgres',
//     logging: false
//   }
// );

// Функция проверки соединения
// async function testConnection() {
//   try {
//     await sequelize.authenticate();
//     console.log('Соединение с БД установлено успешно');
//   } catch (error) {
//     console.error('Ошибка подключения к БД:', error);
//   }
// }

module.exports = {
  // sequelize,
  // testConnection
};
