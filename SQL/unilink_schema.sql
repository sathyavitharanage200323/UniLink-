-- ============================================================
--  UniLink — University Lecturer Appointment Booking System
--  Database Schema  |  MySQL 8.x compatible
--  Run this after creating the `unilink` database:
--      CREATE DATABASE IF NOT EXISTS unilink
--        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--      USE unilink;
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255)    NOT NULL,
    name                VARCHAR(255)    NOT NULL,
    role                ENUM('STUDENT','LECTURER') NOT NULL,
    department          VARCHAR(255)    DEFAULT NULL,
    expertise           VARCHAR(500)    DEFAULT NULL,
    do_not_disturb      TINYINT(1)      NOT NULL DEFAULT 0,
    auto_reply_message  TEXT            DEFAULT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. appointments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    student_id  BIGINT      NOT NULL,
    lecturer_id BIGINT      NOT NULL,
    start_time  DATETIME    NOT NULL,
    end_time    DATETIME    DEFAULT NULL,
    status      ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED')
                            NOT NULL DEFAULT 'PENDING',
    notes       TEXT        DEFAULT NULL,

    PRIMARY KEY (id),
    KEY idx_appt_student    (student_id),
    KEY idx_appt_lecturer   (lecturer_id),
    KEY idx_appt_status     (status),
    CONSTRAINT fk_appt_student  FOREIGN KEY (student_id)  REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_lecturer FOREIGN KEY (lecturer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. chat_rooms
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_rooms (
    id              BIGINT  NOT NULL AUTO_INCREMENT,
    appointment_id  BIGINT  NOT NULL,
    status          ENUM('OPEN','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
    resolved_at     DATETIME    DEFAULT NULL,
    resolved_by     BIGINT      DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_room_appointment (appointment_id),
    KEY idx_room_status (status),
    CONSTRAINT fk_room_appointment  FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
    CONSTRAINT fk_room_resolved_by  FOREIGN KEY (resolved_by)    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. chat_messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    room_id             BIGINT          NOT NULL,
    sender_id           BIGINT          NOT NULL,
    content             TEXT            DEFAULT NULL,
    filtered_content    TEXT            DEFAULT NULL,
    message_type        ENUM('TEXT','CODE','FILE','IMAGE','SYSTEM')
                                        NOT NULL DEFAULT 'TEXT',
    file_url            VARCHAR(1000)   DEFAULT NULL,
    file_name           VARCHAR(500)    DEFAULT NULL,
    is_read             TINYINT(1)      NOT NULL DEFAULT 0,
    read_at             DATETIME        DEFAULT NULL,
    is_pinned           TINYINT(1)      NOT NULL DEFAULT 0,
    is_marked_answer    TINYINT(1)      NOT NULL DEFAULT 0,
    is_deleted          TINYINT(1)      NOT NULL DEFAULT 0,
    profanity_flagged   TINYINT(1)      NOT NULL DEFAULT 0,
    sent_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_msg_room_time   (room_id, sent_at),
    KEY idx_msg_sender      (sender_id),
    KEY idx_msg_pinned      (room_id, is_pinned),
    CONSTRAINT fk_msg_room   FOREIGN KEY (room_id)   REFERENCES chat_rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users (id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. canned_responses  (lecturer quick-reply templates)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canned_responses (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    lecturer_id BIGINT          NOT NULL,
    title       VARCHAR(255)    NOT NULL,
    content     TEXT            NOT NULL,

    PRIMARY KEY (id),
    KEY idx_canned_lecturer (lecturer_id),
    CONSTRAINT fk_canned_lecturer FOREIGN KEY (lecturer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. student_discipline
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_discipline (
    id              BIGINT  NOT NULL AUTO_INCREMENT,
    student_id      BIGINT  NOT NULL,
    lecturer_id     BIGINT  NOT NULL,
    discipline_type ENUM('WARNING','TEMP_BLOCK','PERM_BLOCK') NOT NULL,
    reason          TEXT    DEFAULT NULL,
    expires_at      DATETIME DEFAULT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_disc_student    (student_id),
    KEY idx_disc_lecturer   (lecturer_id),
    KEY idx_disc_active     (student_id, lecturer_id, is_active),
    CONSTRAINT fk_disc_student  FOREIGN KEY (student_id)  REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_disc_lecturer FOREIGN KEY (lecturer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. typing_indicators
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typing_indicators (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    room_id     BIGINT      NOT NULL,
    is_typing   TINYINT(1)  NOT NULL DEFAULT 0,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_typing_user_room (user_id, room_id),
    KEY idx_typing_room (room_id),
    CONSTRAINT fk_typing_user FOREIGN KEY (user_id) REFERENCES users (id)       ON DELETE CASCADE,
    CONSTRAINT fk_typing_room FOREIGN KEY (room_id) REFERENCES chat_rooms (id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  SAMPLE DATA  (safe to rerun — INSERT IGNORE)
-- ============================================================

-- Users
INSERT IGNORE INTO users (id, email, name, role, department, expertise, do_not_disturb)
VALUES
  (1, 'amara.silva@university.edu',          'Dr. Amara Silva',     'LECTURER', 'Information Technology', 'Artificial Intelligence, Machine Learning', 0),
  (2, 'kavindu.perera@student.university.edu', 'Kavindu Perera',    'STUDENT',  'Information Technology', NULL, 0),
  (3, 'nimal.fernando@university.edu',       'Dr. Nimal Fernando',  'LECTURER', 'Computer Science',       'Data Structures, Algorithms', 0),
  (4, 'sithumi.rajapaksa@student.university.edu', 'Sithumi Rajapaksa', 'STUDENT', 'Computer Science',    NULL, 0),
  (5, 'priya.mendis@university.edu',         'Dr. Priya Mendis',    'LECTURER', 'Information Technology', 'Research Methodology, HCI', 0),
  (6, 'ashan.bandara@student.university.edu','Ashan Bandara',       'STUDENT',  'Information Technology', NULL, 0);

-- Appointments
INSERT IGNORE INTO appointments (id, student_id, lecturer_id, start_time, end_time, status, notes)
VALUES
  (101, 2, 1, DATE_ADD(NOW(), INTERVAL 1 HOUR),  DATE_ADD(NOW(), INTERVAL 2 HOUR),  'CONFIRMED', 'Final year project discussion'),
  (102, 4, 3, DATE_ADD(NOW(), INTERVAL 3 HOUR),  DATE_ADD(NOW(), INTERVAL 4 HOUR),  'CONFIRMED', 'Algorithm assignment review'),
  (103, 6, 5, DATE_ADD(NOW(), INTERVAL 26 HOUR), DATE_ADD(NOW(), INTERVAL 27 HOUR), 'PENDING',   'Research methodology guidance'),
  (104, 2, 3, DATE_ADD(NOW(), INTERVAL 48 HOUR), DATE_ADD(NOW(), INTERVAL 49 HOUR), 'PENDING',   'Data structures consultation');

-- Chat rooms (one per confirmed appointment)
INSERT IGNORE INTO chat_rooms (id, appointment_id, status)
VALUES
  (1, 101, 'OPEN'),
  (2, 102, 'OPEN');

-- Sample messages
INSERT IGNORE INTO chat_messages (id, room_id, sender_id, content, message_type, is_read)
VALUES
  (1, 1, 1, 'Hello Kavindu! I have reviewed the outline you submitted. Let us discuss the methodology today.',      'TEXT', 1),
  (2, 1, 2, 'Thank you Dr. Silva! I have a few questions about the data collection phase.',                          'TEXT', 1),
  (3, 1, 1, 'Of course. Please prepare a brief summary of your proposed approach and we can go from there.',         'TEXT', 1),
  (4, 1, 2, 'Will do! Here is the Python snippet I am using for data cleaning:\n```python\ndf.dropna(inplace=True)\ndf[''date''] = pd.to_datetime(df[''date''])\n```', 'CODE', 0),
  (5, 2, 3, 'Hi Sithumi, your assignment has been graded. Good work on the graph traversal section!',                'TEXT', 1),
  (6, 2, 4, 'Thank you Dr. Fernando! I struggled a bit with the Dijkstra implementation.',                           'TEXT', 0);

-- Canned responses for lecturers
INSERT IGNORE INTO canned_responses (lecturer_id, title, content)
VALUES
  (1, 'Thank you', 'Thank you for reaching out. I will review this and get back to you shortly.'),
  (1, 'Please resubmit', 'Please revise and resubmit with the corrections noted during our last session.'),
  (1, 'Confirm meeting', 'Your appointment has been confirmed. Please be ready 5 minutes before the scheduled time.'),
  (3, 'Assignment feedback', 'I have reviewed your submission. Please see my annotated comments in the feedback portal.'),
  (3, 'Office hours', 'I am available during office hours: Monday & Wednesday 2–4 PM in Room B204.');

-- ============================================================
--  Verification queries (run to confirm setup)
-- ============================================================
-- SELECT * FROM users;
-- SELECT * FROM appointments;
-- SELECT * FROM chat_rooms;
-- SELECT * FROM chat_messages;
