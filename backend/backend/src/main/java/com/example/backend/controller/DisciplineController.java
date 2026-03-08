package com.example.backend.controller;

import com.example.backend.model.StudentDiscipline;
import com.example.backend.model.User;
import com.example.backend.service.DisciplineService;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST API for lecturer moderation / discipline tools.
 * Base URL: /api/discipline
 */
@RestController
@RequestMapping("/api/discipline")
@RequiredArgsConstructor
public class DisciplineController {

    private final DisciplineService disciplineService;
    private final UserService userService;

    /** Get all discipline records for a student */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentDiscipline>> getRecords(@PathVariable Long studentId) {
        return ResponseEntity.ok(disciplineService.getDisciplineRecords(studentId));
    }

    /** Check if a student is blocked from a lecturer */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkBlocked(
            @RequestParam Long studentId,
            @RequestParam Long lecturerId) {
        boolean blocked = disciplineService.isBlocked(studentId, lecturerId);
        return ResponseEntity.ok(Map.of("blocked", blocked));
    }

    /**
     * Apply a discipline action.
     * Body: { lecturerId, studentId, type (WARNING|TEMP_BLOCK|PERM_BLOCK), reason, expiresAt (ISO) }
     */
    @PostMapping
    public ResponseEntity<StudentDiscipline> apply(@RequestBody Map<String, Object> body) {
        Long lecturerId = Long.valueOf(body.get("lecturerId").toString());
        Long studentId  = Long.valueOf(body.get("studentId").toString());
        StudentDiscipline.DisciplineType type =
                StudentDiscipline.DisciplineType.valueOf(body.get("type").toString());
        String reason = body.containsKey("reason") ? body.get("reason").toString() : null;
        LocalDateTime expiresAt = body.containsKey("expiresAt") && body.get("expiresAt") != null
                ? LocalDateTime.parse(body.get("expiresAt").toString())
                : null;

        return ResponseEntity.ok(
                disciplineService.applyDiscipline(lecturerId, studentId, type, reason, expiresAt));
    }

    /** Revoke a block / discipline record */
    @PatchMapping("/{id}/revoke")
    public ResponseEntity<Void> revoke(@PathVariable Long id) {
        disciplineService.revokeBlock(id);
        return ResponseEntity.noContent().build();
    }
}
