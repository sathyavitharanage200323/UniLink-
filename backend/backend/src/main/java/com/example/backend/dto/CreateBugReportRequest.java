package com.example.backend.dto;

import com.example.backend.model.BugReport;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBugReportRequest {
    private Long reporterId;
    private String title;
    private String description;
    private BugReport.Severity severity;
}
