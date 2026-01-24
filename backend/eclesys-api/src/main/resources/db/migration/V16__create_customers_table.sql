CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
    name VARCHAR(180) NOT NULL,
    email VARCHAR(180) NOT NULL,
    document VARCHAR(20),
    gateway VARCHAR(20) NOT NULL DEFAULT 'ASAAS',
    gateway_customer_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_gateway ON customers(gateway, gateway_customer_id) WHERE gateway_customer_id IS NOT NULL;

COMMENT ON TABLE customers IS 'Dados de cobrança do tenant (um customer por tenant)';
COMMENT ON COLUMN customers.document IS 'CPF ou CNPJ';
COMMENT ON COLUMN customers.gateway_customer_id IS 'ID do cliente no gateway de pagamento (ex: Asaas)';
