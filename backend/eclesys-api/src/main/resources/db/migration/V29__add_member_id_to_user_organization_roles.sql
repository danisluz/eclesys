-- Adiciona suporte para membros (não apenas usuários) terem cargos organizacionais
ALTER TABLE user_organization_roles
ADD COLUMN member_id UUID;

-- Permite user_id ser null (mas member_id ou user_id devem existir)
ALTER TABLE user_organization_roles
ALTER COLUMN user_id DROP NOT NULL;

-- Adiciona FK para members
ALTER TABLE user_organization_roles
ADD CONSTRAINT fk_user_org_roles_member
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- Adiciona índice para member_id
CREATE INDEX idx_user_org_roles_member ON user_organization_roles(member_id);

-- Adiciona constraint para garantir que pelo menos um (user_id ou member_id) existe
ALTER TABLE user_organization_roles
ADD CONSTRAINT chk_user_or_member CHECK (
  (user_id IS NOT NULL AND member_id IS NULL) OR
  (user_id IS NULL AND member_id IS NOT NULL)
);

COMMENT ON COLUMN user_organization_roles.member_id IS 'ID do membro da igreja (quando o cargo é atribuído a um membro)';
