-- Add nomenclature labels to organization_units
-- These fields are used only in CHURCH type (root) to define labels for the entire hierarchy
ALTER TABLE organization_units ADD COLUMN sector_label VARCHAR(50);
ALTER TABLE organization_units ADD COLUMN congregation_label VARCHAR(50);

COMMENT ON COLUMN organization_units.sector_label IS 'Custom label for SECTOR level (e.g., Setor, Distrito, Região). Only set on CHURCH type.';
COMMENT ON COLUMN organization_units.congregation_label IS 'Custom label for CONGREGATION level (e.g., Congregação, Ponto de Pregação, Missão). Only set on CHURCH type.';
