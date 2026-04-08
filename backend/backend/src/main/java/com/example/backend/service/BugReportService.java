package com.example.backend.service;

import com.example.backend.dto.BugReportResponse;
import com.example.backend.dto.CreateBugReportRequest;
import com.example.backend.dto.UpdateBugReportStatusRequest;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.BugReport;
import com.example.backend.model.User;
import com.example.backend.repository.BugReportRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BugReportService {

    private final BugReportRepository bugReportRepository;
    private final UserRepository userRepository;

    @Transactional
    public BugReportResponse create(CreateBugReportRequest request) {
        if (request == null || request.getReporterId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reporter is required");
        }
        if (isBlank(request.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (isBlank(request.getDescription())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }

        User reporter = userRepository.findById(request.getReporterId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getReporterId()));

        BugReport report = BugReport.builder()
                .reporter(reporter)
                .reporterRole(reporter.getRole().name())
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .severity(request.getSeverity() == null ? BugReport.Severity.MEDIUM : request.getSeverity())
                .status(BugReport.Status.OPEN)
                .build();

        return BugReportResponse.from(bugReportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public List<BugReportResponse> getByReporter(Long reporterId) {
        return bugReportRepository.findByReporterIdOrderByCreatedAtDesc(reporterId).stream()
                .map(BugReportResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BugReportResponse> getAll() {
        return bugReportRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(BugReportResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public BugReportResponse updateStatus(Long reportId, UpdateBugReportStatusRequest request) {
        if (request == null || request.getStatus() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }

        BugReport report = bugReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug report", reportId));

        report.setStatus(request.getStatus());
        report.setAdminNote(trimToNull(request.getAdminNote()));

        if (request.getStatus() == BugReport.Status.FIXED) {
            if (request.getFixedById() != null) {
                User admin = userRepository.findById(request.getFixedById())
                        .orElseThrow(() -> new ResourceNotFoundException("User", request.getFixedById()));
                report.setFixedBy(admin);
            }
            report.setFixedAt(LocalDateTime.now());
            report.setReporterNotified(false);
        } else {
            report.setFixedAt(null);
            report.setFixedBy(null);
        }

        return BugReportResponse.from(bugReportRepository.save(report));
    }

    @Transactional
    public List<BugReportResponse> getNotifications(Long reporterId) {
        List<BugReport> reports = bugReportRepository
                .findByReporterIdAndStatusAndReporterNotifiedFalse(reporterId, BugReport.Status.FIXED);
        if (!reports.isEmpty()) {
            reports.forEach(r -> r.setReporterNotified(true));
            bugReportRepository.saveAll(reports);
        }
        return reports.stream().map(BugReportResponse::from).collect(Collectors.toList());
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
