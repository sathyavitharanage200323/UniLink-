package com.example.backend.controller;

import com.example.backend.dto.LearningResourceResponse;
import com.example.backend.service.LearningResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/resources", "/resources"})
@RequiredArgsConstructor
public class LearningResourceController {

    private final LearningResourceService learningResourceService;

    @GetMapping
    public ResponseEntity<List<LearningResourceResponse>> list(
            @RequestParam(value = "lecturerId", required = false) Long lecturerId
    ) {
        if (lecturerId != null) {
            return ResponseEntity.ok(learningResourceService.listByLecturer(lecturerId));
        }
        return ResponseEntity.ok(learningResourceService.listAll());
    }

    @PostMapping("/notice")
    public ResponseEntity<LearningResourceResponse> createNotice(@RequestBody Map<String, String> body) {
        Long lecturerId = Long.valueOf(body.get("lecturerId"));
        String title = body.get("title");
        String description = body.get("description");
        return ResponseEntity.ok(learningResourceService.createNotice(lecturerId, title, description));
    }

    @PostMapping("/pdf")
    public ResponseEntity<LearningResourceResponse> uploadPdf(
            @RequestParam("lecturerId") Long lecturerId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(learningResourceService.uploadPdf(lecturerId, title, description, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(
            @PathVariable("id") Long id,
            @RequestParam("userId") Long userId,
            @RequestParam("role") String role
    ) {
        learningResourceService.deleteResource(id, userId, role);
        return ResponseEntity.noContent().build();
    }
}
