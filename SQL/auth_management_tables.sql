-- UniLink Auth + Student/Lecturer Management Tables
-- Run this inside your existing `unilink` database.

-- 1) Add auth + contact fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- 2) Student profile table
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id BIGINT NOT NULL,
  registration_number VARCHAR(50) NOT NULL,
  batch VARCHAR(50) NULL,
  academic_year VARCHAR(20) NULL,
  semester VARCHAR(20) NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_student_registration_number (registration_number),
  CONSTRAINT fk_student_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Lecturer profile table
CREATE TABLE IF NOT EXISTS lecturer_profiles (
  user_id BIGINT NOT NULL,
  employee_code VARCHAR(50) NOT NULL,
  office_location VARCHAR(100) NULL,
  office_hours VARCHAR(100) NULL,
  bio VARCHAR(1000) NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_lecturer_employee_code (employee_code),
  CONSTRAINT fk_lecturer_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
