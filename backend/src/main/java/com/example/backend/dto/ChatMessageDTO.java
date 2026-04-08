package com.example.backend.dto;

import com.example.backend.model.ChatMessage;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Outbound DTO for a chat message – sent over REST and WebSocket.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageDTO {

    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String content;
    private ChatMessage.MessageType messageType;
    private String fileUrl;
    private String fileName;
    private boolean read;
    private LocalDateTime readAt;
    private boolean pinned;
    private boolean markedAsAnswer;
    private boolean deleted;
    private boolean profanityFlagged;
    private LocalDateTime sentAt;

    public static ChatMessageDTO from(ChatMessage m) {
        String displayContent = m.isDeleted()
                ? "This message was deleted."
                : (m.getFilteredContent() != null ? m.getFilteredContent() : m.getContent());

        return ChatMessageDTO.builder()
                .id(m.getId())
                .roomId(m.getRoom().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .senderRole(m.getSender().getRole().name())
                .content(displayContent)
                .messageType(m.getMessageType())
                .fileUrl(m.isDeleted() ? null : m.getFileUrl())
                .fileName(m.isDeleted() ? null : m.getFileName())
                .read(m.isRead())
                .readAt(m.getReadAt())
                .pinned(m.isPinned())
                .markedAsAnswer(m.isMarkedAsAnswer())
                .deleted(m.isDeleted())
                .profanityFlagged(m.isProfanityFlagged())
                .sentAt(m.getSentAt())
                .build();
    }
}
