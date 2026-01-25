ALTER TABLE organization_units 
ADD COLUMN is_headquarters BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN organization_units.is_headquarters IS 
'Marca se é sede: CHURCH sempre true, CONGREGATION pode ser sede de setor (true) ou congregação normal (false)';

CREATE INDEX idx_organization_units_headquarters 
ON organization_units(tenant_id, is_headquarters) 
WHERE is_headquarters = TRUE;

-- Atualizar todas as CHURCH existentes para is_headquarters = true
UPDATE organization_units 
SET is_headquarters = TRUE 
WHERE type = 'CHURCH';
