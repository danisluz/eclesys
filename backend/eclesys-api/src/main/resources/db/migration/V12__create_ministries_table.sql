CREATE TABLE ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    ministry_type_id UUID NOT NULL REFERENCES ministry_types(id),
    unit_id UUID NOT NULL REFERENCES organization_units(id),
    name_override VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ministries_tenant ON ministries(tenant_id);
CREATE INDEX idx_ministries_type ON ministries(ministry_type_id);
CREATE INDEX idx_ministries_unit ON ministries(unit_id);

COMMENT ON TABLE ministries IS 'Instâncias de ministérios em unidades organizacionais específicas';
COMMENT ON COLUMN ministries.name_override IS 'Nome customizado opcional (caso queiram um nome diferente do tipo)';
