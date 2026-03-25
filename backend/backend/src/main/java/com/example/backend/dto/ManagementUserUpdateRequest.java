package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ManagementUserUpdateRequest {
    private String name;
    private String department;
    private String phone;
    private String expertise;

    // Student-specific
    private String registrationNumber;
    private String batch;
    private String academicYear;
    private String semester;

    // Lecturer-specific
    private String employeeCode;
    private String designation;
    private String officeLocation;
    private String officeHours;
    private String bio;
}