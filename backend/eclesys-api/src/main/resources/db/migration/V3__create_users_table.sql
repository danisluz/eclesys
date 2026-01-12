create table users (
                       id uuid primary key,
                       tenant_id uuid not null references tenants(id),
                       name varchar(120) not null,
                       email varchar(180) not null,
                       password_hash varchar(255) not null,
                       role varchar(30) not null,
                       is_active boolean not null default true,
                       created_at timestamp not null default now(),
                       updated_at timestamp not null default now(),
                       constraint uk_users_tenant_email unique (tenant_id, email)
);

create index idx_users_tenant_id on users(tenant_id);
create index idx_users_tenant_email on users(tenant_id, email);
