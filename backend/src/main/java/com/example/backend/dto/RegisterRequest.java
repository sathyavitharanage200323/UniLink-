package com.example.backend.dto;

import com.example.backend.model.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private User.Role role;
    private String department;
    private String phone;

    // Student fields
    private String registrationNumber;
    private String batch;
    private String academicYear;
    private String semester;

    // Lecturer fields
    private String employeeCode;
    private String designation;
    private String officeLocation;
    private String officeHours;
    private String expertise;
    private String bio;
}