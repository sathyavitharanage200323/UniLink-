package com.example.backend.dto;

import lombok.*;

/**
 * WebSocket payload for typing indicators.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TypingPayload {
    private Long userId;
    private String userName;
    private boolean typing;
}
