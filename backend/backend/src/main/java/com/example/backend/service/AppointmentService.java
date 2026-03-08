package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Appointment;
import com.example.backend.model.User;
import com.example.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserService userService;

    public List<Appointment> getByStudent(Long studentId) {
        User student = userService.getUser(studentId);
        return appointmentRepository.findByStudent(student);
    }

    public List<Appointment> getByLecturer(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return appointmentRepository.findByLecturer(lecturer);
    }

    public Appointment getById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    @Transactional
    public Appointment create(Long studentId, Long lecturerId,
                               LocalDateTime startTime, LocalDateTime endTime,
                               String notes) {
        User student  = userService.getUser(studentId);
        User lecturer = userService.getUser(lecturerId);
        Appointment appt = Appointment.builder()
                .student(student)
                .lecturer(lecturer)
                .startTime(startTime)
                .endTime(endTime)
                .status(Appointment.Status.PENDING)
                .notes(notes)
                .build();
        return appointmentRepository.save(appt);
    }

    @Transactional
    public Appointment updateStatus(Long id, Appointment.Status status) {
        Appointment appt = getById(id);
        appt.setStatus(status);
        return appointmentRepository.save(appt);
    }

    @Transactional
    public void delete(Long id) {
        appointmentRepository.deleteById(id);
    }
}
