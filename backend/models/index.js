const User = require('./User');
const Organization = require('./Organization');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Admin = require('./Admin');
const Course = require('./Course');
const Material = require('./Material');
const Assignment = require('./Assignment');
const Submission = require('./Submission');

// User связи
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Admin, { foreignKey: 'userId', as: 'adminProfile' });
Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Organization связи
Organization.hasMany(Student, { foreignKey: 'organizationId', as: 'students' });
Student.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Organization.hasMany(Teacher, { foreignKey: 'organizationId', as: 'teachers' });
Teacher.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Organization.hasMany(Admin, { foreignKey: 'organizationId', as: 'admins' });
Admin.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// Course связи
Teacher.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });
Course.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

Course.hasMany(Material, { foreignKey: 'courseId', as: 'materials' });
Material.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Course.hasMany(Assignment, { foreignKey: 'courseId', as: 'assignments' });
Assignment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Submission связи
Assignment.hasMany(Submission, { foreignKey: 'assignmentId', as: 'submissions' });
Submission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

Student.hasMany(Submission, { foreignKey: 'studentId', as: 'submissions' });
Submission.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

module.exports = {
  User,
  Organization,
  Student,
  Teacher,
  Admin,
  Course,
  Material,
  Assignment,
  Submission
};