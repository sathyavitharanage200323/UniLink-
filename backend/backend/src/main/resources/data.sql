-- ============================================================================
-- Sample Data for UniLink System (Sri Lankan University Context)
-- This file will be automatically executed by Spring Boot on startup
-- ============================================================================

-- ============================================================================
-- LECTURERS (University of Colombo, SLIIT, University of Moratuwa)
-- ============================================================================

INSERT INTO users (name, email, password_hash, role, department, phone, expertise, do_not_disturb, created_at) VALUES
('Dr. Nimal Perera', 'nimal.perera@uoc.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'LECTURER', 'Computer Science', '+94771234567', 'Machine Learning, Artificial Intelligence, Natural Language Processing', false, NOW()),
('Prof. Sanduni Fernando', 'sanduni.fernando@sliit.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'LECTURER', 'Software Engineering', '+94772345678', 'Agile Methodologies, DevOps, Software Architecture', false, NOW()),
('Dr. Kasun Rajapaksa', 'kasun.rajapaksa@mrt.ac.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'LECTURER', 'Information Technology', '+94773456789', 'Network Security, Cloud Computing, Distributed Systems', false, NOW()),
('Ms. Dilini Wickramasinghe', 'dilini.wickramasinghe@uoc.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'LECTURER', 'Data Science', '+94774567890', 'Big Data Analytics, Business Intelligence, Data Visualization', false, NOW()),
('Dr. Chamara Silva', 'chamara.silva@sliit.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'LECTURER', 'Cybersecurity', '+94775678901', 'Ethical Hacking, Penetration Testing, Security Auditing', false, NOW());

-- ============================================================================
-- STUDENTS (Various years and departments)
-- ============================================================================

INSERT INTO users (name, email, password_hash, role, department, phone, do_not_disturb, created_at) VALUES
('Tharindu Jayawardena', 'tharindu.j@student.uoc.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Computer Science', '+94711234567', false, NOW()),
('Nethmi Dissanayake', 'nethmi.d@student.sliit.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Software Engineering', '+94712345678', false, NOW()),
('Ravindu Gunasekara', 'ravindu.g@student.mrt.ac.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Information Technology', '+94713456789', false, NOW()),
('Ishara Wijesinghe', 'ishara.w@student.uoc.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Data Science', '+94714567890', false, NOW()),
('Kavinda Rathnayake', 'kavinda.r@student.sliit.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Cybersecurity', '+94715678901', false, NOW()),
('Sachini Amarasinghe', 'sachini.a@student.uoc.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Computer Science', '+94716789012', false, NOW()),
('Dineth Bandara', 'dineth.b@student.mrt.ac.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Software Engineering', '+94717890123', false, NOW()),
('Hansika Senanayake', 'hansika.s@student.sliit.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Information Technology', '+94718901234', false, NOW()),
('Chamod Liyanage', 'chamod.l@student.uoc.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Data Science', '+94719012345', false, NOW()),
('Oshadi Perera', 'oshadi.p@student.sliit.lk', '$2a$10$dummyHashForDemo123456789012345678901234567890', 'STUDENT', 'Cybersecurity', '+94710123456', false, NOW());

-- ============================================================================
-- LECTURER PROFILES
-- ============================================================================

INSERT INTO lecturer_profiles (user_id, employee_code, bio, office_location, office_hours) VALUES
(1, 'LEC001', 'PhD in Computer Science from University of Colombo. Specializes in Machine Learning and AI. 15+ years of teaching experience.', 'Room 301, Faculty of Science Building', 'Monday & Wednesday 2:00 PM - 4:00 PM'),
(2, 'LEC002', 'Professor of Software Engineering at SLIIT. Expert in Agile methodologies and DevOps practices. Published 30+ research papers.', 'Office 205, SLIIT Metro Campus', 'Tuesday & Thursday 10:00 AM - 12:00 PM'),
(3, 'LEC003', 'Senior Lecturer specializing in Network Security and Cloud Computing. Industry experience with leading tech companies in Colombo.', 'Room 402, IT Faculty, University of Moratuwa', 'Wednesday & Friday 3:00 PM - 5:00 PM'),
(4, 'LEC004', 'Data Science researcher with focus on Big Data Analytics and Business Intelligence. Consultant for several Sri Lankan enterprises.', 'Room 215, Faculty of Science Building', 'Monday & Thursday 1:00 PM - 3:00 PM'),
(5, 'LEC005', 'Cybersecurity expert with CISSP and CEH certifications. Former security analyst at leading financial institutions in Sri Lanka.', 'Office 310, SLIIT Malabe Campus', 'Tuesday & Friday 11:00 AM - 1:00 PM');

-- ============================================================================
-- STUDENT PROFILES
-- ============================================================================

INSERT INTO student_profiles (user_id, registration_number, batch, academic_year, semester) VALUES
(6, 'IT20123456', 'Batch 2020', 'Year 3', 'Semester 1'),  -- Tharindu
(7, 'IT20234567', 'Batch 2020', 'Year 4', 'Semester 2'),  -- Nethmi - Year 4 (HIGH PRIORITY)
(8, 'IT21345678', 'Batch 2021', 'Year 2', 'Semester 2'),  -- Ravindu
(9, 'IT20456789', 'Batch 2020', 'Year 4', 'Semester 1'),  -- Ishara - Year 4 (HIGH PRIORITY)
(10, 'IT20567890', 'Batch 2020', 'Year 3', 'Semester 2'), -- Kavinda
(11, 'IT22678901', 'Batch 2022', 'Year 1', 'Semester 2'), -- Sachini
(12, 'IT20789012', 'Batch 2020', 'Year 4', 'Semester 2'), -- Dineth - Year 4 (HIGH PRIORITY)
(13, 'IT21890123', 'Batch 2021', 'Year 2', 'Semester 1'), -- Hansika
(14, 'IT20901234', 'Batch 2020', 'Year 3', 'Semester 1'), -- Chamod
(15, 'IT22012345', 'Batch 2022', 'Year 1', 'Semester 1'); -- Oshadi

-- ============================================================================
-- APPOINTMENTS (Sample booking scenarios)
-- ============================================================================

-- Pending appointments (awaiting lecturer approval)
INSERT INTO appointments (student_id, lecturer_id, start_time, end_time, status, notes, created_at) VALUES
(7, 1, '2026-03-26 10:00:00', '2026-03-26 11:00:00', 'PENDING', 'HIGH PRIORITY - Year 4 Final Year Project discussion. Need guidance on ML model selection for my research on Sinhala NLP.', NOW()),
(9, 2, '2026-03-26 14:00:00', '2026-03-26 15:00:00', 'PENDING', 'HIGH PRIORITY - Year 4 student. Urgent help needed with Agile sprint planning for capstone project. Team facing blockers.', NOW()),
(12, 3, '2026-03-27 09:00:00', '2026-03-27 10:00:00', 'PENDING', 'HIGH PRIORITY - Year 4 Final Year Project. Cloud deployment issues with AWS for our e-commerce platform.', NOW()),
(8, 4, '2026-03-27 15:00:00', '2026-03-27 16:00:00', 'PENDING', 'Year 2 - Need clarification on Data Mining assignment. Struggling with clustering algorithms implementation.', NOW()),
(13, 5, '2026-03-28 11:00:00', '2026-03-28 12:00:00', 'PENDING', 'Year 2 - Questions about network security fundamentals. Want to discuss career path in cybersecurity field.', NOW());

-- Confirmed appointments (lecturer accepted)
INSERT INTO appointments (student_id, lecturer_id, start_time, end_time, status, notes, created_at) VALUES
(6, 1, '2026-03-26 15:00:00', '2026-03-26 16:00:00', 'CONFIRMED', 'Year 3 - Database design review for group project. Need feedback on ER diagram and normalization.', NOW()),
(10, 2, '2026-03-27 10:00:00', '2026-03-27 11:00:00', 'CONFIRMED', 'Year 3 - Software architecture discussion. Microservices vs Monolithic for our university management system.', NOW()),
(14, 4, '2026-03-28 14:00:00', '2026-03-28 15:00:00', 'CONFIRMED', 'Year 3 - Data visualization project feedback. Using Python libraries for Sri Lankan census data analysis.', NOW());

-- Completed appointments (past sessions)
INSERT INTO appointments (student_id, lecturer_id, start_time, end_time, status, notes, created_at) VALUES
(11, 1, '2026-03-24 10:00:00', '2026-03-24 11:00:00', 'COMPLETED', 'Year 1 - Introduction to programming concepts. Java basics and OOP principles clarification.', NOW()),
(15, 5, '2026-03-24 13:00:00', '2026-03-24 14:00:00', 'COMPLETED', 'Year 1 - Cybersecurity fundamentals. Discussion on password security and encryption basics.', NOW());

-- ============================================================================
-- AVAILABILITY SLOTS (Sample lecturer availability)
-- ============================================================================

-- Dr. Nimal Perera (Lecturer ID: 1) - Monday, Wednesday, Friday availability
INSERT INTO availability_slots (lecturer_id, day_of_week, start_time, end_time, is_available) VALUES
-- Monday
(1, 'MONDAY', '09:00:00', '09:30:00', true),
(1, 'MONDAY', '09:30:00', '10:00:00', true),
(1, 'MONDAY', '10:00:00', '10:30:00', false), -- Booked
(1, 'MONDAY', '10:30:00', '11:00:00', false), -- Booked
(1, 'MONDAY', '14:00:00', '14:30:00', true),
(1, 'MONDAY', '14:30:00', '15:00:00', true),
(1, 'MONDAY', '15:00:00', '15:30:00', false), -- Booked
(1, 'MONDAY', '15:30:00', '16:00:00', false), -- Booked
-- Wednesday
(1, 'WEDNESDAY', '09:00:00', '09:30:00', true),
(1, 'WEDNESDAY', '09:30:00', '10:00:00', true),
(1, 'WEDNESDAY', '10:00:00', '10:30:00', true),
(1, 'WEDNESDAY', '10:30:00', '11:00:00', true),
(1, 'WEDNESDAY', '14:00:00', '14:30:00', true),
(1, 'WEDNESDAY', '14:30:00', '15:00:00', true),
-- Friday
(1, 'FRIDAY', '10:00:00', '10:30:00', true),
(1, 'FRIDAY', '10:30:00', '11:00:00', true),
(1, 'FRIDAY', '11:00:00', '11:30:00', true),
(1, 'FRIDAY', '11:30:00', '12:00:00', true);

-- Prof. Sanduni Fernando (Lecturer ID: 2) - Tuesday and Thursday availability
INSERT INTO availability_slots (lecturer_id, day_of_week, start_time, end_time, is_available) VALUES
-- Tuesday
(2, 'TUESDAY', '10:00:00', '10:30:00', true),
(2, 'TUESDAY', '10:30:00', '11:00:00', true),
(2, 'TUESDAY', '11:00:00', '11:30:00', true),
(2, 'TUESDAY', '14:00:00', '14:30:00', false), -- Booked
(2, 'TUESDAY', '14:30:00', '15:00:00', false), -- Booked
(2, 'TUESDAY', '15:00:00', '15:30:00', true),
-- Thursday
(2, 'THURSDAY', '09:00:00', '09:30:00', true),
(2, 'THURSDAY', '09:30:00', '10:00:00', true),
(2, 'THURSDAY', '10:00:00', '10:30:00', false), -- Booked
(2, 'THURSDAY', '10:30:00', '11:00:00', false), -- Booked
(2, 'THURSDAY', '13:00:00', '13:30:00', true),
(2, 'THURSDAY', '13:30:00', '14:00:00', true);

-- Dr. Kasun Rajapaksa (Lecturer ID: 3) - Wednesday and Friday availability
INSERT INTO availability_slots (lecturer_id, day_of_week, start_time, end_time, is_available) VALUES
-- Wednesday
(3, 'WEDNESDAY', '09:00:00', '09:30:00', false), -- Booked
(3, 'WEDNESDAY', '09:30:00', '10:00:00', false), -- Booked
(3, 'WEDNESDAY', '15:00:00', '15:30:00', true),
(3, 'WEDNESDAY', '15:30:00', '16:00:00', true),
(3, 'WEDNESDAY', '16:00:00', '16:30:00', true),
-- Friday
(3, 'FRIDAY', '14:00:00', '14:30:00', true),
(3, 'FRIDAY', '14:30:00', '15:00:00', true),
(3, 'FRIDAY', '15:00:00', '15:30:00', true),
(3, 'FRIDAY', '15:30:00', '16:00:00', true);

-- ============================================================================
-- STUDENT DISCIPLINES (Academic records)
-- ============================================================================

INSERT INTO student_disciplines (student_id, course_code, course_name, grade, semester, year, created_at) VALUES
-- Tharindu Jayawardena (Student ID: 6)
(6, 'CS3001', 'Advanced Database Systems', 'A-', 1, 3, NOW()),
(6, 'CS3002', 'Software Engineering Principles', 'B+', 1, 3, NOW()),
(6, 'CS3003', 'Web Technologies', 'A', 1, 3, NOW()),

-- Nethmi Dissanayake (Student ID: 7) - Year 4
(7, 'SE4001', 'Final Year Project', 'A', 2, 4, NOW()),
(7, 'SE4002', 'Enterprise Architecture', 'A-', 2, 4, NOW()),
(7, 'SE4003', 'DevOps and Cloud Computing', 'A', 2, 4, NOW()),

-- Ravindu Gunasekara (Student ID: 8)
(8, 'IT2001', 'Data Structures and Algorithms', 'B', 2, 2, NOW()),
(8, 'IT2002', 'Computer Networks', 'B+', 2, 2, NOW()),

-- Ishara Wijesinghe (Student ID: 9) - Year 4
(9, 'DS4001', 'Machine Learning', 'A', 1, 4, NOW()),
(9, 'DS4002', 'Big Data Analytics', 'A-', 1, 4, NOW()),
(9, 'DS4003', 'Research Methodology', 'A', 1, 4, NOW());

-- ============================================================================
-- CANNED RESPONSES (Quick reply templates for lecturers)
-- ============================================================================

INSERT INTO canned_responses (lecturer_id, title, content, created_at) VALUES
(1, 'Meeting Confirmation', 'Thank you for booking. I have confirmed your appointment. Please bring your project documentation and any specific questions you have. See you soon!', NOW()),
(1, 'Reschedule Request', 'I need to reschedule our meeting due to a faculty commitment. Would you be available at an alternative time? Please check my availability and suggest a new slot.', NOW()),
(2, 'Project Guidelines', 'For your final year project, please ensure you have: 1) Project proposal document, 2) Timeline/Gantt chart, 3) Technology stack justification. We will discuss these in detail.', NOW()),
(3, 'Technical Setup', 'Before our meeting, please ensure you have: 1) Your code repository link, 2) Error logs/screenshots, 3) System configuration details. This will help us troubleshoot efficiently.', NOW()),
(4, 'Assignment Clarification', 'I have received your query about the assignment. Please review the lecture slides from Week 5 and the textbook Chapter 7. If you still have questions, we can discuss during our meeting.', NOW()),
(5, 'Career Guidance', 'Great to see your interest in cybersecurity! I recommend starting with CompTIA Security+ certification and practicing on platforms like TryHackMe. We can discuss a detailed roadmap in our session.', NOW());

-- ============================================================================
-- NOTES:
-- - All passwords are dummy hashes for demo purposes
-- - In production, use proper password hashing with BCrypt
-- - Timestamps use NOW() for current time
-- - Year 4 students are automatically HIGH PRIORITY in the system
-- - Availability slots are in 30-minute intervals
-- - Sri Lankan university context with local names and institutions
-- ============================================================================
