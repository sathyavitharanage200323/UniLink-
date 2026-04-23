package com.example.backend.config;

import com.example.backend.model.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ── passwords ────────────────────────────────────────────────────────────
    private static final String STUDENT_PASS  = "Student@123";
    private static final String LECTURER_PASS = "Lecturer@123";
    private static final String ADMIN_PASS    = "admin123";
    private static final String ADMIN_EMAIL   = "admin@gmail.com";

    @Override
    @Transactional
    public void run(String... args) {
        ensureAdminUser();

        if (userRepository.count() <= 1) {   // only admin exists → seed everything
            List<User> lecturers = seedLecturers();
            List<User> students  = seedStudents();
            seedAvailabilitySlots(lecturers);
            seedAppointments(students, lecturers);
            seedCannedResponses(lecturers);
            System.out.println("✅ UniLink sample data loaded successfully.");
        } else {
            System.out.println("ℹ️  Database already has " + userRepository.count() + " users — skipping seed.");
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    private void ensureAdminUser() {
        userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(
            admin -> {
                admin.setRole(User.Role.ADMIN);
                admin.setPasswordHash(encoder.encode(ADMIN_PASS));
                admin.setName("System Admin");
                admin.setDepartment("Administration");
                userRepository.save(admin);
            },
            () -> userRepository.save(User.builder()
                    .email(ADMIN_EMAIL)
                    .passwordHash(encoder.encode(ADMIN_PASS))
                    .name("System Admin")
                    .role(User.Role.ADMIN)
                    .department("Administration")
                    .build())
        );
    }

    // ── Lecturers ─────────────────────────────────────────────────────────────
    private List<User> seedLecturers() {

        record LecturerData(String email, String name, String dept, String expertise,
                            String phone, String empCode, String designation,
                            String office, String hours, String bio) {}

        var data = List.of(
            new LecturerData(
                "dr.silva@unilink.edu", "Dr. Amara Silva",
                "Computer Science", "Software Engineering & Design Patterns",
                "+94 77 100 2001", "EMP-CS-001", "Senior Lecturer",
                "Block A, Room 204", "Mon/Wed 09:00–11:00",
                "Dr. Silva specialises in software architecture and agile methodologies with 12 years of industry and academic experience."
            ),
            new LecturerData(
                "prof.perera@unilink.edu", "Prof. Nimal Perera",
                "Information Technology", "Database Systems & Cloud Computing",
                "+94 77 100 2002", "EMP-IT-001", "Professor",
                "Block B, Room 310", "Tue/Thu 14:00–16:00",
                "Prof. Perera leads the Database Research Lab and has published over 30 papers on distributed systems."
            ),
            new LecturerData(
                "ms.fernando@unilink.edu", "Ms. Dilini Fernando",
                "Computer Science", "Machine Learning & Data Science",
                "+94 77 100 2003", "EMP-CS-002", "Lecturer",
                "Block A, Room 108", "Mon/Fri 13:00–15:00",
                "Ms. Fernando focuses on applied ML and has collaborated with several tech startups on AI-driven products."
            ),
            new LecturerData(
                "dr.jayawardena@unilink.edu", "Dr. Kasun Jayawardena",
                "Information Technology", "Cybersecurity & Network Engineering",
                "+94 77 100 2004", "EMP-IT-002", "Senior Lecturer",
                "Block C, Room 412", "Wed/Fri 10:00–12:00",
                "Dr. Jayawardena is a certified ethical hacker and advises the university's IT security committee."
            )
        );

        return data.stream().map(d -> {
            User u = userRepository.save(User.builder()
                    .email(d.email()).passwordHash(encoder.encode(LECTURER_PASS))
                    .name(d.name()).role(User.Role.LECTURER)
                    .department(d.dept()).expertise(d.expertise())
                    .phone(d.phone()).notificationEnabled(true)
                    .build());

            lecturerProfileRepository.save(LecturerProfile.builder()
                    .user(u).employeeCode(d.empCode())
                    .designation(d.designation()).officeLocation(d.office())
                    .officeHours(d.hours()).bio(d.bio())
                    .build());
            return u;
        }).toList();
    }

    // ── Students ──────────────────────────────────────────────────────────────
    private List<User> seedStudents() {

        record StudentData(String email, String name, String dept, String phone,
                           String regNo, String batch, String year, String sem) {}

        var data = List.of(
            new StudentData("sathya.k@unilink.edu",   "Sathya Kumari",    "Computer Science",      "+94 71 200 3001", "IT23761001", "2023", "2nd Year", "Semester 3"),
            new StudentData("ravindu.m@unilink.edu",  "Ravindu Mendis",   "Computer Science",      "+94 71 200 3002", "IT23761002", "2023", "2nd Year", "Semester 3"),
            new StudentData("ishara.w@unilink.edu",   "Ishara Wijesinghe","Information Technology", "+94 71 200 3003", "IT23762001", "2023", "2nd Year", "Semester 3"),
            new StudentData("chamodi.p@unilink.edu",  "Chamodi Perera",   "Information Technology", "+94 71 200 3004", "IT23762002", "2023", "2nd Year", "Semester 4"),
            new StudentData("nuwan.s@unilink.edu",    "Nuwan Senanayake", "Computer Science",      "+94 71 200 3005", "IT22761001", "2022", "3rd Year", "Semester 5"),
            new StudentData("malsha.d@unilink.edu",   "Malsha De Silva",  "Computer Science",      "+94 71 200 3006", "IT22761002", "2022", "3rd Year", "Semester 6")
        );

        return data.stream().map(d -> {
            User u = userRepository.save(User.builder()
                    .email(d.email()).passwordHash(encoder.encode(STUDENT_PASS))
                    .name(d.name()).role(User.Role.STUDENT)
                    .department(d.dept()).phone(d.phone())
                    .notificationEnabled(true)
                    .build());

            studentProfileRepository.save(StudentProfile.builder()
                    .user(u).registrationNumber(d.regNo())
                    .batch(d.batch()).academicYear(d.year()).semester(d.sem())
                    .build());
            return u;
        }).toList();
    }

    // ── Availability Slots ────────────────────────────────────────────────────
    private void seedAvailabilitySlots(List<User> lecturers) {
        // Generate slots for the next 7 working days for each lecturer
        LocalDate today = LocalDate.now();

        // Each lecturer gets a different time pattern
        LocalTime[][] patterns = {
            { LocalTime.of(9, 0), LocalTime.of(10, 0), LocalTime.of(11, 0) },   // lecturer 0
            { LocalTime.of(14, 0), LocalTime.of(15, 0), LocalTime.of(16, 0) },  // lecturer 1
            { LocalTime.of(10, 0), LocalTime.of(13, 0), LocalTime.of(14, 0) },  // lecturer 2
            { LocalTime.of(9, 0), LocalTime.of(11, 0), LocalTime.of(15, 0) }    // lecturer 3
        };

        for (int li = 0; li < lecturers.size(); li++) {
            User lecturer = lecturers.get(li);
            LocalTime[] times = patterns[li % patterns.length];
            int daysAdded = 0;
            LocalDate date = today;

            while (daysAdded < 7) {
                // skip weekends
                if (date.getDayOfWeek().getValue() <= 5) {
                    for (LocalTime start : times) {
                        availabilitySlotRepository.save(AvailabilitySlot.builder()
                                .lecturer(lecturer)
                                .slotDate(date)
                                .startTime(start)
                                .endTime(start.plusMinutes(30))
                                .status(AvailabilitySlot.SlotStatus.AVAILABLE)
                                .isAvailable(true)
                                .mode(li % 2 == 0 ? "Physical" : "Online")
                                .location(li % 2 == 0 ? "Block A, Room 204" : null)
                                .meetingLink(li % 2 != 0 ? "https://meet.unilink.edu/room/" + lecturer.getId() : null)
                                .build());
                    }
                    daysAdded++;
                }
                date = date.plusDays(1);
            }
        }
    }

    // ── Appointments ──────────────────────────────────────────────────────────
    private void seedAppointments(List<User> students, List<User> lecturers) {
        LocalDateTime base = LocalDateTime.now().minusDays(5).withHour(10).withMinute(0).withSecond(0).withNano(0);

        record ApptData(int studentIdx, int lecturerIdx, int daysOffset, int hour,
                        Appointment.Status status, String notes) {}

        var appts = List.of(
            new ApptData(0, 0,  -5, 9,  Appointment.Status.COMPLETED, "Discuss final year project proposal and research scope."),
            new ApptData(1, 0,  -3, 10, Appointment.Status.COMPLETED, "Code review for assignment 2 — Spring Boot REST API."),
            new ApptData(2, 1,  -2, 14, Appointment.Status.CONFIRMED, "Help with SQL query optimisation for the group project."),
            new ApptData(3, 1,  -1, 15, Appointment.Status.CONFIRMED, "Clarification on cloud deployment assignment requirements."),
            new ApptData(4, 2,   0, 10, Appointment.Status.PENDING,   "Guidance on ML model selection for capstone project."),
            new ApptData(5, 2,   1, 13, Appointment.Status.PENDING,   "Review of data preprocessing pipeline and feature engineering."),
            new ApptData(0, 3,   2, 9,  Appointment.Status.PENDING,   "Questions about network security lab report."),
            new ApptData(1, 3,   3, 11, Appointment.Status.PENDING,   "Discuss ethical hacking assignment scope and tools."),
            new ApptData(2, 0,  -7, 9,  Appointment.Status.CANCELLED, "Had to cancel due to timetable clash."),
            new ApptData(3, 1,  -6, 14, Appointment.Status.COMPLETED, "Reviewed ER diagram for database design project.")
        );

        appts.forEach(a -> {
            LocalDateTime start = base.plusDays(a.daysOffset()).withHour(a.hour());
            appointmentRepository.save(Appointment.builder()
                    .student(students.get(a.studentIdx()))
                    .lecturer(lecturers.get(a.lecturerIdx()))
                    .startTime(start)
                    .endTime(start.plusMinutes(30))
                    .status(a.status())
                    .notes(a.notes())
                    .build());
        });
    }

    // ── Canned Responses ──────────────────────────────────────────────────────
    private void seedCannedResponses(List<User> lecturers) {
        record CannedData(String title, String content) {}

        var common = List.of(
            new CannedData("Appointment Confirmed",
                "Your appointment has been confirmed. Please come prepared with your questions and any relevant materials."),
            new CannedData("Please Check the Portal",
                "The information you need is available on the student portal. Please check there first before booking a session."),
            new CannedData("Reschedule Request",
                "I'm unable to make our scheduled time. Please book a new slot through the system at your convenience."),
            new CannedData("Assignment Submission Reminder",
                "Please ensure your assignment is submitted via the portal before the deadline. Late submissions will not be accepted.")
        );

        var extra = List.of(
            new CannedData("Office Hours Reminder",
                "Remember that I hold regular office hours. For quick questions, please visit during those times instead of booking a full slot."),
            new CannedData("Research Guidance",
                "For research-related queries, please bring a written summary of your topic and the specific questions you need answered.")
        );

        for (int i = 0; i < lecturers.size(); i++) {
            User lecturer = lecturers.get(i);
            List<CannedData> responses = (i < 2) ? common : extra;
            responses.forEach(r -> cannedResponseRepository.save(CannedResponse.builder()
                    .lecturer(lecturer)
                    .title(r.title())
                    .content(r.content())
                    .build()));
        }
    }
}
