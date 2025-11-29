const User = require('./User');
const Direction = require('./Direction');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Admin = require('./Admin');
const SuperAdmin = require('./SuperAdmin');
const Course = require('./Course');
const Material = require('./Material');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Enrollment = require('./Enrollment');

// User связи
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Admin, { foreignKey: 'userId', as: 'adminProfile' });
Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(SuperAdmin, { foreignKey: 'userId', as: 'superAdminProfile' });
SuperAdmin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Direction связи
Direction.hasMany(Student, { foreignKey: 'directionId', as: 'students' });
Student.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });

Direction.hasMany(Teacher, { foreignKey: 'directionId', as: 'teachers' });
Teacher.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });

Direction.hasMany(Admin, { foreignKey: 'directionId', as: 'admins' });
Admin.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });

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

// Enrollment связи (many-to-many между Student и Course)
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Many-to-many через Enrollment
Course.belongsToMany(Student, { through: Enrollment, foreignKey: 'courseId', otherKey: 'studentId', as: 'students' });
Student.belongsToMany(Course, { through: Enrollment, foreignKey: 'studentId', otherKey: 'courseId', as: 'courses' });

module.exports = {
  User,
  Direction,
  Student,
  Teacher,
  Admin,
  SuperAdmin,
  Course,
  Material,
  Assignment,
  Submission,
  Enrollment
};