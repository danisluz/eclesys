-- Migração de dados: converte enums antigos para function_role_id

-- Passo 1: Se a coluna role ainda existe, migrar os dados
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_organization_roles' AND column_name='role'
  ) THEN
    
    -- Mapeia SECRETARY -> Secretário(a)
    UPDATE user_organization_roles uor
    SET function_role_id = (
      SELECT id FROM function_roles fr 
      WHERE LOWER(fr.name) = 'secretário(a)' 
      LIMIT 1
    )
    WHERE uor.role = 'SECRETARY' AND uor.function_role_id IS NULL;

    -- Mapeia LEADER -> Líder
    UPDATE user_organization_roles uor
    SET function_role_id = (
      SELECT id FROM function_roles fr 
      WHERE LOWER(fr.name) = 'líder' 
      LIMIT 1
    )
    WHERE uor.role = 'LEADER' AND uor.function_role_id IS NULL;

    -- Mapeia TREASURER -> Tesoureiro (se existir)
    UPDATE user_organization_roles uor
    SET function_role_id = (
      SELECT id FROM function_roles fr 
      WHERE LOWER(fr.name) LIKE 'tesour%' 
      LIMIT 1
    )
    WHERE uor.role = 'TREASURER' AND uor.function_role_id IS NULL;

    -- Mapeia ASSISTANT -> auxiliar (se existir)
    UPDATE user_organization_roles uor
    SET function_role_id = (
      SELECT id FROM function_roles fr 
      WHERE LOWER(fr.name) LIKE '%auxiliar%' OR LOWER(fr.name) LIKE '%assistant%'
      LIMIT 1
    )
    WHERE uor.role = 'ASSISTANT' AND uor.function_role_id IS NULL;

    -- Remove a coluna role antiga se ainda não foi removida
    ALTER TABLE user_organization_roles DROP COLUMN IF EXISTS role;
    
  END IF;
END $$;

-- Passo 2: Garantir que function_role_id é NOT NULL
ALTER TABLE user_organization_roles
ALTER COLUMN function_role_id SET NOT NULL;

-- Passo 3: Adicionar índice se não existir
CREATE INDEX IF NOT EXISTS idx_user_org_roles_function ON user_organization_roles(function_role_id);

-- Passo 4: Adicionar constraint única se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_organization_roles_unique_assignment'
  ) THEN
    ALTER TABLE user_organization_roles
    ADD CONSTRAINT user_organization_roles_unique_assignment
    UNIQUE NULLS NOT DISTINCT (user_id, member_id, organization_unit_id, function_role_id);
  END IF;
END $$;
