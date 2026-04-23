package com.example.backend.repository;

import com.example.backend.model.LecturerPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LecturerPreferenceRepository extends JpaRepository<LecturerPreference, Long> {
    Optional<LecturerPreference> findByLecturerId(Long lecturerId);
}