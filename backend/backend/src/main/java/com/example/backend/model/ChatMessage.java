package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Individual chat message inside a ChatRoom.
 * Supports: text, file attachments, code snippets, images.
 * Tracks read receipts, pinned status, "mark as answer", and soft-delete.
 */
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_room_sent", columnList = "room_id, sent_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    // The raw message content (may contain markdown)
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // Profanity-filtered version (shown to recipient if flagged)
    @Column(name = "filtered_content", columnDefinition = "TEXT")
    private String filteredContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType;

    // For file / image messages – stores the relative path
    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    // Read receipt
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // Pinned message feature
    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;

    // "Mark as Answer" / resolved highlight  
    @Column(name = "is_marked_answer", nullable = false)
    private boolean markedAsAnswer = false;

    // Soft delete – content replaced with "Message deleted"
    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    // Profanity was detected and filtered
    @Column(name = "profanity_flagged", nullable = false)
    private boolean profanityFlagged = false;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }

    public enum MessageType {
        TEXT,       // Plain text (with optional markdown)
        CODE,       // Code snippet
        FILE,       // PDF / document attachment
        IMAGE,      // Image attachment
        SYSTEM      // System-generated messages (e.g., "Chat resolved")
    }
}
