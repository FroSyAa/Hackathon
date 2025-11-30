# Education Platform — Hackathon Project

Этот репозиторий содержит учебную платформу (backend + frontend). Включает скрипты для заполнения тестовыми данными и инструкции по запуску.

**Команда**
- Елизавета Фирсова — капитан, frontend
- Никита Шипунов — backend
- Полина Кряквина — frontend
- Спирягина Варвара — создание презентации
- Никита Лукьянов — генератор идей, backend

## Структура проекта

Корневая структура (важные файлы/папки):

- `backend/` — серверная часть (Node.js, Express, Sequelize + Postgres)
	- `models/` — модели Sequelize
	- `routes/` — маршруты API
	- `config/` — конфигурация (например `database.js`)
	- `scripts/` — вспомогательные скрипты: `createSuperAdmin.js`, `createTestData.js`, `TestData.json`, `generatedTestData.json`
	- `uploads/` — загруженные файлы (аватарки, материалы, сдачи)

- `frontend/` — статическая клиентская часть (HTML, JS, CSS)

- `Test/` — папка с примерами файлов (аватарки, изображения курсов, материалы). При запуске сидера файлы копируются в `backend/uploads`.

- `docker-compose.yml` — запускает сервисы: `db` (Postgres), `backend`, `frontend`.

## Зависимости и версии

Пакеты (основные) в `backend/package.json`:
- `express` — веб-сервер
- `sequelize` — ORM
- `pg` — драйвер Postgres
- `bcryptjs` — хэширование паролей
- `jsonwebtoken` — JWT

Пакеты (основные) в `frontend/package.json` (если используются сборщики):
- стандартные frontend зависимости (необязательно для статики)

Чтобы увидеть точные версии, откройте `backend/package.json` и `frontend/package.json`.

## Настройка и запуск (локально, используя Docker Compose)

1. Скопируйте репозиторий:

```powershell
git clone <repo-url>
cd Hackathon
```

2. Создайте/проверьте `.env` в `backend/` 
Важно задать:

```text
DB_HOST=db
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=education_platform
JWT_SECRET=your_jwt_secret_key_here
SUPER_ADMIN_EMAIL=123@123.ru
SUPER_ADMIN_PASSWORD=supersecret
```

3. Запустите контейнеры:

```powershell
docker-compose up -d --build
```

4. Выполните сидер для создания супер-админа и тестовых данных (рекомендуется выполнять внутри контейнера, чтобы скрипт корректно подключился к Postgres):

```powershell
docker-compose exec backend node scripts/createTestData.js
```

5. Проверьте файл с результатом: `backend/scripts/generatedTestData.json`. В нём содержатся логины, пароли (из `TestData.json`) и созданные ID.

6. Откройте frontend в браузере: `http://localhost:8080` (Nginx в `frontend` контейнере)

## Запуск локально без Docker

1. Убедитесь, что PostgreSQL запущен и доступны креды из `.env`.
2. Установите зависимости и запустите backend:

```powershell
cd backend
npm install
node server.js
```

3. Для frontend — откройте `frontend/index.html` в браузере или используйте статический сервер.

## Скрипты для тестовых данных

- `backend/scripts/TestData.json` — источник детерминированных тестовых данных (логины/пароли/курсы).
- `backend/scripts/createTestData.js` — читает `TestData.json`, копирует файлы (или создаёт плейсхолдеры), создаёт записи в БД и пишет `generatedTestData.json`.
- Если хотите изменить тестовые данные — отредактируйте `TestData.json` и перезапустите скрипт.

## Комментарии по использованию файлов из `Test/` и Docker

При запуске внутри контейнера `backend` (в `docker-compose`) директория, видимая контейнеру, — это `./backend` смонтированная в `/app`. Поэтому `createTestData.js` предпочитает `backend/Test` (если вы поместите `Test/` внутрь `backend`) — тогда контейнер сможет скопировать реальные картинки и файлы. В противном случае скрипт создаёт плейсхолдеры.

Если хотите, чтобы реальные картинки использовались автоматически, скопируйте содержимое корневого `Test/` в `backend/Test/`.

# Скрипты для управления БД

## Создание супер-админа

### Автоматически (через Node.js)
```bash
npm run create-superadmin
```

### Вручную (через PostgreSQL)
Если автоматический скрипт не работает из-за проблем с аутентификацией, используйте следующую команду:

```bash
# 1. Создать пользователя
docker exec education_db psql -U admin -d education_platform -c "
INSERT INTO \"Users\" (id, email, password, \"firstName\", \"lastName\", \"middleName\", \"createdAt\", \"updatedAt\")
VALUES (gen_random_uuid(), '123@123.ru', '\$2a\$10\$yNTg6pfgVGD3cz.Mgf47Kua8y1bt7czLMiQUkwXYN0ruwThB2Kca.', 'Super', 'Admin', '', NOW(), NOW())
ON CONFLICT DO NOTHING
RETURNING id;
"

# 2. Получить ID созданного пользователя
docker exec education_db psql -U admin -d education_platform -c "SELECT id FROM \"Users\" WHERE email = '123@123.ru';"

# 3. Создать запись SuperAdmin (замените USER_ID на полученный ID)
docker exec education_db psql -U admin -d education_platform -c "
INSERT INTO \"SuperAdmins\" (id, \"userId\", \"isMainAdmin\", \"createdAt\", \"updatedAt\")
VALUES (gen_random_uuid(), 'USER_ID', true, NOW(), NOW())
ON CONFLICT DO NOTHING;
"
```

### Данные для входа
- **Email**: 123@123.ru
- **Пароль**: 123456

## Примечание
Пароль хешируется с помощью bcrypt (10 раундов).
Хеш пароля `123456`: `$2a$10$yNTg6pfgVGD3cz.Mgf47Kua8y1bt7czLMiQUkwXYN0ruwThB2Kca.`
