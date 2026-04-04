# Платформа учета обслуживания автомобилей

Веб-платформа для учета технического обслуживания автомобилей с интеграцией сервисных центров Казахстана.

## 🚀 Быстрый старт

### Предварительные требования

- **Java 17+** - проверьте: `java -version`
- **Maven 3.6+** - проверьте: `mvn -version`
- **PostgreSQL 12+** - проверьте: `psql --version`
- **Node.js 18+** (для frontend) - проверьте: `node -v`

### Установка и запуск Backend

1. **Создайте базу данных PostgreSQL:**
   ```bash
   psql -U postgres
   CREATE DATABASE car_maintenance_db;
   \q
   ```

2. **Настройте `src/main/resources/application.yml`:**
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/car_maintenance_db
       username: postgres
       password: postgres
   ```

3. **Запустите приложение:**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   Backend будет доступен на `http://localhost:8080/api`

### Установка и запуск Frontend

1. **Перейдите в директорию frontend:**
   ```bash
   cd frontend
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Запустите приложение:**
   ```bash
   npm run dev
   ```

   Frontend будет доступен на `http://localhost:3000`

## 📋 Технологический стек

### Backend (Java/Spring)

#### Основной фреймворк
- **Java 17** - язык программирования
- **Spring Boot 3.2.0** - основной фреймворк для создания приложения
- **Maven** - система сборки и управления зависимостями

#### База данных и ORM
- **PostgreSQL 12+** - реляционная база данных
- **Spring Data JPA** - абстракция для работы с БД
- **Hibernate 6** - ORM (Object-Relational Mapping) для работы с сущностями
- **HikariCP** - пул соединений с БД (встроен в Spring Boot)

#### Безопасность и аутентификация
- **Spring Security 6.2.0** - фреймворк безопасности
- **JWT (JSON Web Tokens)** - токены для аутентификации
  - `jjwt-api 0.12.3` - API для работы с JWT
  - `jjwt-impl 0.12.3` - реализация JWT
  - `jjwt-jackson 0.12.3` - интеграция с Jackson
- **BCrypt** - хеширование паролей (встроен в Spring Security)

#### Веб и REST API
- **Spring Web MVC** - REST контроллеры и обработка HTTP запросов
- **Spring WebSocket** - поддержка WebSocket (для будущего функционала)
- **Jackson** - сериализация/десериализация JSON
  - `jackson-datatype-hibernate6 2.15.2` - поддержка Hibernate lazy loading

#### Валидация
- **Jakarta Bean Validation** - валидация данных (@NotNull, @NotBlank, и т.д.)
- **Spring Boot Starter Validation** - интеграция валидации

#### Утилиты и библиотеки
- **Lombok** - генерация boilerplate кода (@Data, @Builder, @RequiredArgsConstructor)
- **MapStruct 1.5.5** - маппинг между объектами (DTO ↔ Entity)
- **Commons IO 2.15.1** - работа с файлами
- **iTextPDF 5.5.13.3** - генерация PDF документов (счета, отчеты)

#### Email
- **Spring Boot Starter Mail** - отправка email уведомлений
- Поддержка SMTP (Gmail, и другие провайдеры)

#### Тестирование
- **JUnit 5** - фреймворк для unit-тестов
- **Spring Boot Test** - интеграционное тестирование
- **Spring Security Test** - тестирование безопасности
- **Mockito** - моки для тестирования

### Frontend (React/TypeScript)

#### Основной фреймворк и язык
- **React 18.2.0** - библиотека для создания пользовательских интерфейсов
- **TypeScript 5.3.3** - типизированный JavaScript
- **Vite 5.0.8** - быстрый сборщик и dev-сервер

#### Маршрутизация
- **React Router DOM 6.20.0** - клиентская маршрутизация (SPA)

#### Управление состоянием
- **Zustand 4.4.7** - легковесная библиотека для глобального состояния (авторизация)
- **TanStack Query (React Query) 5.12.2** - управление серверным состоянием, кеширование, синхронизация

#### HTTP клиент
- **Axios 1.6.2** - HTTP клиент для запросов к API
- Автоматическая обработка JWT токенов через interceptors

#### Стилизация
- **Tailwind CSS 3.3.6** - utility-first CSS фреймворк
- **PostCSS 8.4.32** - обработка CSS
- **Autoprefixer 10.4.16** - автоматическое добавление vendor prefixes
- Кастомные классы для темы автоиндустрии (темный фон, красные акценты)

#### UI компоненты и иконки
- **React Icons 5.5.0** - библиотека иконок (Font Awesome, Material Icons, и др.)
- Используются преимущественно иконки Font Awesome

