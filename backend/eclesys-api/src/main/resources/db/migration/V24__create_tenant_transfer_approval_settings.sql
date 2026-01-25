-- Tabela de configurações de aprovação por tenant
CREATE TABLE tenant_transfer_approval_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
    
    -- Configurações de aprovação para cada tipo de transferência
    internal_same_sector_approval VARCHAR(50) NOT NULL DEFAULT 'SECRETARY_SECTOR',
    internal_cross_sector_approval VARCHAR(50) NOT NULL DEFAULT 'SECRETARY_CHURCH',
    external_approval VARCHAR(50) NOT NULL DEFAULT 'SECRETARY_CHURCH',
    
    -- Configurações adicionais
    require_justification_on_rejection BOOLEAN NOT NULL DEFAULT true,
    allow_requester_cancel BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_transfer_settings_tenant ON tenant_transfer_approval_settings(tenant_id);

COMMENT ON TABLE tenant_transfer_approval_settings IS 'Configurações de workflow de aprovação de transferências por tenant';
COMMENT ON COLUMN tenant_transfer_approval_settings.internal_same_sector_approval IS 'Quem aprova transferências dentro do mesmo setor: AUTO, SECRETARY_CONGREGATION, SECRETARY_SECTOR, SECRETARY_CHURCH, ADMIN';
COMMENT ON COLUMN tenant_transfer_approval_settings.internal_cross_sector_approval IS 'Quem aprova transferências entre setores: SECRETARY_SECTOR, SECRETARY_CHURCH, ADMIN';
COMMENT ON COLUMN tenant_transfer_approval_settings.external_approval IS 'Quem aprova transferências externas: SECRETARY_CHURCH, ADMIN';

-- Criar configuração padrão para todos os tenants existentes
INSERT INTO tenant_transfer_approval_settings (tenant_id, internal_same_sector_approval, internal_cross_sector_approval, external_approval)
SELECT id, 'SECRETARY_SECTOR', 'SECRETARY_CHURCH', 'SECRETARY_CHURCH'
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;
