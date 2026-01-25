CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    amount_cents INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELED')),
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('PIX', 'BOLETO', 'CREDIT_CARD')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP,
    gateway VARCHAR(20) NOT NULL DEFAULT 'ASAAS',
    gateway_payment_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date) WHERE status IN ('PENDING', 'OVERDUE');
CREATE INDEX idx_payments_gateway ON payments(gateway, gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;

COMMENT ON TABLE payments IS 'Pagamentos das assinaturas';
COMMENT ON COLUMN payments.amount_cents IS 'Valor em centavos';
