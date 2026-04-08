package com.example.backend.dto;

import com.example.backend.model.BugReport;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateBugReportStatusRequest {
    private BugReport.Status status;
    private String adminNote;
    private Long fixedById;
}