#### Формы
- **React Hook Form 7.48.2** - управление формами с валидацией

#### Уведомления
- **React Hot Toast 2.4.1** - toast-уведомления для пользователя

#### Работа с датами
- **date-fns 2.30.0** - библиотека для работы с датами и временем
- Поддержка локализации (русский язык)

#### Карты
- **Leaflet 1.9.4** - библиотека для интерактивных карт
- **React Leaflet 4.2.1** - React компоненты для Leaflet
- Используется для отображения сервисных центров на карте

#### Графики и визуализация
- **Recharts 2.10.3** - библиотека для создания графиков и диаграмм

#### Инструменты разработки
- **ESLint** - линтер для JavaScript/TypeScript
- **TypeScript Compiler** - проверка типов

### Инфраструктура и инструменты

#### База данных
- **PostgreSQL** - основная база данных
- **Hibernate DDL Auto Update** - автоматическое обновление схемы БД

#### Сборка и развертывание
- **Maven** - сборка backend (JAR файл)
- **Vite** - сборка frontend (оптимизированный bundle)
- **npm** - управление зависимостями frontend

#### Версионирование и контроль
- **Git** - система контроля версий (предполагается)

### Архитектурные паттерны

#### Backend
- **Layered Architecture** - разделение на Controller → Service → Repository
- **DTO Pattern** - использование Data Transfer Objects для передачи данных
- **Repository Pattern** - абстракция доступа к данным
- **Dependency Injection** - через Spring IoC контейнер
- **RESTful API** - REST архитектура для API

#### Frontend
- **Component-Based Architecture** - компонентный подход React
- **Container/Presentational Pattern** - разделение логики и представления
- **Custom Hooks** - переиспользование логики
- **Context API** (через Zustand) - глобальное состояние

### Стиль кодирования

#### Backend
- **Java Naming Conventions** - camelCase для методов и переменных
- **Lombok** - уменьшение boilerplate кода
- **Spring Annotations** - декларативный стиль (@RestController, @Service, и т.д.)

#### Frontend
- **TypeScript** - строгая типизация
- **Functional Components** - функциональные компоненты React
- **Hooks** - использование React Hooks (useState, useEffect, и т.д.)
- **ES6+ Features** - современный JavaScript/TypeScript синтаксис

## 🏗️ Архитектура

Проект построен по модульному принципу с готовностью к микросервисной архитектуре:

### Backend структура
```
src/main/java/kz/car/maintenance/
├── controller/     # REST контроллеры
├── service/        # Бизнес-логика
├── repository/     # JPA репозитории
├── model/          # Сущности БД
├── dto/            # Data Transfer Objects
├── security/       # JWT, Security конфигурация
└── config/         # Конфигурация (DataInitializer, Jackson)
```

### Frontend структура
```
frontend/src/
├── api/            # API клиент (Axios)
├── components/     # Переиспользуемые компоненты
├── pages/          # Страницы приложения
├── store/          # Zustand stores
└── App.tsx         # Роутинг
```

## 👥 Роли пользователей

### USER (Владелец автомобиля)
- Управление гаражом (несколько автомобилей)
- Визуализация состояния деталей
- История обслуживания
- Запись на обслуживание
- Уведомления и рекомендации
- Обучение (контент, квизы)
- Чат с сервисными центрами

### SERVICE_CENTER (Сервисный центр)
- Панель управления (дашборд)
- Просмотр записей клиентов
- Управление клиентами
- Просмотр отзывов
- Настройки профиля

**Как войти как сервисный центр:**
- Email: `service1@example.com`, `service2@example.com`, и т.д. (service1-service5)
- Пароль: `service123`

### ADMIN (Администратор)
- Управление пользователями
- Модерация сервисных центров
- Управление обучающим контентом
- Аналитика

### SUPPORT (Поддержка)
- Обработка обращений пользователей
- Чат поддержки

## 🔐 Аутентификация

Приложение использует JWT (JSON Web Tokens) для аутентификации.

### Регистрация
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Иван",
  "lastName": "Иванов",
  "phoneNumber": "+7 (XXX) XXX-XX-XX"
}
```

### Вход
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Ответ содержит токен и данные пользователя:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "role": "USER"
  }
}
```

Токен используется в заголовке `Authorization: Bearer <token>` для всех защищенных запросов.

## 🚗 Основной функционал

### Управление автомобилями

**Добавление автомобиля:**
```
POST /api/cars
Authorization: Bearer <token>
Content-Type: application/json

{
  "brand": "Toyota",
  "model": "Camry",
  "year": 2020,
  "licensePlate": "01ABC123",
  "vin": "4T1BF1FKXEU123456",
  "color": "Черный",
  "mileage": 50000
}
```

