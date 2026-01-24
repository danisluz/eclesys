CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED')),
    started_at TIMESTAMP NOT NULL,
    trial_ends_at TIMESTAMP,
    next_billing_at TIMESTAMP,
    gateway VARCHAR(20) NOT NULL DEFAULT 'ASAAS',
    gateway_subscription_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_billing ON subscriptions(next_billing_at) WHERE status IN ('ACTIVE', 'PAST_DUE');
CREATE INDEX idx_subscriptions_gateway ON subscriptions(gateway, gateway_subscription_id) WHERE gateway_subscription_id IS NOT NULL;

COMMENT ON TABLE subscriptions IS 'Assinaturas dos tenants';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'Data de término do período de trial (se aplicável)';
