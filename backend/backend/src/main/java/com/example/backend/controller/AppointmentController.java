package com.example.backend.controller;

import com.example.backend.model.Appointment;
import com.example.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST API for appointments.
 * Base URL: /api/appointments
 */
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<Appointment>> getAll() {
        return ResponseEntity.ok(appointmentService.getAll());
    }

    /** All appointments for a student */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Appointment>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(appointmentService.getByStudent(studentId));
    }

    /** All appointments for a lecturer */
    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<Appointment>> getByLecturer(@PathVariable Long lecturerId) {
        return ResponseEntity.ok(appointmentService.getByLecturer(lecturerId));
    }

    /** Get a single appointment by id */
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    /** Create a new appointment (status defaults to PENDING) */
    @PostMapping
    public ResponseEntity<Appointment> create(@RequestBody Map<String, Object> body) {
        Long studentId  = Long.valueOf(body.get("studentId").toString());
        Long lecturerId = Long.valueOf(body.get("lecturerId").toString());
        LocalDateTime start = LocalDateTime.parse(body.get("startTime").toString());
        LocalDateTime end   = LocalDateTime.parse(body.get("endTime").toString());
        String notes = body.containsKey("notes") ? body.get("notes").toString() : null;
        return ResponseEntity.ok(appointmentService.create(studentId, lecturerId, start, end, notes));
    }

    /** Update appointment status (PENDING → CONFIRMED / CANCELLED / COMPLETED) */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id,
                                                     @RequestBody Map<String, String> body) {
        Appointment.Status status = Appointment.Status.valueOf(body.get("status"));
        String reason          = body.get("reason");
        String meetingLink     = body.get("meetingLink");
        String meetingLocation = body.get("meetingLocation");
        String confirmMsg      = body.get("confirmMsg");
        return ResponseEntity.ok(
            appointmentService.updateStatus(id, status, reason, meetingLink, meetingLocation, confirmMsg)
        );
    }

    /** Update appointment time (reschedule — resets to PENDING) */
    @PatchMapping("/{id}/time")
    public ResponseEntity<Appointment> updateTime(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        LocalDateTime newStart = java.time.Instant.parse(body.get("startTime"))
            .atZone(java.time.ZoneId.systemDefault())
            .toLocalDateTime();
        LocalDateTime newEnd = java.time.Instant.parse(body.get("endTime"))
            .atZone(java.time.ZoneId.systemDefault())
            .toLocalDateTime();
        String reason = body.get("reason");
        return ResponseEntity.ok(appointmentService.updateTime(id, newStart, newEnd, reason));
    }

    /** Delete an appointment */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Upload image/document attachments for an appointment */
    @PatchMapping("/{id}/attachments")
    public ResponseEntity<Appointment> uploadAttachments(
            @PathVariable Long id,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            @RequestParam(value = "document", required = false) org.springframework.web.multipart.MultipartFile document) {
        return ResponseEntity.ok(appointmentService.uploadAttachments(id, image, document));
    }
}
