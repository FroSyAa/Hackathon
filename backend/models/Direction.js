const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Direction = sequelize.define('Direction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Название направления (например: Backend, Frontend, DevOps)'
  }
}, {
  timestamps: true,
  tableName: 'Directions'
});

module.exports = Direction;
