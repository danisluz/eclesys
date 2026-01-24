CREATE TABLE ministry_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(60) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ministry_types_tenant ON ministry_types(tenant_id);
CREATE INDEX idx_ministry_types_sort ON ministry_types(tenant_id, sort_order);

COMMENT ON TABLE ministry_types IS 'Tipos de ministérios: Jovens, Missões, Música, Crianças, etc';
