ALTER TABLE organization_units
  ADD COLUMN contact_email VARCHAR(160),
  ADD COLUMN contact_phone VARCHAR(40),
  ADD COLUMN website VARCHAR(200),
  ADD COLUMN address VARCHAR(255);
