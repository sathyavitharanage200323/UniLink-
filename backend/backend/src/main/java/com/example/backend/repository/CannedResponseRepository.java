package com.example.backend.repository;

import com.example.backend.model.CannedResponse;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CannedResponseRepository extends JpaRepository<CannedResponse, Long> {
    List<CannedResponse> findByLecturerOrderByCreatedAtDesc(User lecturer);
    List<CannedResponse> findByLecturerId(Long lecturerId);

    @Modifying
    @Query("DELETE FROM CannedResponse c WHERE c.lecturer = ?1")
    void deleteByLecturer(User lecturer);

    @Modifying
    @Query("DELETE FROM CannedResponse c WHERE c.lecturer.id = :lecturerId")
    void deleteByLecturerId(@Param("lecturerId") Long lecturerId);
}
