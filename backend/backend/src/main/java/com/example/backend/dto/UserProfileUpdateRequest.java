package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileUpdateRequest {
    private String name;
    private String email;
    private String department;
    private String phone;
    private String expertise;
    private String autoReplyMessage;

    private String currentPassword;
    private String newPassword;

    private String registrationNumber;
    private String batch;
    private String academicYear;
    private String semester;

    private String employeeCode;
    private String officeLocation;
    private String officeHours;
    private String bio;
}
