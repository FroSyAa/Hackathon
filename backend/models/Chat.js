const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Владелец чата (например, преподаватель или любой пользователь)
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  // Пометка, что собеседник — бот
  isWithBot: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Chat;
