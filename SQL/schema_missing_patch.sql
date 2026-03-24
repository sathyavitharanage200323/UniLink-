-- ============================================================
-- UniLink incremental schema patch (for existing databases)
-- Purpose: add missing columns/tables required by current backend entities
-- Compatible with MySQL 8.x
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_missing //
CREATE PROCEDURE add_column_if_missing(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_def  TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND COLUMN_NAME = p_column_name
    ) THEN
        SET @ddl = CONCAT(
            'ALTER TABLE `', p_table_name,
            '` ADD COLUMN `', p_column_name, '` ', p_column_def
        );
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

-- 1) users table missing auth/contact columns
CALL add_column_if_missing('users', 'password_hash', 'VARCHAR(255) NULL');
CALL add_column_if_missing('users', 'phone', 'VARCHAR(20) NULL');

-- 2) created_at columns expected by entities
CALL add_column_if_missing('appointments', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('chat_rooms', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('canned_responses', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

-- 3) student_discipline entity expects column name `type` (not discipline_type)
CALL add_column_if_missing('student_discipline', 'type', "ENUM('WARNING','TEMP_BLOCK','PERM_BLOCK') NULL");

-- If old column discipline_type exists, copy values into `type`
SET @has_old_disc_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'student_discipline'
      AND COLUMN_NAME = 'discipline_type'
);

SET @copy_sql := IF(
    @has_old_disc_col > 0,
    'UPDATE student_discipline SET `type` = discipline_type WHERE `type` IS NULL',
    'SELECT 1'
);
PREPARE stmt FROM @copy_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set `type` as NOT NULL after backfill
SET @null_type_count := (
    SELECT COUNT(*)
    FROM student_discipline
    WHERE `type` IS NULL
);

SET @tighten_type_sql := IF(
    @null_type_count = 0,
    "ALTER TABLE student_discipline MODIFY COLUMN `type` ENUM('WARNING','TEMP_BLOCK','PERM_BLOCK') NOT NULL",
    'SELECT 1'
);
PREPARE stmt FROM @tighten_type_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP PROCEDURE IF EXISTS add_column_if_missing //

DELIMITER ;

-- 4) missing profile tables used by auth/profile/management features
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

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Notes
-- 1) Existing sample users may have NULL password_hash after patch.
--    For login to work, set a bcrypt hash in users.password_hash.
-- 2) If you no longer need discipline_type after migration, you may drop it manually:
--    ALTER TABLE student_discipline DROP COLUMN discipline_type;
-- ============================================================
