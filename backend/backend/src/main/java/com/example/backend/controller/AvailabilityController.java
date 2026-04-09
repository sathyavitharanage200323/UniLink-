package com.example.backend.controller;

import com.example.backend.dto.AvailabilitySlotDTO;
import com.example.backend.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for lecturer availability management
 * Base URL: /api/availability
 */
@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<AvailabilitySlotDTO>> getLecturerAvailability(@PathVariable Long lecturerId) {
        return ResponseEntity.ok(availabilityService.getLecturerAvailability(lecturerId));
    }

    @GetMapping("/lecturer/{lecturerId}/available")
    public ResponseEntity<List<AvailabilitySlotDTO>> getLecturerAvailableSlots(@PathVariable Long lecturerId) {
        return ResponseEntity.ok(availabilityService.getLecturerAvailableSlots(lecturerId));
    }

    @PostMapping("/lecturer/{lecturerId}/slot")
    public ResponseEntity<?> createSlot(@PathVariable Long lecturerId, @RequestBody AvailabilitySlotDTO dto) {
        try {
            return ResponseEntity.ok(availabilityService.createSlot(lecturerId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/slot/{slotId}")
    public ResponseEntity<?> updateSlot(@PathVariable Long slotId, @RequestBody AvailabilitySlotDTO dto) {
        try {
            return ResponseEntity.ok(availabilityService.updateSlot(slotId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/slot/{slotId}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long slotId) {
        try {
            availabilityService.deleteSlot(slotId);
            return ResponseEntity.ok(Map.of("message", "Slot deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/slot/{slotId}/block")
    public ResponseEntity<?> blockSlot(@PathVariable Long slotId, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(availabilityService.blockSlot(slotId, body.get("reason")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/lecturer/{lecturerId}/copy-today")
    public ResponseEntity<?> copyTodayToTomorrow(@PathVariable Long lecturerId) {
        try {
            return ResponseEntity.ok(availabilityService.copyTodayToTomorrow(lecturerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
