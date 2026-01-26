-- Remove a constraint única antiga
ALTER TABLE user_organization_roles
DROP CONSTRAINT IF EXISTS user_organization_roles_user_id_organization_unit_id_role_key;

-- Adiciona coluna function_role_id
ALTER TABLE user_organization_roles
ADD COLUMN function_role_id UUID;

-- Adiciona FK para function_roles
ALTER TABLE user_organization_roles
ADD CONSTRAINT fk_user_org_roles_function_role
FOREIGN KEY (function_role_id) REFERENCES function_roles(id) ON DELETE RESTRICT;

-- Adiciona índice para performance
CREATE INDEX idx_user_org_roles_function ON user_organization_roles(function_role_id);

COMMENT ON COLUMN user_organization_roles.function_role_id IS 'ID da função administrativa (FunctionRole)';
