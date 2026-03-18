-- Add soft-delete columns to groups
BEGIN;

ALTER TABLE IF EXISTS groups
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

ALTER TABLE IF EXISTS groups
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

COMMIT;
