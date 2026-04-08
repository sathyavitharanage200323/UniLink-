package com.example.backend.dto;

import com.example.backend.model.BugReport;
import com.example.backend.model.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BugReportResponse {
    private Long id;
    private String title;
    private String description;
    private String severity;
    private String status;
    private String adminNote;
    private boolean reporterNotified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime fixedAt;

    private Long reporterId;
    private String reporterName;
    private String reporterRole;

    private Long fixedById;
    private String fixedByName;

    public static BugReportResponse from(BugReport report) {
        User reporter = report.getReporter();
        User fixedBy = report.getFixedBy();

        return BugReportResponse.builder()
                .id(report.getId())
                .title(report.getTitle())
                .description(report.getDescription())
                .severity(report.getSeverity().name())
                .status(report.getStatus().name())
                .adminNote(report.getAdminNote())
                .reporterNotified(report.isReporterNotified())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .fixedAt(report.getFixedAt())
                .reporterId(reporter != null ? reporter.getId() : null)
                .reporterName(reporter != null ? reporter.getName() : null)
                .reporterRole(report.getReporterRole())
                .fixedById(fixedBy != null ? fixedBy.getId() : null)
                .fixedByName(fixedBy != null ? fixedBy.getName() : null)
                .build();
    }
}
