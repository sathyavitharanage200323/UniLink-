package com.example.backend.service;

import com.example.backend.dto.AuthUserResponse;
import com.example.backend.dto.ManagementUserUpdateRequest;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.LecturerProfile;
import com.example.backend.model.StudentProfile;
import com.example.backend.model.User;
import com.example.backend.repository.LecturerProfileRepository;
import com.example.backend.repository.StudentProfileRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagementService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final LecturerProfileRepository lecturerProfileRepository;

    @Transactional(readOnly = true)
    public List<AuthUserResponse> getStudents() {
        return userRepository.findByRole(User.Role.STUDENT).stream()
                .map(user -> AuthUserResponse.from(user, studentProfileRepository.findById(user.getId()).orElse(null), null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuthUserResponse> getLecturers() {
        return userRepository.findByRole(User.Role.LECTURER).stream()
                .map(user -> AuthUserResponse.from(user, null, lecturerProfileRepository.findById(user.getId()).orElse(null)))
                .collect(Collectors.toList());
    }

    @Transactional
    public AuthUserResponse updateStudent(Long userId, ManagementUserUpdateRequest req) {
        User user = getUserByRole(userId, User.Role.STUDENT);
        StudentProfile profile = studentProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile", userId));

        user.setName(req.getName());
        user.setDepartment(req.getDepartment());
        user.setPhone(req.getPhone());

        if (req.getRegistrationNumber() != null && !req.getRegistrationNumber().equals(profile.getRegistrationNumber())
                && studentProfileRepository.existsByRegistrationNumber(req.getRegistrationNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration number already exists");
        }

        profile.setRegistrationNumber(req.getRegistrationNumber());
        profile.setBatch(req.getBatch());
        profile.setAcademicYear(req.getAcademicYear());
        profile.setSemester(req.getSemester());

        userRepository.save(user);
        studentProfileRepository.save(profile);

        return AuthUserResponse.from(user, profile, null);
    }

    @Transactional
    public AuthUserResponse updateLecturer(Long userId, ManagementUserUpdateRequest req) {
        User user = getUserByRole(userId, User.Role.LECTURER);
        LecturerProfile profile = lecturerProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer profile", userId));

        user.setName(req.getName());
        user.setDepartment(req.getDepartment());
        user.setPhone(req.getPhone());
        user.setExpertise(req.getExpertise());

        if (req.getEmployeeCode() != null && !req.getEmployeeCode().equals(profile.getEmployeeCode())
                && lecturerProfileRepository.existsByEmployeeCode(req.getEmployeeCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee code already exists");
        }

        profile.setEmployeeCode(req.getEmployeeCode());
        profile.setDesignation(req.getDesignation());
        profile.setOfficeLocation(req.getOfficeLocation());
        profile.setOfficeHours(req.getOfficeHours());
        profile.setBio(req.getBio());

        userRepository.save(user);
        lecturerProfileRepository.save(profile);

        return AuthUserResponse.from(user, null, profile);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        userRepository.delete(user);
    }

    private User getUserByRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getRole() != role) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User role mismatch");
        }
        return user;
    }
}
