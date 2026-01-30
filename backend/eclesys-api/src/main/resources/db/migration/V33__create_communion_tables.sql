CREATE TABLE communion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    congregation_id UUID NOT NULL REFERENCES organization_units(id),
    event_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED')),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (congregation_id, event_date)
);

CREATE INDEX idx_communion_events_tenant ON communion_events(tenant_id);
CREATE INDEX idx_communion_events_congregation_date ON communion_events(congregation_id, event_date);
CREATE INDEX idx_communion_events_status ON communion_events(status);

CREATE TABLE communion_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    communion_event_id UUID NOT NULL REFERENCES communion_events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id),
    present BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_by_user_id UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    source VARCHAR(10) NOT NULL CHECK (source IN ('ONLINE', 'MANUAL', 'IMPORT')),
    UNIQUE (communion_event_id, member_id)
);

CREATE INDEX idx_communion_attendance_event ON communion_attendance(communion_event_id);
CREATE INDEX idx_communion_attendance_member ON communion_attendance(member_id);
