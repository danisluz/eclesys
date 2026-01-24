CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    full_name VARCHAR(180) NOT NULL,
    email VARCHAR(180),
    phone VARCHAR(20),
    document VARCHAR(20),
    birth_date DATE,
    baptism_date DATE,
    address JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED')),
    church_role_id UUID REFERENCES church_roles(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_tenant ON members(tenant_id);
CREATE INDEX idx_members_tenant_status ON members(tenant_id, status);
CREATE INDEX idx_members_church_role ON members(church_role_id) WHERE church_role_id IS NOT NULL;
CREATE INDEX idx_members_full_name ON members(tenant_id, full_name);

COMMENT ON TABLE members IS 'Membros da igreja';
COMMENT ON COLUMN members.address IS 'Endereço em formato JSON (futuro)';
COMMENT ON COLUMN members.status IS 'Status do membro na igreja';
