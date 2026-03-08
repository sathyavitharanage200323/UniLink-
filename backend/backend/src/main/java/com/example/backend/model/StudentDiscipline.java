package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Disciplinary record for a student.
 * Lecturers can apply warnings/blocks that integrate with the booking system.
 */
@Entity
@Table(name = "student_discipline")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentDiscipline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private User lecturer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisciplineType type;

    @Column(length = 500)
    private String reason;

    // When the temporary block expires (null = permanent)
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum DisciplineType {
        WARNING,    // Visible label; student can still book
        TEMP_BLOCK, // Temporary block from booking
        PERM_BLOCK  // Permanent block from booking
    }
}
