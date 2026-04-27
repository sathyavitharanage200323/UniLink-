package com.example.backend.repository;

import com.example.backend.model.LearningResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningResourceRepository extends JpaRepository<LearningResource, Long> {
    List<LearningResource> findAllByOrderByCreatedAtDesc();
    List<LearningResource> findByLecturerIdOrderByCreatedAtDesc(Long lecturerId);
}
