package com.example.backend.repository;

import com.example.backend.model.Appointment;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByStudent(User student);
    List<Appointment> findByLecturer(User lecturer);
    List<Appointment> findByStudentAndStatus(User student, Appointment.Status status);
    List<Appointment> findByLecturerAndStatus(User lecturer, Appointment.Status status);
}
