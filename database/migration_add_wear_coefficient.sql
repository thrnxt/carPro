-- Миграция: Добавление поля wear_coefficient в таблицу car_components
-- Выполнить эту миграцию для существующих баз данных
-- Важно: выполнять по шагам, чтобы избежать ошибки с NOT NULL на существующих записях

-- Шаг 1: Добавляем колонку как nullable
ALTER TABLE car_components 
ADD COLUMN IF NOT EXISTS wear_coefficient DOUBLE PRECISION;

-- Шаг 2: Обновляем существующие записи значением по умолчанию
UPDATE car_components 
SET wear_coefficient = 1.0 
WHERE wear_coefficient IS NULL;

-- Шаг 3: Устанавливаем значение по умолчанию для новых записей
ALTER TABLE car_components 
ALTER COLUMN wear_coefficient SET DEFAULT 1.0;

-- Шаг 4: Теперь можно установить NOT NULL (после обновления всех записей)
ALTER TABLE car_components 
ALTER COLUMN wear_coefficient SET NOT NULL;
