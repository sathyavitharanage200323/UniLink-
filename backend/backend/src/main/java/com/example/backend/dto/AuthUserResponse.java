package com.example.backend.dto;

import com.example.backend.model.LecturerProfile;
import com.example.backend.model.StudentProfile;
import com.example.backend.model.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthUserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String department;
    private String phone;
    private String expertise;
    private boolean doNotDisturb;
    private boolean notificationEnabled;
    private String autoReplyMessage;

    private String registrationNumber;
    private String batch;
    private String academicYear;
    private String semester;

    private String employeeCode;
    private String designation;
    private String officeLocation;
    private String officeHours;
    private String bio;

    public static AuthUserResponse from(User user, StudentProfile student, LecturerProfile lecturer) {
        return AuthUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .expertise(user.getExpertise())
                .doNotDisturb(user.isDoNotDisturb())
                .notificationEnabled(user.isNotificationEnabled())
                .autoReplyMessage(user.getAutoReplyMessage())
                .registrationNumber(student != null ? student.getRegistrationNumber() : null)
                .batch(student != null ? student.getBatch() : null)
                .academicYear(student != null ? student.getAcademicYear() : null)
                .semester(student != null ? student.getSemester() : null)
                .employeeCode(lecturer != null ? lecturer.getEmployeeCode() : null)
                .designation(lecturer != null ? lecturer.getDesignation() : null)
                .officeLocation(lecturer != null ? lecturer.getOfficeLocation() : null)
                .officeHours(lecturer != null ? lecturer.getOfficeHours() : null)
                .bio(lecturer != null ? lecturer.getBio() : null)
                .build();
    }
}