package com.example.backend.controller;

import com.example.backend.model.CannedResponse;
import com.example.backend.service.CannedResponseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for lecturer canned (quick) responses.
 * Base URL: /api/canned-responses
 */
@RestController
@RequestMapping("/api/canned-responses")
@RequiredArgsConstructor
public class CannedResponseController {

    private final CannedResponseService cannedResponseService;

    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<CannedResponse>> getByLecturer(@PathVariable Long lecturerId) {
        return ResponseEntity.ok(cannedResponseService.getByLecturer(lecturerId));
    }

    @PostMapping
    public ResponseEntity<CannedResponse> create(@RequestBody Map<String, Object> body) {
        Long lecturerId = Long.valueOf(body.get("lecturerId").toString());
        String title   = body.get("title").toString();
        String content = body.get("content").toString();
        return ResponseEntity.ok(cannedResponseService.create(lecturerId, title, content));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CannedResponse> update(@PathVariable Long id,
                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(cannedResponseService.update(id,
                body.get("title"), body.get("content")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cannedResponseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
