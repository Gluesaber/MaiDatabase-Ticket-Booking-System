-- ============================================================
--  MIGRATION: Replace event_type column with EventTypes M2M
--  Run once against an existing ticketing database.
-- ============================================================

BEGIN;

-- 1. New tables
CREATE TABLE EventTypes (
    type_id   BIGSERIAL    PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE EventTypeMappings (
    event_id BIGINT NOT NULL REFERENCES Events(event_id)    ON DELETE CASCADE,
    type_id  BIGINT NOT NULL REFERENCES EventTypes(type_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, type_id)
);

CREATE INDEX idx_etm_event ON EventTypeMappings(event_id);
CREATE INDEX idx_etm_type  ON EventTypeMappings(type_id);

-- 2. Seed EventTypes from existing distinct event_type values
INSERT INTO EventTypes (type_name)
SELECT DISTINCT event_type FROM Events WHERE event_type IS NOT NULL
ORDER BY event_type;

-- 3. Migrate each event's existing single type into the mapping table
INSERT INTO EventTypeMappings (event_id, type_id)
SELECT e.event_id, et.type_id
FROM Events e
JOIN EventTypes et ON et.type_name = e.event_type;

-- 4. Reset the sequence
SELECT setval('eventtypes_type_id_seq', (SELECT MAX(type_id) FROM EventTypes));

-- 5. Drop old column
ALTER TABLE Events DROP COLUMN event_type;

COMMIT;
