-- Создание базы данных для платформы учета обслуживания автомобилей

-- База данных будет создана автоматически Spring Boot при первом запуске
-- Этот скрипт можно использовать для ручной инициализации или миграций

-- Создание базы данных (выполнить от имени суперпользователя)
-- CREATE DATABASE car_maintenance_db;

-- Подключение к базе данных
-- \c car_maintenance_db;

-- Таблицы будут созданы автоматически через JPA/Hibernate
-- при использовании spring.jpa.hibernate.ddl-auto=update

-- Для production рекомендуется использовать миграции Flyway или Liquibase

-- Пример создания администратора (выполнить после первого запуска приложения)
-- INSERT INTO users (email, password, first_name, last_name, role, status, created_at, updated_at)
-- VALUES ('admin@example.com', '$2a$10$...', 'Admin', 'User', 'ADMIN', 'ACTIVE', NOW(), NOW());
