package com.example.backend.controller;

import com.example.backend.dto.AuthUserResponse;
import com.example.backend.dto.ManagementUserUpdateRequest;
import com.example.backend.service.ManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/management")
@RequiredArgsConstructor
public class ManagementController {

    private final ManagementService managementService;

    @GetMapping("/students")
    public ResponseEntity<List<AuthUserResponse>> getStudents() {
        return ResponseEntity.ok(managementService.getStudents());
    }

    @GetMapping("/lecturers")
    public ResponseEntity<List<AuthUserResponse>> getLecturers() {
        return ResponseEntity.ok(managementService.getLecturers());
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<AuthUserResponse> updateStudent(@PathVariable Long id,
                                                          @RequestBody ManagementUserUpdateRequest request) {
        return ResponseEntity.ok(managementService.updateStudent(id, request));
    }

    @PutMapping("/lecturers/{id}")
    public ResponseEntity<AuthUserResponse> updateLecturer(@PathVariable Long id,
                                                           @RequestBody ManagementUserUpdateRequest request) {
        return ResponseEntity.ok(managementService.updateLecturer(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        managementService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
