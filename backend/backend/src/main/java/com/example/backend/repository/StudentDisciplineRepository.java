package com.example.backend.repository;

import com.example.backend.model.StudentDiscipline;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudentDisciplineRepository extends JpaRepository<StudentDiscipline, Long> {

    List<StudentDiscipline> findByStudent(User student);

    List<StudentDiscipline> findByStudentAndLecturer(User student, User lecturer);

    // Check if a student is actively blocked from a specific lecturer
    @Query("SELECT COUNT(d) > 0 FROM StudentDiscipline d " +
           "WHERE d.student = :student AND d.lecturer = :lecturer " +
           "AND d.active = true " +
           "AND (d.type = 'TEMP_BLOCK' OR d.type = 'PERM_BLOCK') " +
           "AND (d.expiresAt IS NULL OR d.expiresAt > :now)")
    boolean isStudentBlockedByLecturer(@Param("student") User student,
                                       @Param("lecturer") User lecturer,
                                       @Param("now") LocalDateTime now);
}
