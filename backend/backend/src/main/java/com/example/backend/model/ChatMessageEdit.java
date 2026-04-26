package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message_edits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageEdit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edited_by", nullable = false)
    private User editedBy;

    @Column(name = "previous_content", columnDefinition = "TEXT", nullable = false)
    private String previousContent;

    @Column(name = "edited_at", nullable = false, updatable = false)
    private LocalDateTime editedAt;

    @PrePersist
    protected void onCreate() {
        editedAt = LocalDateTime.now();
    }
}

