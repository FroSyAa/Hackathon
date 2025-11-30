const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  directionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Directions',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Teacher;