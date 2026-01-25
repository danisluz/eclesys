-- Adiciona status e campos de aprovação na tabela members_transfers
ALTER TABLE members_transfers ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE members_transfers ADD COLUMN requested_by_user_id UUID REFERENCES users(id);
ALTER TABLE members_transfers ADD COLUMN approved_by_user_id UUID REFERENCES users(id);
ALTER TABLE members_transfers ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE members_transfers ADD COLUMN rejection_reason TEXT;

-- Atualiza transferências existentes para status APPROVED (já foram executadas)
UPDATE members_transfers SET status = 'APPROVED', approved_by_user_id = transferred_by_user_id, approved_at = created_at;

-- Agora torna obrigatório o requested_by_user_id para novas transferências
ALTER TABLE members_transfers ALTER COLUMN requested_by_user_id SET NOT NULL;

CREATE INDEX idx_members_transfers_status ON members_transfers(status);
CREATE INDEX idx_members_transfers_requested_by ON members_transfers(requested_by_user_id);
CREATE INDEX idx_members_transfers_approved_by ON members_transfers(approved_by_user_id);

COMMENT ON COLUMN members_transfers.status IS 'Status da transferência: PENDING, APPROVED, REJECTED, CANCELLED';
COMMENT ON COLUMN members_transfers.requested_by_user_id IS 'Usuário que solicitou a transferência';
COMMENT ON COLUMN members_transfers.approved_by_user_id IS 'Usuário que aprovou ou rejeitou';
COMMENT ON COLUMN members_transfers.approved_at IS 'Data/hora da aprovação ou rejeição';
COMMENT ON COLUMN members_transfers.rejection_reason IS 'Motivo da rejeição (se rejeitada)';
