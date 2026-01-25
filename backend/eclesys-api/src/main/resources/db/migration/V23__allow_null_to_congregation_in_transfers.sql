-- Remove NOT NULL constraint from to_congregation_id to allow external transfers
ALTER TABLE members_transfers ALTER COLUMN to_congregation_id DROP NOT NULL;

-- Update index to handle nulls
DROP INDEX IF EXISTS idx_members_transfers_to;
CREATE INDEX idx_members_transfers_to ON members_transfers(to_congregation_id) WHERE to_congregation_id IS NOT NULL;

COMMENT ON COLUMN members_transfers.to_congregation_id IS 'Null quando é transferência externa (para outra igreja/cidade)';
