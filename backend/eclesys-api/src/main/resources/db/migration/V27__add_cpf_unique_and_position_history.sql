-- V27: Adicionar unique constraint no CPF e criar tabela de histórico de cargos eclesiásticos

-- Adicionar unique constraint no CPF (garantir que não haja duplicados)
-- Primeiro, vamos limpar possíveis duplicados existentes mantendo apenas o mais recente
WITH duplicates AS (
  SELECT id, document, created_at,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, document ORDER BY created_at DESC) as rn
  FROM members
  WHERE document IS NOT NULL AND document != ''
)
DELETE FROM members
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora adicionar o constraint unique
ALTER TABLE members ADD CONSTRAINT members_tenant_document_unique UNIQUE (tenant_id, document);

-- Criar índice para melhorar performance de busca por CPF
CREATE INDEX idx_members_document ON members(tenant_id, document) WHERE document IS NOT NULL;

-- Criar tabela de histórico de cargos eclesiásticos
CREATE TABLE member_position_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  -- Cargo anterior e novo
  old_position VARCHAR(50),
  new_position VARCHAR(50),
  
  -- Motivo da mudança
  reason TEXT,
  
  -- Quem fez a mudança
  changed_by_user_id UUID NOT NULL REFERENCES users(id),
  
  -- Data da mudança
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_position_history_member ON member_position_history(member_id, changed_at DESC);
CREATE INDEX idx_position_history_tenant ON member_position_history(tenant_id, changed_at DESC);

-- Comentários
COMMENT ON TABLE member_position_history IS 'Histórico de mudanças de cargo eclesiástico dos membros';
COMMENT ON COLUMN member_position_history.old_position IS 'Cargo anterior do membro';
COMMENT ON COLUMN member_position_history.new_position IS 'Novo cargo do membro';
COMMENT ON COLUMN member_position_history.reason IS 'Motivo da mudança de cargo';
COMMENT ON COLUMN member_position_history.changed_by_user_id IS 'Usuário que realizou a mudança';
COMMENT ON COLUMN member_position_history.changed_at IS 'Data e hora da mudança';
