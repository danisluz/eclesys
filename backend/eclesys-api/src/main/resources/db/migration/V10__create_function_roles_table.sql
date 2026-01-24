CREATE TABLE function_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(60) NOT NULL,
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('UNIT', 'MINISTRY', 'BOTH')),
    max_holders INT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_function_roles_tenant ON function_roles(tenant_id);
CREATE INDEX idx_function_roles_scope ON function_roles(tenant_id, scope_type);

COMMENT ON TABLE function_roles IS 'Funções/papéis: Líder, Secretário, Tesoureiro, etc';
COMMENT ON COLUMN function_roles.scope_type IS 'Onde a função pode ser aplicada: UNIT (unidades org), MINISTRY (ministérios), BOTH';
COMMENT ON COLUMN function_roles.max_holders IS 'Limite de pessoas nesta função (1 para líder, 2 para secretários, NULL = ilimitado)';
