CREATE TABLE member_church_role_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    member_id UUID NOT NULL REFERENCES members(id),
    church_role_id UUID NOT NULL REFERENCES church_roles(id),
    start_at DATE NOT NULL,
    end_at DATE,
    changed_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_role_history_tenant ON member_church_role_history(tenant_id);
CREATE INDEX idx_member_role_history_member ON member_church_role_history(member_id);
CREATE INDEX idx_member_role_history_dates ON member_church_role_history(member_id, start_at, end_at);

COMMENT ON TABLE member_church_role_history IS 'Histórico de mudanças de cargo eclesiástico dos membros';
COMMENT ON COLUMN member_church_role_history.end_at IS 'NULL = ainda ativo neste cargo';
