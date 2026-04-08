package com.example.backend.controller;

import com.example.backend.model.Appointment;
import com.example.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    /** Create a new appointment with optional files (status defaults to PENDING) */
    @PostMapping
    public ResponseEntity<Appointment> create(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long lecturerId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) MultipartFile document) {
        
        // If studentId is null, it's a JSON request - handle it differently
        if (studentId == null) {
            throw new RuntimeException("Invalid request: missing required parameters");
        }
        
        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);
        
        return ResponseEntity.ok(appointmentService.createWithFiles(
            studentId, lecturerId, start, end, notes, phoneNumber, image, document));
    }

    /** Create appointment with JSON body (for backward compatibility) */
    @PostMapping(consumes = "application/json")
    public ResponseEntity<Appointment> createJson(@RequestBody Map<String, Object> body) {
        Long studentId  = Long.valueOf(body.get("studentId").toString());
        Long lecturerId = Long.valueOf(body.get("lecturerId").toString());
        LocalDateTime start = LocalDateTime.parse(body.get("startTime").toString());
        LocalDateTime end   = LocalDateTime.parse(body.get("endTime").toString());
        String notes = body.containsKey("notes") ? body.get("notes").toString() : null;
        String phoneNumber = body.containsKey("phoneNumber") ? body.get("phoneNumber").toString() : null;
        return ResponseEntity.ok(appointmentService.create(studentId, lecturerId, start, end, notes, phoneNumber));
    }

    /** Update appointment status (PENDING → CONFIRMED / CANCELLED / COMPLETED) */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id,
                                                     @RequestBody Map<String, String> body) {
        Appointment.Status status = Appointment.Status.valueOf(body.get("status"));
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

    /** Update appointment time (for reschedule/delay) */
    @PatchMapping("/{id}/time")
    public ResponseEntity<Appointment> updateTime(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        LocalDateTime newStart = java.time.Instant.parse(body.get("startTime"))
            .atZone(java.time.ZoneId.systemDefault())
            .toLocalDateTime();
        LocalDateTime newEnd = java.time.Instant.parse(body.get("endTime"))
            .atZone(java.time.ZoneId.systemDefault())
            .toLocalDateTime();
        String reason = body.getOrDefault("reason", null);
        return ResponseEntity.ok(appointmentService.updateTime(id, newStart, newEnd, reason));
    }

    /** Delete an appointment */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
