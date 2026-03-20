package com.example.backend.dto;

import lombok.*;

/**
 * WebSocket payload for read receipts.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReadReceiptPayload {
    private Long messageId;
    private Long readerId;
}
