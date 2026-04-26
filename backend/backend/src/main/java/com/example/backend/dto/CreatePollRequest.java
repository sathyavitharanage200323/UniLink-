package com.example.backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePollRequest {
    private Long creatorId;
    private String question;
    private List<String> options;
}

