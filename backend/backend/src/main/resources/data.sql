-- Schema-compatible seed data for local development

INSERT INTO users (id, email, password_hash, name, role, department, phone, expertise, do_not_disturb, auto_reply_message, created_at)
VALUES
(1, 'nimal.perera@uoc.lk', '$2a$10$hKDVYxLefS6536Z7V4P6zehOOMD6U8vV4z.mOhD3rJ1A3rP/CrtwK', 'Dr. Nimal Perera', 'LECTURER', 'Computer Science', '+94771234567', 'Machine Learning, Artificial Intelligence', FALSE, NULL, CURRENT_TIMESTAMP),
(2, 'sanduni.fernando@sliit.lk', '$2a$10$hKDVYxLefS6536Z7V4P6zehOOMD6U8vV4z.mOhD3rJ1A3rP/CrtwK', 'Prof. Sanduni Fernando', 'LECTURER', 'Software Engineering', '+94772345678', 'Software Architecture, DevOps', FALSE, NULL, CURRENT_TIMESTAMP),
(3, 'tharindu.j@student.uoc.lk', '$2a$10$hKDVYxLefS6536Z7V4P6zehOOMD6U8vV4z.mOhD3rJ1A3rP/CrtwK', 'Tharindu Jayawardena', 'STUDENT', 'Computer Science', '+94711234567', NULL, FALSE, NULL, CURRENT_TIMESTAMP),
(4, 'nethmi.d@student.sliit.lk', '$2a$10$hKDVYxLefS6536Z7V4P6zehOOMD6U8vV4z.mOhD3rJ1A3rP/CrtwK', 'Nethmi Dissanayake', 'STUDENT', 'Software Engineering', '+94712345678', NULL, FALSE, NULL, CURRENT_TIMESTAMP);

INSERT INTO lecturer_profiles (user_id, employee_code, designation, office_location, office_hours, bio)
VALUES
(1, 'LEC001', 'Senior Lecturer', 'Room 301, Faculty of Science', 'Mon/Wed 2:00 PM - 4:00 PM', 'Specializes in ML and AI.'),
(2, 'LEC002', 'Professor', 'Office 205, SLIIT Metro Campus', 'Tue/Thu 10:00 AM - 12:00 PM', 'Focuses on software architecture and project mentorship.');

INSERT INTO student_profiles (user_id, registration_number, batch, academic_year, semester)
VALUES
(3, 'IT20123456', 'Batch 2020', 'Year 3', 'Semester 1'),
(4, 'IT20234567', 'Batch 2020', 'Year 4', 'Semester 2');

INSERT INTO availability_slots (id, lecturer_id, slot_date, start_time, end_time, status, mode, location, meeting_link, block_reason)
VALUES
(101, 1, DATEADD('DAY', 1, CURRENT_DATE), TIME '10:00:00', TIME '10:30:00', 'AVAILABLE', 'Physical', 'Room 301', NULL, NULL),
(102, 1, DATEADD('DAY', 1, CURRENT_DATE), TIME '11:00:00', TIME '11:30:00', 'AVAILABLE', 'Online', NULL, 'https://meet.example.com/nimal-1100', NULL),
(103, 2, DATEADD('DAY', 2, CURRENT_DATE), TIME '14:00:00', TIME '14:30:00', 'AVAILABLE', 'Physical', 'Office 205', NULL, NULL),
(104, 2, DATEADD('DAY', 2, CURRENT_DATE), TIME '15:00:00', TIME '15:30:00', 'AVAILABLE', 'Online', NULL, 'https://meet.example.com/sanduni-1500', NULL);

INSERT INTO appointments (id, student_id, lecturer_id, start_time, end_time, status, notes, created_at)
VALUES
(201, 3, 1, DATEADD('MINUTE', 30, CURRENT_TIMESTAMP), DATEADD('MINUTE', 60, CURRENT_TIMESTAMP), 'PENDING', 'Need guidance on project methodology.', CURRENT_TIMESTAMP),
(202, 4, 2, DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -1, DATEADD('MINUTE', 45, CURRENT_TIMESTAMP)), 'COMPLETED', 'Follow-up on software design review.', CURRENT_TIMESTAMP);

INSERT INTO canned_responses (id, lecturer_id, title, content, created_at)
VALUES
(301, 1, 'Meeting Confirmation', 'Your appointment is confirmed. Please bring your project notes.', CURRENT_TIMESTAMP),
(302, 2, 'Reschedule Request', 'I need to reschedule due to a faculty commitment. Please select a new slot.', CURRENT_TIMESTAMP);
