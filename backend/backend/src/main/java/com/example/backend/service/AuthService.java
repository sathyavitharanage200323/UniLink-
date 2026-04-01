package com.example.backend.service;

import com.example.backend.dto.AuthUserResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.model.LecturerProfile;
import com.example.backend.model.StudentProfile;
import com.example.backend.model.User;
import com.example.backend.repository.LecturerProfileRepository;
import com.example.backend.repository.StudentProfileRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final LecturerProfileRepository lecturerProfileRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Transactional
    public AuthUserResponse register(RegisterRequest req) {
        validateRegisterRequest(req);

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = User.builder()
                .name(req.getName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(encoder.encode(req.getPassword()))
                .role(req.getRole())
                .department(req.getDepartment())
                .phone(req.getPhone())
                .expertise(req.getRole() == User.Role.LECTURER ? req.getExpertise() : null)
                .build();
        user = userRepository.save(user);

        StudentProfile student = null;
        LecturerProfile lecturer = null;

        if (req.getRole() == User.Role.STUDENT) {
            if (studentProfileRepository.existsByRegistrationNumber(req.getRegistrationNumber())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration number already exists");
            }
            student = StudentProfile.builder()
                    .user(user)
                    .registrationNumber(req.getRegistrationNumber().trim())
                    .batch(req.getBatch())
                    .academicYear(req.getAcademicYear())
                    .semester(req.getSemester())
                    .build();
            student = studentProfileRepository.save(student);
        } else {
            if (lecturerProfileRepository.existsByEmployeeCode(req.getEmployeeCode())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee code already exists");
            }
            lecturer = LecturerProfile.builder()
                    .user(user)
                    .employeeCode(req.getEmployeeCode().trim())
                    .designation(req.getDesignation())
                    .officeLocation(req.getOfficeLocation())
                    .officeHours(req.getOfficeHours())
                    .bio(req.getBio())
                    .build();
            lecturer = lecturerProfileRepository.save(lecturer);
        }

        return AuthUserResponse.from(user, student, lecturer);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse login(LoginRequest req) {
        if (req == null || isBlank(req.getEmail()) || isBlank(req.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!encoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        StudentProfile student = null;
        LecturerProfile lecturer = null;
        if (user.getRole() == User.Role.STUDENT) {
            student = studentProfileRepository.findById(user.getId()).orElse(null);
        } else {
            lecturer = lecturerProfileRepository.findById(user.getId()).orElse(null);
        }

        return AuthUserResponse.from(user, student, lecturer);
    }

    private void validateRegisterRequest(RegisterRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (isBlank(req.getName()) || req.getName().trim().length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be at least 3 characters");
        }
        if (isBlank(req.getEmail()) || !req.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid email is required");
        }
        if (isBlank(req.getPassword()) || req.getPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }
        if (req.getRole() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }
        if (req.getRole() == User.Role.STUDENT && isBlank(req.getRegistrationNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration number is required for students");
        }
        if (req.getRole() == User.Role.LECTURER && isBlank(req.getEmployeeCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee code is required for lecturers");
        }
        if (req.getRole() == User.Role.LECTURER && isBlank(req.getDesignation())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Designation is required for lecturers");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
