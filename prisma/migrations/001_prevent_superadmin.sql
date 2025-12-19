-- Prevent superadmin role creation at database level
-- This constraint blocks any attempt to create or update a user with superadmin role

-- SQLite doesn't support CHECK constraints with NOT IN directly on existing tables
-- So we'll use a different approach by creating a trigger

-- First, create a function-like trigger to validate role before insert/update
CREATE TRIGGER prevent_superadmin_insert
BEFORE INSERT ON users
FOR EACH ROW
WHEN NEW.role = 'superadmin' OR NEW.role = 'Superadmin' OR NEW.role = 'SUPERADMIN'
BEGIN
  SELECT RAISE(ABORT, 'Superadmin role creation is not allowed');
END;

CREATE TRIGGER prevent_superadmin_update
BEFORE UPDATE ON users
FOR EACH ROW
WHEN NEW.role = 'superadmin' OR NEW.role = 'Superadmin' OR NEW.role = 'SUPERADMIN'
BEGIN
  SELECT RAISE(ABORT, 'Superadmin role assignment is not allowed');
END;