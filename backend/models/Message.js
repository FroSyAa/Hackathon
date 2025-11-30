const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  senderType: {
    type: DataTypes.ENUM('user', 'bot'),
    defaultValue: 'user'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Message;
