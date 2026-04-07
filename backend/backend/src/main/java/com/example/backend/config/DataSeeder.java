package com.example.backend.config;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            // Create sample students
            User student1 = User.builder()
                    .email("student1@unilink.edu")
                    .passwordHash(encoder.encode("Student@123"))
                    .name("John Student")
                    .role(User.Role.STUDENT)
                    .department("Computer Science")
                    .build();

            User student2 = User.builder()
                    .email("student2@unilink.edu")
                    .passwordHash(encoder.encode("Student@123"))
                    .name("Jane Student")
                    .role(User.Role.STUDENT)
                    .department("Information Technology")
                    .build();

            // Create sample lecturers
            User lecturer1 = User.builder()
                    .email("lecturer1@unilink.edu")
                    .passwordHash(encoder.encode("Lecturer@123"))
                    .name("Dr. Smith")
                    .role(User.Role.LECTURER)
                    .department("Computer Science")
                    .expertise("Software Engineering")
                    .build();

            User lecturer2 = User.builder()
                    .email("lecturer2@unilink.edu")
                    .passwordHash(encoder.encode("Lecturer@123"))
                    .name("Prof. Johnson")
                    .role(User.Role.LECTURER)
                    .department("Information Technology")
                    .expertise("Database Management")
                    .build();

            userRepository.save(student1);
            userRepository.save(student2);
            userRepository.save(lecturer1);
            userRepository.save(lecturer2);

            System.out.println("Sample data loaded: 2 students and 2 lecturers created");
        } else {
            System.out.println("Database already contains " + userRepository.count() + " users");
        }

        ensureAdminUser();
    }

    private void ensureAdminUser() {
        String adminEmail = "admin@gmail.com";
        String adminPassword = "admin123";

        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .email(adminEmail)
                    .passwordHash(encoder.encode(adminPassword))
                    .name("System Admin")
                    .role(User.Role.ADMIN)
                    .department("Administration")
                    .build();
        } else {
            admin.setRole(User.Role.ADMIN);
            admin.setName(admin.getName() == null || admin.getName().isBlank() ? "System Admin" : admin.getName());
            admin.setDepartment(admin.getDepartment() == null ? "Administration" : admin.getDepartment());
            admin.setPasswordHash(encoder.encode(adminPassword));
        }

        userRepository.save(admin);
    }
}
