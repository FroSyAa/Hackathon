1. **Presentation Layer (Frontend)** - HTML/CSS/JavaScript
2. **Application Layer (Backend)** - Node.js + Express
3. **Data Layer** - PostgreSQL

## Разделение по ролям

Вся система разделена на три основных блока:

### 1. Teacher (Преподаватель)
- Загрузка и управление учебными материалами
- Создание заданий
- Проверка работ студентов
- Выставление оценок
- Просмотр статистики группы

### 2. Student (Студент)
- Просмотр материалов курса
- Загрузка домашних заданий
- Просмотр оценок и комментариев
- Отслеживание прогресса

### 3. Common (Общее)
- Аутентификация и авторизация
- Чат между студентами и преподавателями
- Профиль пользователя

## Backend структура

```
backend/
├── routes/          # REST API маршруты
├── controllers/     # Бизнес-логика
├── models/          # Модели данных (ORM)
├── middleware/      # Промежуточное ПО
├── config/          # Конфигурация
└── uploads/         # Загруженные файлы
```

### Маршруты (Routes)
Отвечают за определение HTTP эндпоинтов и передачу запросов контроллерам.

### Контроллеры (Controllers)
Содержат бизнес-логику приложения. Обрабатывают запросы, работают с моделями, возвращают ответы.

### Модели (Models)
Описывают структуру данных в БД. Используется ORM Sequelize для работы с PostgreSQL.

### Middleware
- **auth.js** - проверка JWT токена, определение роли пользователя

## Frontend структура

```
frontend/
├── pages/           # HTML страницы
├── components/      # Переиспользуемые UI компоненты
├── js/              # JavaScript логика
├── styles/          # CSS стили
└── assets/          # Статические файлы
```

### Разделение по ролям
Каждая папка содержит три подпапки:
- `teacher/` - для преподавателей
- `student/` - для студентов
- `common/` - общие компоненты

## API архитектура

### RESTful API
Все эндпоинты следуют REST принципам:
- GET - получение данных
- POST - создание данных
- PUT - обновление данных
- DELETE - удаление данных

### Аутентификация
Используется JWT (JSON Web Token):
1. Пользователь логинится, получает токен
2. Токен сохраняется в localStorage
3. Каждый запрос включает токен в заголовке Authorization
4. Сервер проверяет токен и права доступа

### Авторизация
Проверка ролей через middleware:
```javascript
// Только для преподавателей
router.get('/teacher/materials', authenticateToken, authorizeRole('teacher'), ...)

// Только для студентов
router.get('/student/courses', authenticateToken, authorizeRole('student'), ...)
```

## База данных

### Основные таблицы

**users**
- id, email, password, role, firstName, lastName, avatar

**courses**
- id, title, description, teacherId

**materials**
- id, courseId, title, type, fileUrl, version

**assignments**
- id, courseId, title, description, deadline, maxScore

**submissions**
- id, assignmentId, studentId, fileUrl, submittedAt, score, feedback

**messages**
- id, roomId, senderId, content, createdAt

### Связи
- User hasMany Courses (преподаватель создает курсы)
- Course belongsTo User (курс принадлежит преподавателю)
- Course hasMany Materials
- Course hasMany Assignments
- Assignment hasMany Submissions
- User hasMany Submissions (студент сдает работы)

## Безопасность

1. **Хеширование паролей** - bcrypt
2. **JWT токены** - срок действия 7 дней
3. **Проверка ролей** - middleware авторизации
4. **Валидация данных** - на сервере и клиенте
5. **Ограничение размера файлов** - до 100MB(Или условия там какие? Я не помню просто...)
6. **CORS** - настройка разрешенных источников

## Масштабируемость

### Текущая архитектура
- Монолитное приложение
- Подходит для MVP и небольших команд

### Возможности расширения
1. Разделение на микросервисы
2. Добавление Redis для кэширования
3. WebSocket для real-time чата
4. CDN для статических файлов
5. Load Balancer для распределения нагрузки

## Производительность

### Оптимизации
1. Индексы в БД на часто запрашиваемые поля
2. Пагинация для списков (курсы, материалы, сообщения)
3. Ленивая загрузка материалов
4. Сжатие изображений перед загрузкой
5. Кэширование статических файлов

## Развертывание

### Docker
Проект контейнеризирован:
- `backend` - Node.js приложение
- `frontend` - Nginx для раздачи статики
- `db` - PostgreSQL база данных

### Запуск
```bash
docker-compose up -d
```

