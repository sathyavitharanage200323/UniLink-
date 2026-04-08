package com.example.backend.service;

import com.example.backend.dto.AuthUserResponse;
import com.example.backend.dto.UserProfileUpdateRequest;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.LecturerProfile;
import com.example.backend.model.StudentProfile;
import com.example.backend.model.User;
import com.example.backend.repository.LecturerProfileRepository;
import com.example.backend.repository.StudentProfileRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final LecturerProfileRepository lecturerProfileRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public AuthUserResponse getFullUser(Long id) {
        User user = getUser(id);
        StudentProfile student = null;
        LecturerProfile lecturer = null;
        if (user.getRole() == User.Role.STUDENT) {
            student = studentProfileRepository.findById(user.getId()).orElse(null);
        } else if (user.getRole() == User.Role.LECTURER) {
            lecturer = lecturerProfileRepository.findById(user.getId()).orElse(null);
        }
        return AuthUserResponse.from(user, student, lecturer);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    @Transactional
    public User save(User user) {
        if (user.getPasswordHash() == null || user.getPasswordHash().trim().isEmpty()) {
            user.setPasswordHash(encoder.encode("ChangeMe123!"));
        }
        return userRepository.save(user);
    }

    /** Lecturer toggles Do Not Disturb mode, optionally setting an auto-reply message. */
    @Transactional
    public User toggleDoNotDisturb(Long lecturerId, boolean dnd, String autoReplyMessage) {
        User lecturer = getUser(lecturerId);
        lecturer.setDoNotDisturb(dnd);
        if (autoReplyMessage != null) {
            lecturer.setAutoReplyMessage(autoReplyMessage);
        }
        return userRepository.save(lecturer);
    }

    @Transactional
    public AuthUserResponse updateProfile(Long userId, UserProfileUpdateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        User user = getUser(userId);

        if (!isBlank(request.getName())) {
            user.setName(request.getName().trim());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(trimToNull(request.getDepartment()));
        }
        if (request.getPhone() != null) {
            user.setPhone(trimToNull(request.getPhone()));
        }

        StudentProfile student = null;
        LecturerProfile lecturer = null;

        if (user.getRole() == User.Role.STUDENT) {
            student = studentProfileRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile", userId));

            if (request.getRegistrationNumber() != null
                    && !request.getRegistrationNumber().trim().equals(student.getRegistrationNumber())
                    && studentProfileRepository.existsByRegistrationNumber(request.getRegistrationNumber().trim())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration number already exists");
            }

            if (request.getRegistrationNumber() != null) {
                student.setRegistrationNumber(request.getRegistrationNumber().trim());
            }
            if (request.getBatch() != null) {
                student.setBatch(trimToNull(request.getBatch()));
            }
            if (request.getAcademicYear() != null) {
                student.setAcademicYear(trimToNull(request.getAcademicYear()));
            }
            if (request.getSemester() != null) {
                student.setSemester(trimToNull(request.getSemester()));
            }
        } else {
            lecturer = lecturerProfileRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lecturer profile", userId));

            if (request.getEmployeeCode() != null
                    && !request.getEmployeeCode().trim().equals(lecturer.getEmployeeCode())
                    && lecturerProfileRepository.existsByEmployeeCode(request.getEmployeeCode().trim())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee code already exists");
            }

            user.setExpertise(trimToNull(request.getExpertise()));

            if (request.getEmployeeCode() != null) {
                lecturer.setEmployeeCode(request.getEmployeeCode().trim());
            }
            if (request.getDesignation() != null) {
                lecturer.setDesignation(trimToNull(request.getDesignation()));
            }
            if (request.getOfficeLocation() != null) {
                lecturer.setOfficeLocation(trimToNull(request.getOfficeLocation()));
            }
            if (request.getOfficeHours() != null) {
                lecturer.setOfficeHours(trimToNull(request.getOfficeHours()));
            }
            if (request.getBio() != null) {
                lecturer.setBio(trimToNull(request.getBio()));
            }
        }

        if (!isBlank(request.getNewPassword())) {
            if (isBlank(request.getCurrentPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required to set a new password");
            }
            if (!encoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }
            if (request.getNewPassword().length() < 8) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
            }
            user.setPasswordHash(encoder.encode(request.getNewPassword()));
        }

        user = userRepository.save(user);

        if (student != null) {
            student = studentProfileRepository.save(student);
        }
        if (lecturer != null) {
            lecturer = lecturerProfileRepository.save(lecturer);
        }

        return AuthUserResponse.from(user, student, lecturer);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = getUser(userId);
        userRepository.delete(user);
    }

    @Transactional
    public AuthUserResponse uploadProfileImage(Long userId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (image.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be under 5MB");
        }
        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }
        try {
            Path uploadPath = Paths.get(uploadDir, "profiles");
            Files.createDirectories(uploadPath);
            String ext = image.getOriginalFilename().substring(image.getOriginalFilename().lastIndexOf("."));
            String filename = UUID.randomUUID().toString() + ext;
            Files.write(uploadPath.resolve(filename), image.getBytes());

            User user = getUser(userId);
            user.setProfileImage("profiles/" + filename);
            user = userRepository.save(user);

            StudentProfile student = user.getRole() == User.Role.STUDENT
                ? studentProfileRepository.findById(userId).orElse(null) : null;
            LecturerProfile lecturer = user.getRole() == User.Role.LECTURER
                ? lecturerProfileRepository.findById(userId).orElse(null) : null;
            return AuthUserResponse.from(user, student, lecturer);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save image");
        }
    }

    @Transactional(readOnly = true)
    public List<AuthUserResponse> searchLecturers(String query, String department, String designation) {
        final String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        final String dept = department == null ? "" : department.trim().toLowerCase(Locale.ROOT);
        final String desig = designation == null ? "" : designation.trim().toLowerCase(Locale.ROOT);

        return userRepository.findByRole(User.Role.LECTURER).stream()
            .map(this::toLecturerSearchResponse)
                .filter(r -> q.isEmpty()
                        || containsIgnoreCase(r.getName(), q)
                        || containsIgnoreCase(r.getEmail(), q)
                        || containsIgnoreCase(r.getExpertise(), q)
                        || containsIgnoreCase(r.getEmployeeCode(), q))
                .filter(r -> dept.isEmpty() || containsIgnoreCase(r.getDepartment(), dept))
                .filter(r -> desig.isEmpty() || containsIgnoreCase(r.getDesignation(), desig))
                .collect(Collectors.toList());
    }

    private AuthUserResponse toLecturerSearchResponse(User user) {
        try {
            LecturerProfile profile = lecturerProfileRepository.findById(user.getId()).orElse(null);
            return AuthUserResponse.from(user, null, profile);
        } catch (Exception ignored) {
            // Fall back to base user data so lecturer search still works.
            return AuthUserResponse.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .department(user.getDepartment())
                    .phone(user.getPhone())
                    .expertise(user.getExpertise())
                    .doNotDisturb(user.isDoNotDisturb())
                    .autoReplyMessage(user.getAutoReplyMessage())
                    .build();
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean containsIgnoreCase(String source, String needleLower) {
        return source != null && source.toLowerCase(Locale.ROOT).contains(needleLower);
    }
}
