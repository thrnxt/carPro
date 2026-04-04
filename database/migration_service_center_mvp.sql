-- Миграция MVP модуля сервисного центра
-- PostgreSQL, идемпотентный скрипт

-- 1) Связка "сервисный центр <-> клиент" и клиентский статус
CREATE TABLE IF NOT EXISTS service_center_clients (
    id BIGSERIAL PRIMARY KEY,
    service_center_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    total_visits INTEGER NOT NULL DEFAULT 0,
    last_service_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_service_center_client UNIQUE (service_center_id, client_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_scc_service_center'
    ) THEN
        ALTER TABLE service_center_clients
            ADD CONSTRAINT fk_scc_service_center
            FOREIGN KEY (service_center_id) REFERENCES service_centers(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_scc_client'
    ) THEN
        ALTER TABLE service_center_clients
            ADD CONSTRAINT fk_scc_client
            FOREIGN KEY (client_id) REFERENCES users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scc_service_center ON service_center_clients(service_center_id);
CREATE INDEX IF NOT EXISTS idx_scc_client ON service_center_clients(client_id);

-- 2) Расширение таблицы invoices под сервис-центр / авто / клиента / статус / валюту / позиции
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS service_center_id BIGINT;

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS car_id BIGINT;

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS client_id BIGINT;

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10);

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS status VARCHAR(20);

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS items TEXT;

UPDATE invoices
SET currency = 'KZT'
WHERE currency IS NULL OR TRIM(currency) = '';

UPDATE invoices
SET status = 'CREATED'
WHERE status IS NULL OR TRIM(status) = '';

ALTER TABLE invoices
    ALTER COLUMN currency SET DEFAULT 'KZT';

ALTER TABLE invoices
    ALTER COLUMN status SET DEFAULT 'CREATED';

ALTER TABLE invoices
    ALTER COLUMN currency SET NOT NULL;

ALTER TABLE invoices
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE invoices
    ALTER COLUMN maintenance_record_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_invoices_service_center'
    ) THEN
        ALTER TABLE invoices
            ADD CONSTRAINT fk_invoices_service_center
            FOREIGN KEY (service_center_id) REFERENCES service_centers(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_invoices_car'
    ) THEN
        ALTER TABLE invoices
            ADD CONSTRAINT fk_invoices_car
            FOREIGN KEY (car_id) REFERENCES cars(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_invoices_client'
    ) THEN
        ALTER TABLE invoices
            ADD CONSTRAINT fk_invoices_client
            FOREIGN KEY (client_id) REFERENCES users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_service_center ON invoices(service_center_id);
CREATE INDEX IF NOT EXISTS idx_invoices_car ON invoices(car_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
