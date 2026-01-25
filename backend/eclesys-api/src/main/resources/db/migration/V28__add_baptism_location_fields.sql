-- V28: Adicionar campos de igreja e local do batismo

ALTER TABLE members ADD COLUMN baptism_church VARCHAR(255);
ALTER TABLE members ADD COLUMN baptism_location VARCHAR(255);

COMMENT ON COLUMN members.baptism_church IS 'Nome da igreja onde o membro foi batizado';
COMMENT ON COLUMN members.baptism_location IS 'Local (cidade/estado) onde o membro foi batizado';
