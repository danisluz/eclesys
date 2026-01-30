-- Adicionar status de presença e justificativa na Santa Ceia

ALTER TABLE communion_attendance
  ADD COLUMN attendance_status VARCHAR(12),
  ADD COLUMN note VARCHAR(500);

UPDATE communion_attendance
SET attendance_status = CASE
  WHEN present IS TRUE THEN 'PRESENT'
  ELSE 'ABSENT'
END
WHERE attendance_status IS NULL;

ALTER TABLE communion_attendance
  ALTER COLUMN attendance_status SET NOT NULL;

ALTER TABLE communion_attendance
  ADD CONSTRAINT communion_attendance_status_check
  CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'JUSTIFIED'));
