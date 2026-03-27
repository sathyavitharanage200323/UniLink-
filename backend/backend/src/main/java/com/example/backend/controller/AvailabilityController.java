package com.example.backend.controller;

import com.example.backend.dto.AvailabilitySlotDTO;
import com.example.backend.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for lecturer availability management
 * Base URL: /api/availability
 */
@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    /**
     * Get all availability slots for a lecturer (lecturer view - includes unavailable slots)
     */
    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<AvailabilitySlotDTO>> getLecturerAvailability(@PathVariable Long lecturerId) {
        return ResponseEntity.ok(availabilityService.getLecturerAvailability(lecturerId));
    }

    /**
     * Get only available slots for a lecturer (student view)
     */
    @GetMapping("/lecturer/{lecturerId}/available")
    public ResponseEntity<List<AvailabilitySlotDTO>> getLecturerAvailableSlots(@PathVariable Long lecturerId) {
        return ResponseEntity.ok(availabilityService.getLecturerAvailableSlots(lecturerId));
    }

    /**
     * Bulk update lecturer availability (replaces all existing slots)
     */
    @PostMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<AvailabilitySlotDTO>> updateLecturerAvailability(
            @PathVariable Long lecturerId,
            @RequestBody List<AvailabilitySlotDTO> slots) {
        return ResponseEntity.ok(availabilityService.updateLecturerAvailability(lecturerId, slots));
    }

    /**
     * Toggle a single slot's availability
     */
    @PatchMapping("/slot/{slotId}/toggle")
    public ResponseEntity<AvailabilitySlotDTO> toggleSlotAvailability(@PathVariable Long slotId) {
        return ResponseEntity.ok(availabilityService.toggleSlotAvailability(slotId));
    }
}
