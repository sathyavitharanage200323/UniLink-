-- Add ADMIN role support to existing UniLink databases.
-- Run this in the `unilink` database before starting the backend.

ALTER TABLE users
  MODIFY COLUMN role ENUM('STUDENT','LECTURER','ADMIN') NOT NULL;
