CREATE TABLE organization_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('CHURCH', 'SECTOR', 'CONGREGATION')),
    name VARCHAR(120) NOT NULL,
    code VARCHAR(60),
    parent_id UUID REFERENCES organization_units(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organization_units_tenant ON organization_units(tenant_id);
CREATE INDEX idx_organization_units_parent ON organization_units(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_organization_units_type ON organization_units(tenant_id, type);

COMMENT ON TABLE organization_units IS 'Unidades organizacionais hierárquicas: Igreja -> Setores -> Congregações';
COMMENT ON COLUMN organization_units.parent_id IS 'CHURCH não tem pai (null), SECTOR tem CHURCH como pai, CONGREGATION tem SECTOR como pai';
