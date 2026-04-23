-- ============================================================
--  Seed availability slots for all lecturers
--  3 slots per working day × 14 working days × 14 lecturers
--  Run: mysql -u root -proot unilink < seed_availability_slots.sql
-- ============================================================

USE unilink;

-- Clear existing slots
DELETE FROM availability_slots;

-- Generate slots using a stored procedure
DROP PROCEDURE IF EXISTS seed_slots;

DELIMITER $$

CREATE PROCEDURE seed_slots()
BEGIN
    DECLARE lecturer_id BIGINT;
    DECLARE slot_date DATE;
    DECLARE days_added INT;
    DECLARE cur_date DATE;
    DECLARE day_of_week INT;

    -- Lecturer IDs in the system
    DECLARE lecturer_cursor CURSOR FOR
        SELECT id FROM users WHERE role = 'LECTURER';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET @done = 1;

    OPEN lecturer_cursor;

    lecturer_loop: LOOP
        SET @done = 0;
        FETCH lecturer_cursor INTO lecturer_id;
        IF @done = 1 THEN LEAVE lecturer_loop; END IF;

        SET days_added = 0;
        SET cur_date = CURDATE();

        -- Generate 14 working days of slots
        WHILE days_added < 14 DO
            SET day_of_week = DAYOFWEEK(cur_date); -- 1=Sun, 2=Mon ... 7=Sat
            IF day_of_week BETWEEN 2 AND 6 THEN  -- Mon-Fri only
                -- Morning slot 09:00
                INSERT INTO availability_slots
                    (lecturer_id, slot_date, start_time, end_time, status, is_available, mode)
                VALUES
                    (lecturer_id, cur_date, '09:00:00', '09:30:00', 'AVAILABLE', 1, 'Physical');

                -- Morning slot 10:00
                INSERT INTO availability_slots
                    (lecturer_id, slot_date, start_time, end_time, status, is_available, mode)
                VALUES
                    (lecturer_id, cur_date, '10:00:00', '10:30:00', 'AVAILABLE', 1, 'Physical');

                -- Afternoon slot 14:00
                INSERT INTO availability_slots
                    (lecturer_id, slot_date, start_time, end_time, status, is_available, mode)
                VALUES
                    (lecturer_id, cur_date, '14:00:00', '14:30:00', 'AVAILABLE', 1, 'Online');

                SET days_added = days_added + 1;
            END IF;
            SET cur_date = DATE_ADD(cur_date, INTERVAL 1 DAY);
        END WHILE;

    END LOOP;

    CLOSE lecturer_cursor;
END$$

DELIMITER ;

CALL seed_slots();
DROP PROCEDURE IF EXISTS seed_slots;

SELECT CONCAT('Inserted ', COUNT(*), ' availability slots for ', COUNT(DISTINCT lecturer_id), ' lecturers') AS result
FROM availability_slots;
