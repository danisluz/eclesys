-- Script para zerar o banco de dados ECLESYS
-- Execute este script no pgAdmin, DBeaver ou outro cliente PostgreSQL

-- Desconectar sessões ativas (opcional, use se houver erro de "database is being accessed")
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'eclesys' AND pid <> pg_backend_pid();

-- Dropar todas as tabelas na ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS member_assignments CASCADE;
DROP TABLE IF EXISTS ministries CASCADE;
DROP TABLE IF EXISTS ministry_types CASCADE;
DROP TABLE IF EXISTS function_roles CASCADE;
DROP TABLE IF EXISTS member_church_role_history CASCADE;
DROP TABLE IF EXISTS members_transfers CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS church_roles CASCADE;
DROP TABLE IF EXISTS user_assignments CASCADE;
DROP TABLE IF EXISTS organization_units CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS flyway_schema_history CASCADE;

-- Mensagem de sucesso
SELECT 'Banco zerado com sucesso! Reinicie o backend para executar as migrations.' as status;
