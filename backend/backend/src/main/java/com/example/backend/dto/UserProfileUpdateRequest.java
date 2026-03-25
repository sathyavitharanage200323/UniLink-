package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileUpdateRequest {
    private String name;
<<<<<<< Updated upstream
    private String department;
    private String phone;
    private String expertise;

=======
    private String email;
    private String department;
    private String phone;
    private String expertise;
    private String autoReplyMessage;

    // Password change
    private String currentPassword;
    private String newPassword;

    // Student fields
>>>>>>> Stashed changes
    private String registrationNumber;
    private String batch;
    private String academicYear;
    private String semester;

<<<<<<< Updated upstream
=======
    // Lecturer fields
>>>>>>> Stashed changes
    private String employeeCode;
    private String officeLocation;
    private String officeHours;
    private String bio;
<<<<<<< Updated upstream

    private String currentPassword;
    private String newPassword;
=======
>>>>>>> Stashed changes
}
