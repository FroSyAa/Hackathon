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
