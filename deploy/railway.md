# Railway Deploy

Этот репозиторий подготовлен под деплой на Railway как три отдельных сервиса:

1. `postgres` - база данных Railway PostgreSQL
2. `backend` - Spring Boot API из корня репозитория
3. `frontend` - React/Vite приложение из директории `frontend`

## 1. Создайте проект и сервисы

В Railway создайте один проект и добавьте в него:

1. `PostgreSQL` сервис с именем `postgres`
2. `GitHub Repo` сервис с именем `backend`
3. `GitHub Repo` сервис с именем `frontend`

Для `frontend` обязательно укажите:

- `Root Directory`: `frontend`

Для `backend` `Root Directory` оставьте пустым, потому что `pom.xml` лежит в корне репозитория.

## 2. Настройки backend

### Build / Start

Railway должен корректно определить Java/Spring Boot автоматически.

Если захотите указать команды вручную:

- `Build Command`: `mvn -DskipTests clean package`
- `Start Command`: оставить автоопределение Railway

### Healthcheck

- `Healthcheck Path`: `/api/public/health`
- `Healthcheck Timeout`: `300`

### Volume

Добавьте к `backend` volume:

- `Mount Path`: `/app/uploads`

### Variables

Добавьте в `backend`:

```env
SPRING_DATASOURCE_URL=jdbc:${{postgres.DATABASE_URL}}
JWT_SECRET=change-this-to-a-long-random-secret
FILE_UPLOAD_DIR=/app/uploads
APP_CORS_ALLOWED_ORIGINS=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

`FILE_UPLOAD_DIR` можно оставить как указано выше для явной настройки. В коде также есть fallback на `RAILWAY_VOLUME_MOUNT_PATH`, который Railway выставляет автоматически для подключённого volume.

Если почта нужна в проде, добавьте ещё:

```env
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

## 3. Настройки frontend

### Build / Start

Укажите явно:

- `Build Command`: `npm ci && npm run build`
- `Start Command`: `npm run start`

### Healthcheck

- `Healthcheck Path`: `/`
- `Healthcheck Timeout`: `300`

### Variables

Добавьте в `frontend`:

```env
VITE_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

Важно: это build-time переменная. После изменения `VITE_API_BASE_URL` frontend нужно redeploy.

## 4. Public domains

Сгенерируйте Railway domain для:

1. `backend`
2. `frontend`

После появления public domain у `backend` и `frontend` сделайте redeploy обоих сервисов, чтобы reference variables и фронтенд-сборка использовали актуальные значения.

## 5. Что уже подготовлено в коде

В проекте уже внесены изменения под Railway:

1. backend слушает `PORT`, который выдаёт Railway
2. CORS берётся из `APP_CORS_ALLOWED_ORIGINS`
3. health endpoint доступен по `/api/public/health`
4. uploads можно вынести на volume через `FILE_UPLOAD_DIR`
5. datasource и логирование теперь нормально управляются через environment variables

## 6. Порядок первого деплоя

1. Создать `postgres`
2. Создать `backend`
3. Добавить `backend` variables
4. Добавить `backend` volume
5. Сгенерировать public domain для `backend`
6. Создать `frontend`
7. Добавить `frontend` variable `VITE_API_BASE_URL`
8. Сгенерировать public domain для `frontend`
9. Обновить `APP_CORS_ALLOWED_ORIGINS` в `backend`
10. Redeploy `backend`
11. Redeploy `frontend`

## 7. Минимальная проверка после деплоя

Проверьте:

1. `https://<backend-domain>/api/public/health`
2. Открывается `frontend` domain
3. Логин работает
4. Загрузка файлов создаёт файлы в volume
5. Файлы открываются по URL вида `/api/uploads/...`
