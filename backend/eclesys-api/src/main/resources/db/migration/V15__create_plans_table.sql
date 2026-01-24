CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(60) NOT NULL,
    price_cents INT NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_code ON plans(code);
CREATE INDEX idx_plans_active ON plans(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis: FREE, PRO, ENTERPRISE';
COMMENT ON COLUMN plans.price_cents IS 'Preço em centavos (ex: 9990 = R$ 99,90)';
