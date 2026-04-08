package com.example.backend.config;

import com.example.backend.model.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository              userRepository;
    private final StudentProfileRepository    studentProfileRepository;
    private final LecturerProfileRepository   lecturerProfileRepository;
    private final AppointmentRepository       appointmentRepository;
    private final AvailabilitySlotRepository  availabilitySlotRepository;
    private final CannedResponseRepository    cannedResponseRepository;
    private final ChatMessageRepository       chatMessageRepository;
    private final ChatRoomRepository          chatRoomRepository;
    private final StudentDisciplineRepository studentDisciplineRepository;

    private final BCryptPasswordEncoder       encoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            System.out.println("ℹ️ Database already contains " + userRepository.count() + " users. Skipping data seeding.");
            return;
        }

        // ── Lecturers ────────────────────────────────────────────────────────
        User l1 = saveUser("nimal.perera@uoc.lk",       "Dr. Nimal Perera",         User.Role.LECTURER, "Faculty Of Computing",              "+94771234567", "Machine Learning, AI, Natural Language Processing");
        User l2 = saveUser("sanduni.fernando@sliit.lk", "Prof. Sanduni Fernando",   User.Role.LECTURER, "Faculty Of Engineering",            "+94772345678", "Agile Methodologies, DevOps, Software Architecture");
        User l3 = saveUser("kasun.rajapaksa@mrt.ac.lk", "Dr. Kasun Rajapaksa",      User.Role.LECTURER, "Faculty Of Computing",              "+94773456789", "Network Security, Cloud Computing, Distributed Systems");
        User l4 = saveUser("dilini.wickrama@uoc.lk",    "Ms. Dilini Wickramasinghe",User.Role.LECTURER, "Faculty Of Business",               "+94774567890", "Big Data Analytics, Business Intelligence, Data Visualization");
        User l5 = saveUser("chamara.silva@sliit.lk",    "Dr. Chamara Silva",        User.Role.LECTURER, "Faculty Of Humanities and Sciences", "+94775678901", "Ethical Hacking, Penetration Testing, Security Auditing");
        User l6 = saveUser("priya.jayawardena@uom.lk",  "Prof. Priya Jayawardena",  User.Role.LECTURER, "Faculty Of Engineering",            "+94776789012", "Embedded Systems, IoT, Robotics");
        User l7 = saveUser("ruwan.bandara@nsbm.lk",     "Dr. Ruwan Bandara",        User.Role.LECTURER, "Faculty Of Computing",              "+94777890123", "Blockchain, Cryptocurrency, Fintech");
        User l8 = saveUser("anura.silva@uoc.lk",        "Dr. Anura Silva",          User.Role.LECTURER, "Faculty Of Computing",              "+94778901234", "Database Systems, SQL Optimization, Data Warehousing");
        User l9 = saveUser("lakshmi.gunawardena@sliit.lk", "Prof. Lakshmi Gunawardena", User.Role.LECTURER, "Faculty Of Engineering",        "+94779012345", "Web Development, Full Stack Architecture, REST APIs");
        User l10 = saveUser("suresh.perera@mrt.ac.lk",  "Dr. Suresh Perera",        User.Role.LECTURER, "Faculty Of Computing",              "+94780123456", "Mobile App Development, Android, iOS, Cross-platform");
        User l11 = saveUser("malini.jayasuriya@uoc.lk", "Ms. Malini Jayasuriya",    User.Role.LECTURER, "Faculty Of Business",               "+94781234567", "Business Analytics, Market Research, Strategic Planning");
        User l12 = saveUser("roshan.fernando@sliit.lk", "Dr. Roshan Fernando",      User.Role.LECTURER, "Faculty Of Humanities and Sciences", "+94782345678", "Software Testing, QA Automation, Test Frameworks");
        User l13 = saveUser("samantha.de.silva@nsbm.lk", "Prof. Samantha De Silva", User.Role.LECTURER, "Faculty Of Computing",              "+94783456789", "Artificial Intelligence, Deep Learning, Neural Networks");
        User l14 = saveUser("harsha.wijesinghe@uom.lk", "Dr. Harsha Wijesinghe",    User.Role.LECTURER, "Faculty Of Engineering",            "+94784567890", "System Design, Scalability, Performance Optimization");

        saveLecturerProfile(l1, "UOC-CS-001", "Senior Lecturer",    "Room 301, Faculty of Science, University of Colombo",       "Mon & Wed 2:00 PM – 4:00 PM",  "Dr. Nimal Perera holds a PhD in Computer Science from the University of Moratuwa. He has over 15 years of experience in AI and Machine Learning research, with publications in IEEE and ACM journals. He is the principal investigator of the Sri Lanka AI Research Initiative.");
        saveLecturerProfile(l2, "SLIIT-SE-002","Professor",          "Office 205, SLIIT Metro Campus, Malabe",                    "Tue & Thu 10:00 AM – 12:00 PM","Prof. Sanduni Fernando is a leading expert in Software Engineering practices in Sri Lanka. She has consulted for Dialog Axiata, WSO2, and the ICTA on digital transformation projects. She holds a PhD from the University of Melbourne.");
        saveLecturerProfile(l3, "MRT-IT-003",  "Senior Lecturer",    "Room 402, IT Faculty, University of Moratuwa",              "Wed & Fri 3:00 PM – 5:00 PM",  "Dr. Kasun Rajapaksa specialises in cybersecurity and cloud infrastructure. He has worked with the Sri Lanka CERT and the Central Bank of Sri Lanka on national cybersecurity frameworks.");
        saveLecturerProfile(l4, "UOC-DS-004",  "Lecturer In Charge", "Room 215, Faculty of Science, University of Colombo",       "Mon & Thu 1:00 PM – 3:00 PM",  "Ms. Dilini Wickramasinghe is a data science practitioner with industry experience at Virtusa and Calcey Technologies. She focuses on applying analytics to Sri Lankan business contexts.");
        saveLecturerProfile(l5, "SLIIT-CY-005","Senior Lecturer",    "Office 310, SLIIT Malabe Campus",                           "Tue & Fri 11:00 AM – 1:00 PM", "Dr. Chamara Silva is a certified ethical hacker (CEH) and OSCP holder. He has conducted security audits for several Sri Lankan banks and government institutions.");
        saveLecturerProfile(l6, "UOM-EE-006",  "Professor",          "Lab 101, Electrical Engineering, University of Moratuwa",   "Mon & Wed 9:00 AM – 11:00 AM", "Prof. Priya Jayawardena leads the IoT Research Lab at the University of Moratuwa. Her work on smart agriculture has been deployed in Anuradhapura and Polonnaruwa districts.");
        saveLecturerProfile(l7, "NSBM-BC-007", "Lecturer",           "Room 12, Green University Town, Pitipana, Homagama",        "Thu & Fri 2:00 PM – 4:00 PM",  "Dr. Ruwan Bandara is a fintech researcher who has advised the Central Bank of Sri Lanka on CBDC feasibility. He holds a PhD from the National University of Singapore.");
        saveLecturerProfile(l8, "UOC-CS-008", "Senior Lecturer",    "Room 305, Faculty of Science, University of Colombo",       "Tue & Thu 10:00 AM – 12:00 PM", "Dr. Anura Silva is a database expert with 12 years of industry experience at Virtusa and IFS. He specializes in optimizing large-scale database systems for Sri Lankan enterprises.");
        saveLecturerProfile(l9, "SLIIT-SE-009","Professor",          "Office 210, SLIIT Metro Campus, Malabe",                    "Mon & Wed 2:00 PM – 4:00 PM", "Prof. Lakshmi Gunawardena leads the Web Development Lab at SLIIT. She has mentored over 200 students and worked on e-commerce platforms for major Sri Lankan retailers.");
        saveLecturerProfile(l10, "MRT-IT-010", "Senior Lecturer",   "Room 405, IT Faculty, University of Moratuwa",              "Tue & Thu 1:00 PM – 3:00 PM",  "Dr. Suresh Perera is a mobile development expert with experience at Dialog Axiata and Mobitel. He has published research on mobile security in Sri Lankan telecommunications.");
        saveLecturerProfile(l11, "UOC-BUS-011", "Lecturer",         "Room 120, Faculty of Business, University of Colombo",      "Wed & Fri 11:00 AM – 1:00 PM", "Ms. Malini Jayasuriya has worked as a business analyst for the Central Bank of Sri Lanka and several multinational corporations. She brings real-world market insights to her teaching.");
        saveLecturerProfile(l12, "SLIIT-QA-012", "Senior Lecturer", "Office 315, SLIIT Malabe Campus",                           "Mon & Thu 3:00 PM – 5:00 PM",  "Dr. Roshan Fernando is a QA automation expert who has led testing initiatives at WSO2 and Sysco Labs. He is a certified ISTQB instructor and conducts workshops across Sri Lanka.");
        saveLecturerProfile(l13, "NSBM-AI-013", "Professor",        "Room 15, Green University Town, Pitipana, Homagama",        "Wed & Fri 2:00 PM – 4:00 PM",  "Prof. Samantha De Silva is an AI researcher with a PhD from the University of Cambridge. She leads the AI Research Center at NSBM and has collaborated with international tech companies.");
        saveLecturerProfile(l14, "UOM-EE-014", "Senior Lecturer",   "Lab 105, Electrical Engineering, University of Moratuwa",   "Tue & Thu 2:00 PM – 4:00 PM",  "Dr. Harsha Wijesinghe specializes in system design and scalability. He has architected microservices platforms for major Sri Lankan financial institutions and tech startups.");

        // ── Students ─────────────────────────────────────────────────────────
        User s1  = saveUser("tharindu.j@student.uoc.lk",    "Tharindu Jayawardena",  User.Role.STUDENT, "Faculty Of Computing",              "+94711234567", null);
        User s2  = saveUser("nethmi.d@student.sliit.lk",    "Nethmi Dissanayake",    User.Role.STUDENT, "Faculty Of Engineering",            "+94712345678", null);
        User s3  = saveUser("ravindu.g@student.mrt.ac.lk",  "Ravindu Gunasekara",    User.Role.STUDENT, "Faculty Of Computing",              "+94713456789", null);
        User s4  = saveUser("ishara.w@student.uoc.lk",      "Ishara Wijesinghe",     User.Role.STUDENT, "Faculty Of Business",               "+94714567890", null);
        User s5  = saveUser("kavinda.r@student.sliit.lk",   "Kavinda Rathnayake",    User.Role.STUDENT, "Faculty Of Humanities and Sciences", "+94715678901", null);
        User s6  = saveUser("sachini.a@student.uoc.lk",     "Sachini Amarasinghe",   User.Role.STUDENT, "Faculty Of Computing",              "+94716789012", null);
        User s7  = saveUser("dineth.b@student.mrt.ac.lk",   "Dineth Bandara",        User.Role.STUDENT, "Faculty Of Engineering",            "+94717890123", null);
        User s8  = saveUser("hansika.s@student.sliit.lk",   "Hansika Senanayake",    User.Role.STUDENT, "Faculty Of Computing",              "+94718901234", null);
        User s9  = saveUser("chamod.l@student.uoc.lk",      "Chamod Liyanage",       User.Role.STUDENT, "Faculty Of Business",               "+94719012345", null);
        User s10 = saveUser("oshadi.p@student.sliit.lk",    "Oshadi Perera",         User.Role.STUDENT, "Faculty Of Humanities and Sciences", "+94710123456", null);
        User s11 = saveUser("malith.k@student.mrt.ac.lk",   "Malith Kumarasinghe",   User.Role.STUDENT, "Faculty Of Computing",              "+94721234567", null);
        User s12 = saveUser("yashodha.f@student.uoc.lk",    "Yashodha Fernando",     User.Role.STUDENT, "Faculty Of Engineering",            "+94722345678", null);
        User s13 = saveUser("ashan.m@student.sliit.lk",     "Ashan Mendis",          User.Role.STUDENT, "Faculty Of Computing",              "+94723456789", null);
        User s14 = saveUser("dilshan.k@student.mrt.ac.lk",  "Dilshan Kumara",        User.Role.STUDENT, "Faculty Of Engineering",            "+94724567890", null);
        User s15 = saveUser("priyanka.s@student.uoc.lk",    "Priyanka Senevirathne", User.Role.STUDENT, "Faculty Of Business",               "+94725678901", null);
        User s16 = saveUser("nipun.w@student.sliit.lk",     "Nipun Wijewardena",     User.Role.STUDENT, "Faculty Of Computing",              "+94726789012", null);
        User s17 = saveUser("sandun.r@student.mrt.ac.lk",   "Sandun Ranasinghe",     User.Role.STUDENT, "Faculty Of Humanities and Sciences", "+94727890123", null);
        User s18 = saveUser("tharushi.d@student.uoc.lk",    "Tharushi De Silva",     User.Role.STUDENT, "Faculty Of Computing",              "+94728901234", null);
        User s19 = saveUser("chaminda.h@student.sliit.lk",  "Chaminda Herath",       User.Role.STUDENT, "Faculty Of Engineering",            "+94729012345", null);
        User s20 = saveUser("amara.j@student.mrt.ac.lk",    "Amara Jayasuriya",      User.Role.STUDENT, "Faculty Of Business",               "+94730123456", null);
        User s21 = saveUser("lakshan.p@student.uoc.lk",     "Lakshan Perera",        User.Role.STUDENT, "Faculty Of Computing",              "+94731234567", null);
        User s22 = saveUser("isuru.g@student.sliit.lk",     "Isuru Gunasekara",      User.Role.STUDENT, "Faculty Of Engineering",            "+94732345678", null);
        User s23 = saveUser("kavya.w@student.mrt.ac.lk",    "Kavya Wijesinghe",      User.Role.STUDENT, "Faculty Of Computing",              "+94733456789", null);
        User s24 = saveUser("roshan.s@student.uoc.lk",      "Roshan Silva",          User.Role.STUDENT, "Faculty Of Humanities and Sciences", "+94734567890", null);

        saveStudentProfile(s1,  "IT20123456", "Computer Science",                    "Year 3", "Semester 1");
        saveStudentProfile(s2,  "IT20234567", "Software Engineering",                "Year 4", "Semester 2");
        saveStudentProfile(s3,  "IT21345678", "Information Technology",              "Year 2", "Semester 2");
        saveStudentProfile(s4,  "IT20456789", "Data Science",                        "Year 4", "Semester 1");
        saveStudentProfile(s5,  "IT20567890", "Cyber Security",                      "Year 3", "Semester 2");
        saveStudentProfile(s6,  "IT22678901", "Computer Science",                    "Year 1", "Semester 2");
        saveStudentProfile(s7,  "IT20789012", "Software Engineering",                "Year 4", "Semester 2");
        saveStudentProfile(s8,  "IT21890123", "Information Technology",              "Year 2", "Semester 1");
        saveStudentProfile(s9,  "IT20901234", "Data Science",                        "Year 3", "Semester 1");
        saveStudentProfile(s10, "IT22012345", "Cyber Security",                      "Year 1", "Semester 1");
        saveStudentProfile(s11, "IT21112233", "Computer Systems & Network Engineering","Year 2","Semester 2");
        saveStudentProfile(s12, "IT20998877", "Artificial Intelligence",             "Year 4", "Semester 1");
        saveStudentProfile(s13, "IT21223344", "Computer Science",                    "Year 2", "Semester 2");
        saveStudentProfile(s14, "IT20334455", "Software Engineering",                "Year 3", "Semester 1");
        saveStudentProfile(s15, "IT22445566", "Data Science",                        "Year 1", "Semester 2");
        saveStudentProfile(s16, "IT20556677", "Cyber Security",                      "Year 4", "Semester 2");
        saveStudentProfile(s17, "IT21667788", "Information Technology",              "Year 2", "Semester 1");
        saveStudentProfile(s18, "IT20778899", "Computer Science",                    "Year 3", "Semester 2");
        saveStudentProfile(s19, "IT22889900", "Software Engineering",                "Year 1", "Semester 1");
        saveStudentProfile(s20, "IT20990011", "Artificial Intelligence",             "Year 4", "Semester 1");
        saveStudentProfile(s21, "IT21001122", "Computer Systems & Network Engineering","Year 2","Semester 2");
        saveStudentProfile(s22, "IT20112233", "Data Science",                        "Year 3", "Semester 1");
        saveStudentProfile(s23, "IT22223344", "Cyber Security",                      "Year 1", "Semester 2");
        saveStudentProfile(s24, "IT20334455", "Computer Science",                    "Year 4", "Semester 2");

        // ── Weekly Availability Slots ─────────────────────────────────────────
        // Dr. Nimal Perera — Mon, Wed, Fri
        seedWeeklySlots(l1, List.of("MONDAY","WEDNESDAY","FRIDAY"),
                List.of("09:00","09:30","10:00","10:30","14:00","14:30","15:00","15:30"));

        // Prof. Sanduni Fernando — Tue, Thu
        seedWeeklySlots(l2, List.of("TUESDAY","THURSDAY"),
                List.of("10:00","10:30","11:00","11:30","14:00","14:30","15:00"));

        // Dr. Kasun Rajapaksa — Wed, Fri
        seedWeeklySlots(l3, List.of("WEDNESDAY","FRIDAY"),
                List.of("13:00","13:30","14:00","14:30","15:00","15:30","16:00"));

        // Ms. Dilini Wickramasinghe — Mon, Thu
        seedWeeklySlots(l4, List.of("MONDAY","THURSDAY"),
                List.of("09:00","09:30","10:00","13:00","13:30","14:00","14:30"));

        // Dr. Chamara Silva — Tue, Fri
        seedWeeklySlots(l5, List.of("TUESDAY","FRIDAY"),
                List.of("11:00","11:30","12:00","15:00","15:30","16:00","16:30"));

        // Prof. Priya Jayawardena — Mon, Wed
        seedWeeklySlots(l6, List.of("MONDAY","WEDNESDAY"),
                List.of("09:00","09:30","10:00","10:30","11:00"));

        // Dr. Ruwan Bandara — Thu, Fri
        seedWeeklySlots(l7, List.of("THURSDAY","FRIDAY"),
                List.of("14:00","14:30","15:00","15:30","16:00","16:30"));

        // Dr. Anura Silva — Tue, Thu
        seedWeeklySlots(l8, List.of("TUESDAY","THURSDAY"),
                List.of("10:00","10:30","11:00","11:30","14:00","14:30"));

        // Prof. Lakshmi Gunawardena — Mon, Wed
        seedWeeklySlots(l9, List.of("MONDAY","WEDNESDAY"),
                List.of("14:00","14:30","15:00","15:30","16:00"));

        // Dr. Suresh Perera — Tue, Thu
        seedWeeklySlots(l10, List.of("TUESDAY","THURSDAY"),
                List.of("13:00","13:30","14:00","14:30","15:00","15:30"));

        // Ms. Malini Jayasuriya — Wed, Fri
        seedWeeklySlots(l11, List.of("WEDNESDAY","FRIDAY"),
                List.of("11:00","11:30","12:00","12:30","13:00"));

        // Dr. Roshan Fernando — Mon, Thu
        seedWeeklySlots(l12, List.of("MONDAY","THURSDAY"),
                List.of("15:00","15:30","16:00","16:30","17:00"));

        // Prof. Samantha De Silva — Wed, Fri
        seedWeeklySlots(l13, List.of("WEDNESDAY","FRIDAY"),
                List.of("14:00","14:30","15:00","15:30","16:00","16:30"));

        // Dr. Harsha Wijesinghe — Tue, Thu
        seedWeeklySlots(l14, List.of("TUESDAY","THURSDAY"),
                List.of("14:00","14:30","15:00","15:30","16:00"));

        // ── Appointments ─────────────────────────────────────────────────────
        LocalDateTime base = LocalDateTime.now();

        // PENDING — awaiting lecturer action
        saveAppointment(s2,  l1, base.plusDays(2).withHour(9).withMinute(0),  base.plusDays(2).withHour(9).withMinute(30),  Appointment.Status.PENDING,   "[Year 4 Semester 2 | HIGH PRIORITY] Final Year Project guidance needed — deep learning model for Sinhala text classification using BERT.");
        saveAppointment(s4,  l2, base.plusDays(3).withHour(10).withMinute(0), base.plusDays(3).withHour(10).withMinute(30), Appointment.Status.PENDING,   "[Year 4 Semester 1 | HIGH PRIORITY] Agile sprint planning for FYP — need advice on CI/CD pipeline setup with GitHub Actions.");
        saveAppointment(s7,  l3, base.plusDays(4).withHour(14).withMinute(0), base.plusDays(4).withHour(14).withMinute(30), Appointment.Status.PENDING,   "[Year 4 Semester 2 | HIGH PRIORITY] Cloud deployment architecture review for final year project on distributed microservices.");
        saveAppointment(s12, l1, base.plusDays(5).withHour(10).withMinute(0), base.plusDays(5).withHour(10).withMinute(30), Appointment.Status.PENDING,   "[Year 4 Semester 1 | HIGH PRIORITY] Research methodology discussion for AI-based crop disease detection system for Sri Lankan paddy fields.");
        saveAppointment(s3,  l4, base.plusDays(2).withHour(13).withMinute(0), base.plusDays(2).withHour(13).withMinute(30), Appointment.Status.PENDING,   "[Year 2 Semester 2] Data mining assignment clarification — confusion matrix interpretation for the telecom churn dataset.");
        saveAppointment(s8,  l5, base.plusDays(3).withHour(11).withMinute(0), base.plusDays(3).withHour(11).withMinute(30), Appointment.Status.PENDING,   "[Year 2 Semester 1] Network security lab report review — need help understanding the Wireshark packet capture analysis.");
        saveAppointment(s14, l8, base.plusDays(2).withHour(10).withMinute(0), base.plusDays(2).withHour(10).withMinute(30), Appointment.Status.PENDING,   "[Year 3 Semester 1 | HIGH PRIORITY] Database optimization techniques for large-scale systems — query performance tuning.");
        saveAppointment(s16, l9, base.plusDays(3).withHour(14).withMinute(0), base.plusDays(3).withHour(14).withMinute(30), Appointment.Status.PENDING,   "[Year 4 Semester 2] Full-stack web application architecture review — React frontend with Node.js backend.");
        saveAppointment(s19, l10, base.plusDays(4).withHour(13).withMinute(0), base.plusDays(4).withHour(13).withMinute(30), Appointment.Status.PENDING,   "[Year 1 Semester 1] Mobile app development fundamentals — getting started with Flutter for cross-platform development.");
        saveAppointment(s21, l12, base.plusDays(2).withHour(15).withMinute(0), base.plusDays(2).withHour(15).withMinute(30), Appointment.Status.PENDING,   "[Year 2 Semester 2] QA automation framework setup — Selenium with Java for web application testing.");

        // CONFIRMED — upcoming sessions
        saveAppointment(s1,  l1, base.plusDays(1).withHour(9).withMinute(30),  base.plusDays(1).withHour(10).withMinute(0),  Appointment.Status.CONFIRMED, "[Year 3 Semester 1] Database design review for the e-channelling system project — ER diagram and normalisation feedback.");
        saveAppointment(s5,  l2, base.plusDays(1).withHour(10).withMinute(30), base.plusDays(1).withHour(11).withMinute(0),  Appointment.Status.CONFIRMED, "[Year 3 Semester 2] Software architecture discussion — microservices vs monolith for the university bus tracking app.");
        saveAppointment(s9,  l4, base.plusDays(2).withHour(14).withMinute(0),  base.plusDays(2).withHour(14).withMinute(30), Appointment.Status.CONFIRMED, "[Year 3 Semester 1] Data visualisation project feedback — Tableau dashboard for Sri Lanka tourism statistics.");
        saveAppointment(s11, l6, base.plusDays(1).withHour(9).withMinute(0),   base.plusDays(1).withHour(9).withMinute(30),  Appointment.Status.CONFIRMED, "[Year 2 Semester 2] IoT sensor integration query — connecting DHT22 temperature sensors to Raspberry Pi for smart greenhouse project.");
        saveAppointment(s13, l8, base.plusDays(1).withHour(10).withMinute(30), base.plusDays(1).withHour(11).withMinute(0),  Appointment.Status.CONFIRMED, "[Year 2 Semester 2] SQL query optimization techniques — indexing strategies for large datasets.");
        saveAppointment(s15, l11, base.plusDays(3).withHour(11).withMinute(0), base.plusDays(3).withHour(11).withMinute(30), Appointment.Status.CONFIRMED, "[Year 1 Semester 2] Business analytics fundamentals — understanding KPIs and metrics for decision-making.");
        saveAppointment(s17, l13, base.plusDays(2).withHour(14).withMinute(0), base.plusDays(2).withHour(14).withMinute(30), Appointment.Status.CONFIRMED, "[Year 2 Semester 1] Deep learning model training — neural network architecture design for image classification.");
        saveAppointment(s20, l14, base.plusDays(1).withHour(14).withMinute(30), base.plusDays(1).withHour(15).withMinute(0), Appointment.Status.CONFIRMED, "[Year 4 Semester 1] Microservices scalability discussion — load balancing and service mesh implementation.");

        // COMPLETED — past sessions
        saveAppointment(s6,  l1, base.minusDays(7).withHour(9).withMinute(0),  base.minusDays(7).withHour(9).withMinute(30),  Appointment.Status.COMPLETED, "[Year 1 Semester 2] Introduction to Python programming — help with list comprehensions and file I/O for the student marks system.");
        saveAppointment(s10, l5, base.minusDays(5).withHour(15).withMinute(0), base.minusDays(5).withHour(15).withMinute(30), Appointment.Status.COMPLETED, "[Year 1 Semester 1] Cybersecurity fundamentals — understanding the CIA triad and common attack vectors.");
        saveAppointment(s3,  l3, base.minusDays(3).withHour(14).withMinute(0), base.minusDays(3).withHour(14).withMinute(30), Appointment.Status.COMPLETED, "[Year 2 Semester 2] Cloud computing lab — AWS EC2 instance setup and S3 bucket configuration walkthrough.");
        saveAppointment(s8,  l2, base.minusDays(4).withHour(10).withMinute(0), base.minusDays(4).withHour(10).withMinute(30), Appointment.Status.COMPLETED, "[Year 2 Semester 1] Agile methodology quiz preparation — Scrum ceremonies and user story writing practice.");
        saveAppointment(s18, l9, base.minusDays(6).withHour(14).withMinute(0), base.minusDays(6).withHour(14).withMinute(30), Appointment.Status.COMPLETED, "[Year 3 Semester 2] Web API design patterns — RESTful principles and best practices.");
        saveAppointment(s22, l10, base.minusDays(2).withHour(13).withMinute(0), base.minusDays(2).withHour(13).withMinute(30), Appointment.Status.COMPLETED, "[Year 3 Semester 1] Mobile development debugging techniques — using Android Studio debugger effectively.");
        saveAppointment(s23, l12, base.minusDays(8).withHour(15).withMinute(0), base.minusDays(8).withHour(15).withMinute(30), Appointment.Status.COMPLETED, "[Year 1 Semester 2] Test case design fundamentals — boundary value analysis and equivalence partitioning.");

        // CANCELLED
        saveAppointment(s5,  l3, base.minusDays(2).withHour(13).withMinute(0), base.minusDays(2).withHour(13).withMinute(30), Appointment.Status.CANCELLED, "[Year 3 Semester 2] Network topology design — cancelled due to student illness.");
        saveAppointment(s24, l14, base.minusDays(1).withHour(14).withMinute(0), base.minusDays(1).withHour(14).withMinute(30), Appointment.Status.CANCELLED, "[Year 4 Semester 2] System architecture review — rescheduled to next week.");

        // ── Canned Responses ─────────────────────────────────────────────────
        saveCanned(l1, "Appointment Confirmed",
                "Your appointment has been confirmed. Please join via the meeting link provided. Ensure you have reviewed the relevant lecture notes beforehand. If you need to reschedule, please notify me at least 24 hours in advance.");
        saveCanned(l1, "FYP Submission Guidelines",
                "For your Final Year Project submission, please ensure: (1) Abstract is under 300 words, (2) All references follow IEEE format, (3) Source code is uploaded to the department GitLab, (4) Plagiarism report is below 15%. Submit via the SLIIT LMS portal by the deadline.");
        saveCanned(l1, "Research Paper Feedback",
                "Thank you for sharing your research draft. I will review it within 3 working days. Please ensure your methodology section clearly states the dataset source and preprocessing steps. For Sri Lankan datasets, cite the Department of Census and Statistics or the Central Bank of Sri Lanka.");

        saveCanned(l2, "Sprint Review Reminder",
                "Please prepare your sprint demo before our meeting. I expect to see: (1) Working software increment, (2) Updated burndown chart, (3) Retrospective notes. Use Jira or Trello to track your backlog items.");
        saveCanned(l2, "Reschedule Request",
                "I need to reschedule our appointment due to a faculty meeting. I will send you a new time slot shortly. Apologies for the inconvenience — please check your university email for the updated calendar invite.");
        saveCanned(l2, "Assignment Extension Policy",
                "Extension requests must be submitted via the faculty portal at least 48 hours before the deadline. Medical certificates must be from a registered Sri Lanka Medical Council practitioner. Late submissions without approval will incur a 10% penalty per day.");

        saveCanned(l3, "Lab Access Instructions",
                "To access the cybersecurity lab: (1) Use your university ID card at the door, (2) Log in with your MRT network credentials, (3) All tools are pre-installed on the Kali Linux VMs. Do not install unauthorised software. Lab hours: 8 AM – 8 PM weekdays.");
        saveCanned(l3, "Cloud Project Setup",
                "For the AWS lab exercises, use the AWS Educate account provided by the department. Do NOT use personal credit cards. All resources must be terminated after each session to avoid charges. The department budget is limited — please be responsible.");

        saveCanned(l4, "Dataset Resources",
                "For Sri Lankan datasets, I recommend: (1) data.gov.lk — government open data portal, (2) Central Bank Annual Reports for economic data, (3) Department of Census and Statistics for demographic data, (4) Sri Lanka Tourism Development Authority for tourism statistics. Always cite your data source.");
        saveCanned(l4, "Tableau Help",
                "For Tableau issues, refer to the official Tableau Public tutorials. The university has a site licence — download from the IT department portal. For Sri Lanka map visualisations, use the GeoJSON file available on the course Moodle page.");

        saveCanned(l5, "CTF Challenge Info",
                "The next Capture The Flag competition is hosted on HackTheBox. Register with your university email. This is a great opportunity to apply what we've learned in class. Top 3 performers will receive extra credit. Good luck!");
        saveCanned(l5, "Ethical Hacking Reminder",
                "IMPORTANT: All penetration testing must ONLY be performed on the designated lab environment (192.168.100.0/24). Testing on any external system without written authorisation is illegal under the Sri Lanka Computer Crimes Act No. 24 of 2007. Violations will result in immediate disciplinary action.");

        saveCanned(l6, "IoT Lab Components",
                "The IoT lab kit includes: Raspberry Pi 4, Arduino Uno, DHT22 sensor, PIR motion sensor, relay module, and jumper wires. Components are available from the lab technician (Mr. Suresh, Room 101). Please sign the equipment register. Return all items by end of semester.");

        saveCanned(l7, "Blockchain Resources",
                "For the blockchain assignment, use the Ethereum Sepolia testnet — never use mainnet. Get test ETH from the Sepolia faucet. Recommended tools: Remix IDE, MetaMask, Hardhat. The Sri Lanka Blockchain Association website has local use-case studies relevant to your project.");

        saveCanned(l8, "Database Performance Tips",
                "For optimal database performance: (1) Always use appropriate indexes, (2) Avoid SELECT * queries, (3) Use query execution plans to identify bottlenecks, (4) Normalize your schema properly. I recommend using EXPLAIN ANALYZE in PostgreSQL to understand query performance.");
        saveCanned(l8, "SQL Assignment Submission",
                "Please submit your SQL scripts with: (1) Clear comments explaining each query, (2) Sample output showing results, (3) Execution time for complex queries. Use the university GitLab repository for version control.");

        saveCanned(l9, "Web Development Best Practices",
                "For your web projects: (1) Follow RESTful API design principles, (2) Implement proper error handling, (3) Use environment variables for configuration, (4) Write unit tests for critical functions. Code quality matters more than features.");
        saveCanned(l9, "Frontend Framework Guidance",
                "React is our primary framework. Key points: (1) Use functional components with hooks, (2) Manage state efficiently with Context API or Redux, (3) Optimize performance with React.memo and useMemo, (4) Follow component composition best practices.");

        saveCanned(l10, "Mobile Development Setup",
                "For Flutter development: (1) Install Flutter SDK from flutter.dev, (2) Use Android Studio or VS Code with Flutter extension, (3) Test on both Android and iOS emulators, (4) Follow Material Design guidelines. Refer to the official Flutter documentation for detailed tutorials.");
        saveCanned(l10, "App Submission Guidelines",
                "Before submitting your mobile app: (1) Test on multiple devices, (2) Ensure all permissions are properly declared, (3) Optimize app size and performance, (4) Include proper error handling and user feedback. Submit APK/IPA files via the course portal.");

        saveCanned(l11, "Business Analytics Report Template",
                "Your analytics report should include: (1) Executive summary, (2) Data sources and methodology, (3) Key findings with visualizations, (4) Recommendations based on insights, (5) Limitations and future work. Use professional formatting and cite all sources.");
        saveCanned(l11, "Market Research Guidelines",
                "When conducting market research: (1) Define your research questions clearly, (2) Use appropriate sampling methods, (3) Analyze data using statistical tools, (4) Present findings with supporting evidence. Ethical considerations are paramount.");

        saveCanned(l12, "Test Automation Framework",
                "For QA automation: (1) Use Selenium with Java for web testing, (2) Implement Page Object Model pattern, (3) Write clear and maintainable test cases, (4) Use TestNG for test management. Aim for 80%+ code coverage for critical features.");
        saveCanned(l12, "Bug Report Template",
                "When reporting bugs: (1) Provide clear steps to reproduce, (2) Include expected vs actual behavior, (3) Attach screenshots or logs, (4) Specify environment details (OS, browser, version). Well-documented bugs are easier to fix.");

        saveCanned(l13, "Deep Learning Project Setup",
                "For your deep learning projects: (1) Use TensorFlow or PyTorch, (2) Prepare and normalize your dataset properly, (3) Implement proper train/validation/test splits, (4) Monitor training with TensorBoard. Document your model architecture and hyperparameters.");
        saveCanned(l13, "Neural Network Optimization",
                "Key optimization techniques: (1) Experiment with different activation functions, (2) Use batch normalization to stabilize training, (3) Implement dropout for regularization, (4) Try different optimizers (Adam, SGD, RMSprop). Keep detailed notes of your experiments.");

        saveCanned(l14, "Microservices Architecture",
                "When designing microservices: (1) Keep services loosely coupled, (2) Use API gateways for routing, (3) Implement proper service discovery, (4) Use message queues for async communication. Document your service boundaries clearly.");
        saveCanned(l14, "System Scalability Review",
                "For scalability assessment: (1) Analyze bottlenecks using profiling tools, (2) Consider horizontal vs vertical scaling, (3) Implement caching strategies, (4) Use load balancing. Performance testing is essential before deployment.");

        System.out.println("✅ Sri Lanka sample data loaded: 14 lecturers, 24 students, 27 appointments, weekly availability slots, and 42 canned responses.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User saveUser(String email, String name, User.Role role, String dept, String phone, String expertise) {
        User u = User.builder()
                .email(email)
                .name(name)
                .role(role)
                .department(dept)
                .phone(phone)
                .expertise(expertise)
                .passwordHash(encoder.encode("Password@123"))
                .build();
        return userRepository.save(u);
    }

    private void saveLecturerProfile(User user, String empCode, String designation, String office, String hours, String bio) {
        LecturerProfile p = LecturerProfile.builder()
                .user(user)
                .employeeCode(empCode)
                .designation(designation)
                .officeLocation(office)
                .officeHours(hours)
                .bio(bio)
                .build();
        lecturerProfileRepository.save(p);
    }

    private void saveStudentProfile(User user, String regNo, String batch, String year, String semester) {
        StudentProfile p = StudentProfile.builder()
                .user(user)
                .registrationNumber(regNo)
                .batch(batch)
                .academicYear(year)
                .semester(semester)
                .build();
        studentProfileRepository.save(p);
    }

    private void seedWeeklySlots(User lecturer, List<String> days, List<String> startTimes) {
        for (String day : days) {
            for (String st : startTimes) {
                LocalTime start = LocalTime.parse(st);
                LocalTime end   = start.plusMinutes(30);
                AvailabilitySlot slot = AvailabilitySlot.builder()
                        .lecturer(lecturer)
                        .dayOfWeek(day)
                        .slotDate(LocalDate.of(2099, 1, 1))
                        .startTime(start)
                        .endTime(end)
                        .status(AvailabilitySlot.SlotStatus.AVAILABLE)
                        .mode("Physical")
                        .build();
                availabilitySlotRepository.save(slot);
            }
        }
    }

    private void saveAppointment(User student, User lecturer,
                                  LocalDateTime start, LocalDateTime end,
                                  Appointment.Status status, String notes) {
        appointmentRepository.save(Appointment.builder()
                .student(student).lecturer(lecturer)
                .startTime(start).endTime(end)
                .status(status).notes(notes)
                .build());
    }

    private void saveCanned(User lecturer, String title, String content) {
        cannedResponseRepository.save(CannedResponse.builder()
                .lecturer(lecturer).title(title).content(content)
                .build());
    }
}
