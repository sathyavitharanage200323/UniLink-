package com.example.backend.repository;

import com.example.backend.model.Appointment;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByStudent(User student);
    List<Appointment> findByLecturer(User lecturer);
    List<Appointment> findByStudentAndStatus(User student, Appointment.Status status);
    List<Appointment> findByLecturerAndStatus(User lecturer, Appointment.Status status);

    /** Find confirmed/pending appointments for a lecturer that overlap a time window. */
    @Query("SELECT a FROM Appointment a WHERE a.lecturer = :lecturer " +
           "AND a.status IN (com.example.backend.model.Appointment.Status.CONFIRMED, com.example.backend.model.Appointment.Status.PENDING) " +
           "AND a.startTime < :end AND a.endTime > :start")
    List<Appointment> findConflicting(User lecturer, LocalDateTime start, LocalDateTime end);
}
