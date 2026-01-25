CREATE TABLE members_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    member_id UUID NOT NULL REFERENCES members(id),
    from_congregation_id UUID REFERENCES organization_units(id),
    to_congregation_id UUID NOT NULL REFERENCES organization_units(id),
    transferred_by_user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_transfers_tenant ON members_transfers(tenant_id);
CREATE INDEX idx_members_transfers_member ON members_transfers(member_id);
CREATE INDEX idx_members_transfers_from ON members_transfers(from_congregation_id) WHERE from_congregation_id IS NOT NULL;
CREATE INDEX idx_members_transfers_to ON members_transfers(to_congregation_id);

COMMENT ON TABLE members_transfers IS 'Histórico de transferências de membros entre congregações';
COMMENT ON COLUMN members_transfers.from_congregation_id IS 'Pode ser null se é a primeira congregação do membro';
