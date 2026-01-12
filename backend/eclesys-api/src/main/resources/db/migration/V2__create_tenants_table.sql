create table tenants (
                         id uuid primary key,
                         name varchar(120) not null,
                         tenant_code varchar(60) not null unique,
                         logo_url varchar(500),
                         is_active boolean not null default true,
                         created_at timestamp not null default now(),
                         updated_at timestamp not null default now()
);
