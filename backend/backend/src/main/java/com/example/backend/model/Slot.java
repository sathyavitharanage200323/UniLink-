package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Slot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private User lecturer;

    private String day; // Monday, Tuesday, etc.
    private String time; // e.g., "09:00 AM - 10:00 AM"
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        OPEN, PENDING, ACCEPTED
    }
}
