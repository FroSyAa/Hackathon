require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { sequelize } = require('../config/database');
const {
  User,
  Direction,
  Student,
  Teacher,
  Course,
  Material,
  Assignment,
  Submission,
  SuperAdmin
} = require('../models');

const OUTPUT_PATH = path.resolve(__dirname, 'generatedTestData.json');
const TESTDATA_PATH = path.resolve(__dirname, 'TestData.json');

const ROOT_TEST_CANDIDATES = [
  path.resolve(__dirname, '..', 'uploads', 'testFiles'),
  path.resolve(__dirname, '..', 'Test'), 
  path.resolve(__dirname, '..', '..', 'Test') 
];

let ROOT_TEST = null;
for (const p of ROOT_TEST_CANDIDATES) {
  if (fs.existsSync(p)) {
    ROOT_TEST = p;
    break;
  }
}
if (!ROOT_TEST) ROOT_TEST = ROOT_TEST_CANDIDATES[0];
const UPLOADS = path.resolve(__dirname, '..', 'uploads');

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).map(f => path.join(dir, f));
  } catch {
    return [];
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copySample(srcPath, destDir) {

  ensureDir(destDir);
  const base = path.basename(srcPath);
  const name = `${Date.now()}-${base}`;
  const dest = path.join(destDir, name);
  fs.copyFileSync(srcPath, dest);
  return path.join(path.basename(destDir), name).replace(/\\/g, '/');
}

function copySampleDeterministic(srcPath, destDir, key) {
  ensureDir(destDir);
  const safeKey = String(key).replace(/[^a-z0-9-_]/gi, '_');
  if (srcPath && fs.existsSync(srcPath)) {
    const base = path.basename(srcPath);
    const name = `${safeKey}-${base}`;
    const dest = path.join(destDir, name);
    if (!fs.existsSync(dest)) fs.copyFileSync(srcPath, dest);
    return path.join(path.basename(destDir), name).replace(/\\/g, '/');
  }
  const name = `${safeKey}-placeholder.png`;
  const dest = path.join(destDir, name);
  if (!fs.existsSync(dest)) {
    try {
      fs.writeFileSync(dest, 'placeholder', 'utf8');
    } catch (e) {
    }
  }
  return path.join(path.basename(destDir), name).replace(/\\/g, '/');
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log(' DB connection OK');

    const avatarsDir = path.join(UPLOADS, 'avatars');
    const coursesDir = path.join(UPLOADS, 'courses');
    const materialsDir = path.join(UPLOADS, 'materials');
    const assignmentsDir = path.join(UPLOADS, 'assignments');
    ensureDir(avatarsDir);
    ensureDir(coursesDir);
    ensureDir(materialsDir);
    ensureDir(assignmentsDir);

    try {
      console.log('  Running createSuperAdmin.js (separately)');
      execSync('node scripts/createSuperAdmin.js', { stdio: 'inherit' });
    } catch (err) {
      console.warn('createSuperAdmin.js finished with non-zero code (or already ran)');
    }

    const teacherImgs = listFiles(path.join(ROOT_TEST, 'Teacher'));
    const courseImgs = listFiles(path.join(ROOT_TEST, 'Course'));
    const materialFiles = listFiles(path.join(ROOT_TEST, 'Material'));

    const hasTestData = fs.existsSync(TESTDATA_PATH);
    const testData = hasTestData ? JSON.parse(fs.readFileSync(TESTDATA_PATH, 'utf8')) : null;

    const output = {
      superAdmin: null,
      directions: [],
      users: [],
      teachers: [],
      students: [],
      courses: [],
      materials: [],
      assignments: [],
      submissions: []
    };

    const directions = [];
    const directionNames = ['Frontend', 'Backend'];
    for (const name of directionNames) {
      const [dir] = await Direction.findOrCreate({ where: { name } });
      directions.push(dir);
      output.directions.push({ id: dir.id, name: dir.name });
    }

    const teachers = [];
    const students = [];

    if (testData && Array.isArray(testData.users)) {
      for (const u of testData.users) {
        const email = u.email;
        let user = await User.findOne({ where: { email } });
        const avatarSrc = (typeof u.avatarIndex === 'number' && teacherImgs.length) ? teacherImgs[u.avatarIndex % teacherImgs.length] : null;
        const avatarRel = copySampleDeterministic(avatarSrc, avatarsDir, email);

        const password = u.password || 'password123';

        if (!user) {
          user = await User.create({
            email,
            password,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            middleName: u.middleName || '',
            avatar: avatarRel
          });
        } else {
          try {
            await user.update({ password, firstName: u.firstName || user.firstName, lastName: u.lastName || user.lastName, middleName: u.middleName || user.middleName });
            if (avatarRel) await user.update({ avatar: avatarRel });
          } catch (e) {
          }
        }

        output.users.push({ id: user.id, email: email, firstName: u.firstName || user.firstName, lastName: u.lastName || user.lastName, avatar: avatarRel || user.avatar, password });

        const directionObj = directions.find(d => d.name === (u.direction || 'Frontend')) || directions[0];
        if (u.role === 'teacher') {
          let teacher = await Teacher.findOne({ where: { userId: user.id } });
          if (!teacher) teacher = await Teacher.create({ userId: user.id, directionId: directionObj.id });
          teachers.push({ user, teacher });
          output.teachers.push({ id: teacher.id, userId: user.id, directionId: teacher.directionId });
        } else {
          let student = await Student.findOne({ where: { userId: user.id } });
          if (!student) student = await Student.create({ userId: user.id, directionId: directionObj.id, groupName: u.groupName || 'G1' });
          students.push({ user, student });
          output.students.push({ id: student.id, userId: user.id, directionId: student.directionId, groupName: student.groupName });
        }
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        const email = `teacher${i}@test.local`;
        let user = await User.findOne({ where: { email } });
        if (!user) {
          const avatarSrc = teacherImgs.length ? teacherImgs[(i - 1) % teacherImgs.length] : null;
          const avatarRel = avatarSrc ? copySample(avatarSrc, avatarsDir) : null;
          user = await User.create({
            email,
            password: 'password123',
            firstName: `Teacher${i}`,
            lastName: 'Test',
            middleName: '',
            avatar: avatarRel
          });
        }
        output.users.push({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar, password: 'password123' });
        const directionId = directions[(i - 1) % directions.length].id;
        let teacher = await Teacher.findOne({ where: { userId: user.id } });
        if (!teacher) {
          teacher = await Teacher.create({ userId: user.id, directionId });
        }
        teachers.push({ user, teacher });
        output.teachers.push({ id: teacher.id, userId: user.id, directionId: teacher.directionId });
      }

      for (let i = 1; i <= 5; i++) {
        const email = `student${i}@test.local`;
        let user = await User.findOne({ where: { email } });
        if (!user) {
          const avatarSrc = teacherImgs.length ? teacherImgs[(i + 1) % teacherImgs.length] : null;
          const avatarRel = avatarSrc ? copySample(avatarSrc, avatarsDir) : null;
          user = await User.create({
            email,
            password: 'password123',
            firstName: `Student${i}`,
            lastName: 'Test',
            middleName: '',
            avatar: avatarRel
          });
        }
        output.users.push({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar, password: 'password123' });
        const directionId = directions[(i - 1) % directions.length].id;
        let student = await Student.findOne({ where: { userId: user.id } });
        if (!student) {
          student = await Student.create({ userId: user.id, directionId, groupName: `G${i}` });
        }
        students.push({ user, student });
        output.students.push({ id: student.id, userId: user.id, directionId: student.directionId, groupName: student.groupName });
      }
    }

    const courses = [];
    if (testData && Array.isArray(testData.courses)) {
      for (const c of testData.courses) {
        const teacherObj = output.users.find(u => u.email === c.teacherEmail);
        let teacherProfile = null;
        if (teacherObj) {
          const t = teachers.find(ti => ti.user.email === teacherObj.email);
          if (t) teacherProfile = t.teacher;
        }
        const title = c.title;
        const teacherId = teacherProfile ? teacherProfile.id : (teachers[0] ? teachers[0].teacher.id : null);
        const imageSrc = (typeof c.imageIndex === 'number' && courseImgs.length) ? courseImgs[c.imageIndex % courseImgs.length] : null;
        const imageRel = copySampleDeterministic(imageSrc, coursesDir, title);
        const [course] = await Course.findOrCreate({
          where: { title, teacherId },
          defaults: {
            description: c.description || '',
            imageUrl: imageRel,
            teacherId
          }
        });
        if (course && !course.imageUrl && imageRel) {
          try { await course.update({ imageUrl: imageRel }); } catch (e) { }
        }
        courses.push(course);
        output.courses.push({ id: course.id, title: course.title, description: course.description, imageUrl: course.imageUrl || imageRel, teacherId: course.teacherId });
      }
    } else {
      for (let i = 0; i < teachers.length; i++) {
        const t = teachers[i];
        const title = `Test Course ${i + 1}`;
        const [course] = await Course.findOrCreate({
          where: { title, teacherId: t.teacher.id },
          defaults: {
            description: `Automatically generated course ${i + 1}`,
            imageUrl: courseImgs.length ? copySample(courseImgs[i % courseImgs.length], coursesDir) : null,
            teacherId: t.teacher.id
          }
        });
        courses.push(course);
        output.courses.push({ id: course.id, title: course.title, description: course.description, imageUrl: course.imageUrl, teacherId: course.teacherId });
      }
    }

    const assignments = [];
    for (const course of courses) {
      const materialCount = 2;
      for (let m = 0; m < materialCount; m++) {
        const src = materialFiles.length ? materialFiles[(m + 1) % materialFiles.length] : null;
        const fileRel = copySampleDeterministic(src, materialsDir, `${course.title}-material-${m}`);
        const material = await Material.create({
          courseId: course.id,
          title: `Material ${m + 1} for ${course.title}`,
          description: 'Test material',
          type: 'pdf',
          fileUrl: fileRel
        });
        output.materials.push({ id: material.id, courseId: material.courseId, title: material.title, fileUrl: material.fileUrl, type: material.type });
      }

      const attachSrc = materialFiles.length ? materialFiles[0] : null;
      const attachRel = copySampleDeterministic(attachSrc, assignmentsDir, `${course.title}-assignment-attach`);
      const assign = await Assignment.create({
        courseId: course.id,
        title: `Assignment for ${course.title}`,
        description: 'Пожалуйста, отправьте тестовый файл',
        deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        maxScore: 100,
        attachments: [attachRel]
      });
      assignments.push(assign);
      output.assignments.push({ id: assign.id, courseId: assign.courseId, title: assign.title, attachments: assign.attachments });
    }

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      for (let j = 0; j < Math.min(2, assignments.length); j++) {
        const assign = assignments[j];
        const src = materialFiles.length ? materialFiles[(i + j) % materialFiles.length] : null;
        let fileRel;
        if (src) {
          fileRel = copySample(src, assignmentsDir);
        } else {
          const dummyName = `submission-${student.user && student.user.id ? student.user.id : i}-${assign && assign.id ? assign.id : j}-${Date.now()}.txt`;
          const dummyPath = path.join(assignmentsDir, dummyName);
          try {
            fs.writeFileSync(dummyPath, 'тестовая отправка', 'utf8');
          } catch (e) {
          }
          fileRel = path.join(path.basename(assignmentsDir), dummyName).replace(/\\/g, '/');
        }
        const submission = await Submission.create({
          assignmentId: assign.id,
          studentId: student.student.id,
          fileUrl: fileRel,
          comment: 'Автоматически отправлено с помощью seed',
          status: 'pending'
        });
        output.submissions.push({ id: submission.id, assignmentId: submission.assignmentId, studentId: submission.studentId, fileUrl: submission.fileUrl, status: submission.status });
      }
    }

    try {
      const sa = await SuperAdmin.findOne({ include: [{ model: User, as: 'user' }] });
      if (sa) {
        output.superAdmin = { id: sa.id, userId: sa.userId, email: sa.user ? sa.user.email : null, isMainAdmin: sa.isMainAdmin };
      }
    } catch (e) {
    }

    try {
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
    } catch (e) {
    }

    console.log('\nДанные теста:');
    console.log(` - Направления: ${directionNames.join(', ')}`);
    console.log(` - Преподаватели: ${teachers.length}`);
    console.log(` - Студенты: ${students.length}`);
    console.log(` - Курсы: ${courses.length}`);
    console.log(` - Задания: ${assignments.length}`);

    process.exit(0);
  } catch (err) {
    console.error('Ошибка создания тестовых данных', err);
    process.exit(1);
  }
}

run();
