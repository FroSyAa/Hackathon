const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'education_platform',
  process.env.DB_USER || 'admin',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Проверка подключения к базе данных
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Соединение с БД есть');
  } catch (error) {
    console.error('Ошибка подключения к БД:', error.message);
  }
}

module.exports = { sequelize, testConnection };
