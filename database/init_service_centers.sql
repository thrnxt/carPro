-- Скрипт для добавления тестовых сервисных центров
-- ВНИМАНИЕ: Для работы нужно сначала создать пользователей с ролью SERVICE_CENTER

-- Пример создания пользователя-сервисного центра (выполнить отдельно):
-- INSERT INTO users (email, password, first_name, last_name, role, status, created_at, updated_at)
-- VALUES ('service1@example.com', '$2a$10$...', 'Сервис', 'Центр 1', 'SERVICE_CENTER', 'ACTIVE', NOW(), NOW());

-- После создания пользователей, выполните этот скрипт:

-- 1. Автосервис "АвтоМастер" в Алматы
INSERT INTO service_centers (
    user_id, 
    name, 
    address, 
    city, 
    region, 
    latitude, 
    longitude, 
    phone_number, 
    email, 
    website, 
    description, 
    status, 
    license_number, 
    rating, 
    review_count, 
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'service1@example.com' LIMIT 1),
    'АвтоМастер',
    'ул. Абая, 150',
    'Алматы',
    'Алматинская область',
    43.2220,
    76.8512,
    '+7 (727) 123-45-67',
    'info@automaster.kz',
    'https://automaster.kz',
    'Полный спектр услуг по обслуживанию и ремонту автомобилей. Диагностика, ТО, ремонт двигателя, подвески, тормозов.',
    'ACTIVE',
    'SC-ALM-001',
    4.5,
    127,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 2. Автосервис "ТехноСервис" в Астане
INSERT INTO service_centers (
    user_id, 
    name, 
    address, 
    city, 
    region, 
    latitude, 
    longitude, 
    phone_number, 
    email, 
    website, 
    description, 
    status, 
    license_number, 
    rating, 
    review_count, 
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'service2@example.com' LIMIT 1),
    'ТехноСервис',
    'пр. Кабанбай батыра, 12',
    'Астана',
    'Акмолинская область',
    51.1694,
    71.4491,
    '+7 (7172) 456-78-90',
    'info@technoservice.kz',
    'https://technoservice.kz',
    'Современный автосервис с новейшим оборудованием. Специализация: немецкие и японские автомобили.',
    'ACTIVE',
    'SC-AST-002',
    4.7,
    89,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 3. Автосервис "Быстрый Ремонт" в Шымкенте
INSERT INTO service_centers (
    user_id, 
    name, 
    address, 
    city, 
    region, 
    latitude, 
    longitude, 
    phone_number, 
    email, 
    website, 
    description, 
    status, 
    license_number, 
    rating, 
    review_count, 
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'service3@example.com' LIMIT 1),
    'Быстрый Ремонт',
    'ул. Тауке хана, 45',
    'Шымкент',
    'Туркестанская область',
    42.3419,
    69.5901,
    '+7 (7252) 789-01-23',
    'info@fastrepair.kz',
    NULL,
    'Экспресс-ремонт и обслуживание. Гарантия качества. Работаем без выходных.',
    'ACTIVE',
    'SC-SHY-003',
    4.3,
    56,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 4. Автосервис "Профи Авто" в Караганде
INSERT INTO service_centers (
    user_id, 
    name, 
    address, 
    city, 
    region, 
    latitude, 
    longitude, 
    phone_number, 
    email, 
    website, 
    description, 
    status, 
    license_number, 
    rating, 
    review_count, 
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'service4@example.com' LIMIT 1),
    'Профи Авто',
    'ул. Бухар жырау, 78',
    'Караганда',
    'Карагандинская область',
    49.8014,
    73.1059,
    '+7 (7212) 234-56-78',
    'info@profiauto.kz',
    'https://profiauto.kz',
    'Профессиональное обслуживание всех марок автомобилей. Шиномонтаж, покраска, кузовной ремонт.',
    'ACTIVE',
    'SC-KAR-004',
    4.6,
    203,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 5. Автосервис "Мотор Ленд" в Актобе
INSERT INTO service_centers (
    user_id, 
    name, 
    address, 
    city, 
    region, 
    latitude, 
    longitude, 
    phone_number, 
    email, 
    website, 
    description, 
    status, 
    license_number, 
    rating, 
    review_count, 
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'service5@example.com' LIMIT 1),
    'Мотор Ленд',
    'пр. Абиша Кекилбаева, 23',
    'Актобе',
    'Актюбинская область',
    50.2800,
    57.2100,
    '+7 (7132) 345-67-89',
    'info@motorland.kz',
    NULL,
    'Качественный ремонт двигателей и трансмиссии. Оригинальные запчасти. Гарантия.',
    'ACTIVE',
    'SC-AKT-005',
    4.4,
    78,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;
