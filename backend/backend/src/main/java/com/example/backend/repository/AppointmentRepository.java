package com.example.backend.repository;

import com.example.backend.model.Appointment;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByStudentOrderByStartTimeDesc(User student);
    List<Appointment> findByLecturerOrderByStartTimeDesc(User lecturer);
    List<Appointment> findByStudentAndStatus(User student, Appointment.Status status);
    List<Appointment> findByLecturerAndStatus(User lecturer, Appointment.Status status);
    boolean existsByStudentAndLecturerAndStartTimeAndEndTimeAndStatusIn(
            User student,
            User lecturer,
            LocalDateTime startTime,
            LocalDateTime endTime,
            List<Appointment.Status> statuses
    );

    @Modifying
    @Query("DELETE FROM Appointment a WHERE a.student = ?1")
    void deleteByStudent(User student);

    @Modifying
    @Query("DELETE FROM Appointment a WHERE a.lecturer = ?1")
    void deleteByLecturer(User lecturer);

    @Modifying
    @Query("DELETE FROM Appointment a WHERE a.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);

    @Modifying
    @Query("DELETE FROM Appointment a WHERE a.lecturer.id = :lecturerId")
    void deleteByLecturerId(@Param("lecturerId") Long lecturerId);
}
