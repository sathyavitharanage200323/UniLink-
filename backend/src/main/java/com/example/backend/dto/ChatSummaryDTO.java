package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSummaryDTO {
    private Long roomId;
    private String summary;
    private List<String> keyPoints;
    private List<String> actionItems;
    private String model;
    private LocalDateTime generatedAt;
}
