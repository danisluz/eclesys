-- Tabela de roles de usuários em unidades organizacionais
CREATE TABLE user_organization_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    organization_unit_id UUID NOT NULL REFERENCES organization_units(id),
    role VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, organization_unit_id, role)
);

CREATE INDEX idx_user_org_roles_user ON user_organization_roles(user_id);
CREATE INDEX idx_user_org_roles_org ON user_organization_roles(organization_unit_id);
CREATE INDEX idx_user_org_roles_role ON user_organization_roles(role);

COMMENT ON TABLE user_organization_roles IS 'Roles de usuários em unidades organizacionais específicas';
COMMENT ON COLUMN user_organization_roles.role IS 'SECRETARY, LEADER, TREASURER, etc';
