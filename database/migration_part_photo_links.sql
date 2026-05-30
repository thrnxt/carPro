-- Link maintenance photos to a concrete replaced component when the photo documents a part replacement.

ALTER TABLE maintenance_photos
    ADD COLUMN IF NOT EXISTS replaced_component_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_maintenance_photos_replaced_component'
    ) THEN
        ALTER TABLE maintenance_photos
            ADD CONSTRAINT fk_maintenance_photos_replaced_component
                FOREIGN KEY (replaced_component_id)
                REFERENCES replaced_components(id)
                ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_maintenance_photos_replaced_component_id
    ON maintenance_photos(replaced_component_id);