При добавлении автомобиля автоматически создаются стандартные компоненты (двигатель, тормоза, подвеска и т.д.) с начальным износом 0%.

### Отслеживание износа компонентов

Система автоматически рассчитывает износ компонентов на основе:
- **Пробега** - текущий пробег компонента
- **Времени эксплуатации** - количество месяцев с последней замены
- **Стиля вождения** - CALM (спокойный), MODERATE (умеренный), AGGRESSIVE (агрессивный)
- **Коэффициента износа** - индивидуальный для каждого типа компонента

**Получить компоненты автомобиля:**
```
GET /api/cars/{carId}/components
Authorization: Bearer <token>
```

**Обновить износ (автоматически):**
```
POST /api/cars/{carId}/components/update-wear
Authorization: Bearer <token>
```

**Заменить компонент:**
```
POST /api/cars/{carId}/components/{componentId}/replace
Authorization: Bearer <token>
```

При замене компонента его износ сбрасывается на 0%, пробег обнуляется.

### История обслуживания

**Создать запись об обслуживании:**
```
POST /api/maintenance-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "carId": 1,
  "serviceCenterId": 1,
  "workType": "ТО",
  "description": "Замена масла, фильтров",
  "serviceDate": "2026-01-15",
  "mileageAtService": 52000,
  "cost": 25000.0
}
```

**Получить историю:**
```
GET /api/maintenance-records/car/{carId}
Authorization: Bearer <token>
```

### Сервисные центры

**Получить все активные сервисные центры:**
```
GET /api/service-centers
```

**Найти ближайшие:**
```
GET /api/service-centers/nearby?latitude=43.2220&longitude=76.8512&radiusKm=10
```

**Получить информацию о сервисе:**
```
GET /api/service-centers/{id}
```

**Получить отзывы:**
```
GET /api/service-centers/{id}/reviews
```

**Оставить отзыв:**
```
POST /api/service-centers/{id}/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Отличный сервис!"
}
```

### Записи на обслуживание

**Создать запись:**
```
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "carId": 1,
  "serviceCenterId": 1,
  "bookingDateTime": "2026-01-20T10:00:00",
  "description": "Диагностика",
  "contactPhone": "+7 (XXX) XXX-XX-XX"
}
```

**Получить свои записи:**
```
GET /api/bookings/my
Authorization: Bearer <token>
```

**Получить записи сервисного центра:**
```
GET /api/bookings/service-center/{serviceCenterId}
Authorization: Bearer <token>
```

**Обновить статус записи:**
```
PATCH /api/bookings/{id}/status?status=CONFIRMED
Authorization: Bearer <token>
```

Статусы: `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

### Уведомления

Система автоматически создает уведомления при:
- Критическом износе компонента (≥90%)
- Высоком износе компонента (≥70%)
- Напоминании о ТО
- Новых сообщениях
- Новых записях на обслуживание

**Получить уведомления:**
```
GET /api/notifications
Authorization: Bearer <token>
```

**Получить количество непрочитанных:**
```
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

**Отметить как прочитанное:**
```
PATCH /api/notifications/{id}/read
Authorization: Bearer <token>
```

**Отметить все как прочитанные:**
```
PATCH /api/notifications/read-all
Authorization: Bearer <token>
```

### Чат

**Отправить сообщение:**
```
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": 2,
  "content": "Здравствуйте!",
  "type": "CHAT"
}
```

**Получить беседу:**
```
GET /api/messages/conversation/{userId}
Authorization: Bearer <token>
```

**Получить непрочитанные сообщения:**
```
GET /api/messages/unread
Authorization: Bearer <token>
```

### Обучающий контент

**Получить опубликованный контент:**
```
GET /api/educational-content
```

**Получить контент по категории:**
```
GET /api/educational-content/category/{category}
```

**Получить квиз:**
```
GET /api/quizzes/{id}
```

## 🛠️ Функционал сервисного центра

### Текущий статус

**Частично реализован:**

✅ **Реализовано:**
- Авторизация для сервисных центров (5 тестовых аккаунтов)
- Отдельная навигация в интерфейсе
- Дашборд сервисного центра (базовая версия)
- Просмотр отзывов (через API)
- Получение записей клиентов (через API)

❌ **Не реализовано:**
- Страницы для маршрутов `/service-center/bookings`, `/service-center/clients`, `/service-center/reviews`, `/service-center/settings` не существуют во фронтенде
- Полный функционал управления записями
- Управление клиентами
- Настройки профиля сервисного центра

### Как войти как сервисный центр

