-- ============================================================
-- Миграция: Трекинг пробега
-- Описание: Добавляет поля для расчётного пробега и напоминаний
-- Примечание: При ddl-auto=update Hibernate применяет это автоматически.
--             Этот скрипт — для ручного применения на production БД.
-- ============================================================

ALTER TABLE cars
    -- Как часто пользователь использует авто (RARELY / NORMAL / ACTIVE)
    ADD COLUMN IF NOT EXISTS driving_frequency VARCHAR(20),

    -- Расчётный пробег (обновляется ежедневно шедуллером)
    ADD COLUMN IF NOT EXISTS estimated_mileage BIGINT,

    -- true = расчётный пробег приблизительный, показывать «~» на UI
    ADD COLUMN IF NOT EXISTS mileage_is_estimated BOOLEAN NOT NULL DEFAULT FALSE,

    -- Когда пользователь последний раз подтвердил/ввёл реальный пробег
    ADD COLUMN IF NOT EXISTS confirmed_mileage_at TIMESTAMP,

    -- Когда последний раз отправляли напоминание об уточнении пробега
    ADD COLUMN IF NOT EXISTS mileage_reminder_sent_at TIMESTAMP;

-- Индекс для быстрого поиска авто, которым нужно напоминание
CREATE INDEX IF NOT EXISTS idx_cars_mileage_reminder
    ON cars (driving_frequency, confirmed_mileage_at, mileage_reminder_sent_at)
    WHERE driving_frequency IS NOT NULL;

-- ============================================================
-- Ключевые значения DrivingFrequency:
--   RARELY  → 17 км/день (~500 км/мес)  — магазин, иногда в гости
--   NORMAL  → 50 км/день (~1 500 км/мес) — работа, поездки по городу
--   ACTIVE  → 100 км/день (~3 000 км/мес) — командировки, трассы
--
-- Формула расчёта estimatedMileage (выполняется шедуллером ежедневно):
--   estimated_mileage = mileage + (km_per_day × DATEDIFF(NOW(), confirmed_mileage_at))
-- ============================================================
