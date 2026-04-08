package com.example.backend.repository;

import com.example.backend.model.CannedResponse;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CannedResponseRepository extends JpaRepository<CannedResponse, Long> {
    List<CannedResponse> findByLecturerOrderByCreatedAtDesc(User lecturer);
    List<CannedResponse> findByLecturerId(Long lecturerId);
}
