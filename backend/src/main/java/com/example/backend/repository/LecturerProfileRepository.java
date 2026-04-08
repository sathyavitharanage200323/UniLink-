package com.example.backend.repository;

import com.example.backend.model.LecturerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LecturerProfileRepository extends JpaRepository<LecturerProfile, Long> {
    Optional<LecturerProfile> findByEmployeeCode(String employeeCode);
    boolean existsByEmployeeCode(String employeeCode);
}