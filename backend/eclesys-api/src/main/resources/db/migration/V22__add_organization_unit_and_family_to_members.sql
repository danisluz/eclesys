-- Adicionar congregação obrigatória e relacionamentos familiares

-- Adicionar coluna de unidade organizacional (congregação)
ALTER TABLE members ADD COLUMN organization_unit_id UUID REFERENCES organization_units(id);

-- Tornar obrigatório após popular dados existentes
-- UPDATE members SET organization_unit_id = (SELECT id FROM organization_units WHERE tenant_id = members.tenant_id AND type = 'CHURCH' LIMIT 1) WHERE organization_unit_id IS NULL;
-- ALTER TABLE members ALTER COLUMN organization_unit_id SET NOT NULL;

CREATE INDEX idx_members_organization_unit ON members(organization_unit_id);

-- Adicionar campos de relacionamento familiar
ALTER TABLE members ADD COLUMN spouse_id UUID REFERENCES members(id);
ALTER TABLE members ADD COLUMN father_id UUID REFERENCES members(id);
ALTER TABLE members ADD COLUMN mother_id UUID REFERENCES members(id);
ALTER TABLE members ADD COLUMN gender VARCHAR(1) CHECK (gender IN ('M', 'F'));
ALTER TABLE members ADD COLUMN marital_status VARCHAR(20) CHECK (marital_status IN ('SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED'));

CREATE INDEX idx_members_spouse ON members(spouse_id) WHERE spouse_id IS NOT NULL;
CREATE INDEX idx_members_father ON members(father_id) WHERE father_id IS NOT NULL;
CREATE INDEX idx_members_mother ON members(mother_id) WHERE mother_id IS NOT NULL;

COMMENT ON COLUMN members.organization_unit_id IS 'Congregação atual do membro';
COMMENT ON COLUMN members.spouse_id IS 'Cônjuge (referência a outro membro)';
COMMENT ON COLUMN members.father_id IS 'Pai (referência a outro membro)';
COMMENT ON COLUMN members.mother_id IS 'Mãe (referência a outro membro)';
COMMENT ON COLUMN members.gender IS 'Sexo: M=Masculino, F=Feminino';
COMMENT ON COLUMN members.marital_status IS 'Estado civil';
