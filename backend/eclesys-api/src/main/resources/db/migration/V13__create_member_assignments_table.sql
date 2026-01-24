CREATE TABLE member_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    member_id UUID NOT NULL REFERENCES members(id),
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('UNIT', 'MINISTRY')),
    scope_id UUID NOT NULL,
    function_role_id UUID NOT NULL REFERENCES function_roles(id),
    start_at DATE NOT NULL,
    end_at DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_assignments_tenant ON member_assignments(tenant_id);
CREATE INDEX idx_member_assignments_member ON member_assignments(member_id);
CREATE INDEX idx_member_assignments_scope ON member_assignments(scope_type, scope_id);
CREATE INDEX idx_member_assignments_function ON member_assignments(function_role_id);
CREATE INDEX idx_member_assignments_active ON member_assignments(member_id, status) WHERE status = 'ACTIVE';

COMMENT ON TABLE member_assignments IS 'Vínculo de membros com funções em unidades organizacionais ou ministérios';
COMMENT ON COLUMN member_assignments.scope_type IS 'Tipo de escopo: UNIT (unidade org) ou MINISTRY (ministério)';
COMMENT ON COLUMN member_assignments.scope_id IS 'ID da unidade organizacional ou ministério (polymorphic)';
COMMENT ON COLUMN member_assignments.end_at IS 'NULL = ainda ativo na função';
