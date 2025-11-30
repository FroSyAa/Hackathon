const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('video', 'text', 'pdf', 'presentation'),
    allowNull: false
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Materials',
      key: 'id'
    }
  },
  assignmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Assignments',
      key: 'id'
    }
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  timestamps: true
});

module.exports = Material;
