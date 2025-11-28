// Модель курса
// Описание структуры данных курса в БД

// Поля:
// - id: уникальный идентификатор курса
// - title: название курса
// - description: описание курса
// - teacherId: ID преподавателя-создателя
// - students: массив ID студентов, записанных на курс
// - materials: массив учебных материалов
// - assignments: массив домашних заданий\курсачей\лаб
// - createdAt: дата создания курса
// - updatedAt: дата последнего обновления

// Связи:
// - belongsTo Teacher (преподаватель)
// - hasMany Students (студенты)
// - hasMany Materials (материалы)
// - hasMany Assignments (задания)

module.exports = {
  // Course model будет описан здесь
};
