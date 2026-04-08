package com.example.backend.controller;

import com.example.backend.dto.BugReportResponse;
import com.example.backend.dto.CreateBugReportRequest;
import com.example.backend.dto.UpdateBugReportStatusRequest;
import com.example.backend.service.BugReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bug-reports")
@RequiredArgsConstructor
public class BugReportController {

    private final BugReportService bugReportService;

    @PostMapping
    public ResponseEntity<BugReportResponse> create(@RequestBody CreateBugReportRequest request) {
        return ResponseEntity.ok(bugReportService.create(request));
    }

    @GetMapping("/reporter/{reporterId}")
    public ResponseEntity<List<BugReportResponse>> getByReporter(@PathVariable Long reporterId) {
        return ResponseEntity.ok(bugReportService.getByReporter(reporterId));
    }

    @GetMapping("/admin")
    public ResponseEntity<List<BugReportResponse>> getAll() {
        return ResponseEntity.ok(bugReportService.getAll());
    }

    @PatchMapping("/{reportId}/status")
    public ResponseEntity<BugReportResponse> updateStatus(@PathVariable Long reportId,
                                                          @RequestBody UpdateBugReportStatusRequest request) {
        return ResponseEntity.ok(bugReportService.updateStatus(reportId, request));
    }

    @GetMapping("/notifications/{reporterId}")
    public ResponseEntity<List<BugReportResponse>> getNotifications(@PathVariable Long reporterId) {
        return ResponseEntity.ok(bugReportService.getNotifications(reporterId));
    }
}
