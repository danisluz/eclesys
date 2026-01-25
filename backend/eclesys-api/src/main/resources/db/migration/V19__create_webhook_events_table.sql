CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway VARCHAR(20) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    received_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_gateway ON webhook_events(gateway);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, received_at) WHERE processed = FALSE;
CREATE INDEX idx_webhook_events_type ON webhook_events(gateway, event_type);

COMMENT ON TABLE webhook_events IS 'Eventos recebidos via webhook dos gateways de pagamento';
COMMENT ON COLUMN webhook_events.processed IS 'Indica se o evento já foi processado pelo sistema';
