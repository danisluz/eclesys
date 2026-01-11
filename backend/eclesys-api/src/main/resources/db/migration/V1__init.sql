create extension if not exists "uuid-ossp";

create table tenant (
  id uuid primary key default uuid_generate_v4(),
  name varchar(120) not null,
  created_at timestamp not null default now()
);

create table congregation (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenant(id),
  name varchar(120) not null,
  created_at timestamp not null default now()
);
