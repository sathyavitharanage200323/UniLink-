package com.example.backend.dto;

import com.example.backend.model.ChatMessage;
import lombok.*;

/**
 * Inbound payload from the React client when sending a new message
 * (via WebSocket /app/chat.sendMessage/{roomId}).
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SendMessageRequest {
    private Long senderId;
    private String content;
    private ChatMessage.MessageType messageType; // default TEXT if null
    private String fileUrl;
    private String fileName;
}
