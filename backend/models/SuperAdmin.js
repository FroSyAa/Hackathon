const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SuperAdmin = sequelize.define('SuperAdmin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isMainAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Главный супер-админ из .env файла'
  }
}, {
  timestamps: true,
  tableName: 'SuperAdmins'
});

module.exports = SuperAdmin;
