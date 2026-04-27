package com.example.backend.dto;

import com.example.backend.model.LearningResource;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class LearningResourceResponse {
    Long id;
    Long lecturerId;
    String lecturerName;
    LearningResource.ResourceType type;
    String title;
    String description;
    String filePath;
    String fileName;
    String mimeType;
    Long fileSize;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
