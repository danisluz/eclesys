CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    performed_by_user_id UUID REFERENCES users(id),
    metadata JSONB,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(tenant_id, entity, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(performed_by_user_id) WHERE performed_by_user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(tenant_id, performed_at DESC);

COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as ações importantes do sistema';
COMMENT ON COLUMN audit_logs.action IS 'Ex: CREATE_MEMBER, UPDATE_MEMBER, TRANSFER_MEMBER, DELETE_USER, etc';
COMMENT ON COLUMN audit_logs.entity IS 'Ex: MEMBER, USER, UNIT, MINISTRY, SUBSCRIPTION, etc';
COMMENT ON COLUMN audit_logs.metadata IS 'Dados adicionais da ação em formato JSON';
