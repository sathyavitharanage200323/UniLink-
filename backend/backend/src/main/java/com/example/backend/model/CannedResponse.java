package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Canned (quick) responses saved by a lecturer.
 * Allows one-click replies for frequently asked questions.
 */
@Entity
@Table(name = "canned_responses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CannedResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private User lecturer;

    @Column(nullable = false, length = 200)
    private String title; // Short label shown in UI, e.g. "Assignment Deadline"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // Full canned message text

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
