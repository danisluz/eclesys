CREATE TABLE user_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    unit_id UUID NOT NULL REFERENCES organization_units(id),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_assignments UNIQUE (user_id, unit_id, role)
);

CREATE INDEX idx_user_assignments_tenant ON user_assignments(tenant_id);
CREATE INDEX idx_user_assignments_user ON user_assignments(user_id);
CREATE INDEX idx_user_assignments_unit ON user_assignments(unit_id);

COMMENT ON TABLE user_assignments IS 'Atribuições de usuários às unidades organizacionais';
COMMENT ON COLUMN user_assignments.role IS 'Roles: CHURCH_ADMIN, SECTOR_MANAGER, CONGREGATION_LEADER, SECRETARY, VIEWER';
COMMENT ON CONSTRAINT uk_user_assignments ON user_assignments IS 'Previne duplicação: um usuário não pode ter a mesma role na mesma unit';
