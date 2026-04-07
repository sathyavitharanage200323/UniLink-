package com.example.backend.repository;

import com.example.backend.model.Appointment;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByStudent(User student);
    List<Appointment> findByLecturer(User lecturer);
    List<Appointment> findByStudentAndStatus(User student, Appointment.Status status);
    List<Appointment> findByLecturerAndStatus(User lecturer, Appointment.Status status);

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