1. Откройте приложение: `http://localhost:3000`
2. Перейдите на страницу входа
3. Используйте один из тестовых аккаунтов:
   - **Email:** `service1@example.com` (или service2-service5)
   - **Пароль:** `service123`

4. После входа вы увидите:
   - Отдельную навигацию для сервисного центра
   - Дашборд с базовой статистикой (пока не функционален)
   - Пункты меню: "Панель управления", "Записи клиентов", "Клиенты", "Отзывы", "Настройки"

**Важно:** Страницы для пунктов меню "Записи клиентов", "Клиенты", "Отзывы", "Настройки" пока не реализованы. При клике на них будет ошибка 404.

### Что работает для сервисного центра

1. **Авторизация** - можно войти под ролью SERVICE_CENTER
2. **Навигация** - отдельное меню отображается корректно
3. **Дашборд** - базовая страница показывается, но данные не загружаются (TODO в коде)
4. **API endpoints** - на бэкенде есть эндпоинты для:
   - Получения записей сервисного центра: `GET /api/bookings/service-center/{serviceCenterId}`
   - Получения отзывов: `GET /api/service-centers/{id}/reviews`
   - Обновления статуса записи: `PATCH /api/bookings/{id}/status`

### Тестовые аккаунты сервисных центров

При первом запуске приложения автоматически создаются 5 тестовых сервисных центров:

| Email | Пароль | Название | Город |
|-------|--------|----------|-------|
| service1@example.com | service123 | АвтоМастер | Алматы |
| service2@example.com | service123 | ТехноСервис | Астана |
| service3@example.com | service123 | Быстрый Ремонт | Шымкент |
| service4@example.com | service123 | Профи Авто | Караганда |
| service5@example.com | service123 | Мотор Ленд | Актобе |

## 📊 База данных

База данных создается автоматически при первом запуске (Hibernate DDL: `update`). Основные таблицы:

- `users` - пользователи
- `cars` - автомобили
- `car_components` - компоненты автомобилей
- `maintenance_records` - записи об обслуживании
- `service_centers` - сервисные центры
- `bookings` - записи на обслуживание
- `notifications` - уведомления
- `messages` - сообщения
- `reviews` - отзывы
- `educational_content` - обучающий контент
- `quizzes` - квизы

## 🔧 Конфигурация

### Backend (`src/main/resources/application.yml`)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/car_maintenance_db
    username: postgres
    password: postgres

server:
  port: 8080
  servlet:
    context-path: /api

app:
  jwt:
    secret: ${JWT_SECRET:your-256-bit-secret-key-change-in-production-minimum-32-characters}
    expiration: 86400000  # 24 hours
  
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3001
```

### Frontend (`frontend/src/api/client.ts`)

```typescript
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

## 🐛 Решение проблем

### Backend не запускается

1. **Проверьте PostgreSQL:**
   ```bash
   psql -U postgres -d car_maintenance_db -c "SELECT 1;"
   ```

2. **Проверьте порт 8080:**
   ```bash
   lsof -i :8080
   ```

3. **Очистите и пересоберите:**
   ```bash
   mvn clean install
   ```

### Frontend не запускается

1. **Удалите node_modules и переустановите:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Проверьте порт 3000:**
   ```bash
   lsof -i :3000
   ```

### Ошибки подключения к API

1. Убедитесь, что backend запущен на `http://localhost:8080`
2. Проверьте CORS настройки в `application.yml`
3. Проверьте, что используется правильный токен авторизации

## 📝 Примечания

- При первом запуске автоматически создаются тестовые данные:
  - Администратор (admin@example.com / admin123)
  - 5 сервисных центров (service1-service5@example.com / service123)
  - Обычный пользователь (user@example.com / user123) - только если не существует
- База данных обновляется автоматически при изменениях в моделях (режим `update`)
- Файлы загружаются в директорию `./uploads` (можно изменить в `application.yml`)
- JWT токены действительны 24 часа

## 📚 Дополнительная информация

- Структура проекта следует принципам Clean Architecture
- Используется паттерн DTO для передачи данных между слоями
- Реализована защита от циклических зависимостей через `@Lazy`
- Jackson настроен для правильной сериализации Hibernate lazy-loaded сущностей
- Frontend использует оптимистичные обновления через React Query

## 🔒 Безопасность

- Пароли хешируются с помощью BCrypt
- JWT токены подписываются секретным ключом
- Все защищенные endpoints требуют аутентификации
- CORS настроен для разрешенных источников
- SQL injection защищен через JPA параметризованные запросы

## 📄 Лицензия

Проект разработан для учета обслуживания автомобилей в Казахстане.
