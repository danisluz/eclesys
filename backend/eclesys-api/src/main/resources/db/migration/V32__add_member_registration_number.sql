-- Adiciona matrícula sequencial por tenant

ALTER TABLE members ADD COLUMN registration_number INTEGER;

-- Preencher matrícula dos membros existentes por tenant
WITH ranked AS (
    SELECT
        id,
        tenant_id,
        ROW_NUMBER() OVER (
            PARTITION BY tenant_id
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM members
)
UPDATE members m
SET registration_number = r.rn
FROM ranked r
WHERE m.id = r.id;

ALTER TABLE members
    ALTER COLUMN registration_number SET NOT NULL;

ALTER TABLE members
    ADD CONSTRAINT members_registration_number_positive CHECK (registration_number > 0);

ALTER TABLE members
    ADD CONSTRAINT members_tenant_registration_unique UNIQUE (tenant_id, registration_number);

-- Controle de sequência por tenant
CREATE TABLE member_registration_sequences (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    next_number INTEGER NOT NULL CHECK (next_number > 0),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO member_registration_sequences (tenant_id, next_number)
SELECT
    t.id,
    COALESCE(m.max_reg, 0) + 1
FROM tenants t
LEFT JOIN (
    SELECT tenant_id, MAX(registration_number) AS max_reg
    FROM members
    GROUP BY tenant_id
) m ON m.tenant_id = t.id
ON CONFLICT (tenant_id) DO NOTHING;
