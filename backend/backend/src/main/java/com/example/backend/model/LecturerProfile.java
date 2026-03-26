package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lecturer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LecturerProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "employee_code", nullable = false, unique = true, length = 50)
    private String employeeCode;

    @Column(name = "designation", length = 50)
    private String designation;

    @Column(name = "office_location", length = 100)
    private String officeLocation;

    @Column(name = "office_hours", length = 100)
    private String officeHours;

    @Column(name = "bio", length = 1000)
    private String bio;
}