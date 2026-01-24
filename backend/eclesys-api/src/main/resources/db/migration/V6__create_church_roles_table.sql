CREATE TABLE church_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(60) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_church_roles_tenant ON church_roles(tenant_id);
CREATE INDEX idx_church_roles_sort ON church_roles(tenant_id, sort_order);

COMMENT ON TABLE church_roles IS 'Cargos eclesiásticos: Membro, Diácono, Pastor, etc';
COMMENT ON COLUMN church_roles.sort_order IS 'Ordem para exibição/hierarquia';
