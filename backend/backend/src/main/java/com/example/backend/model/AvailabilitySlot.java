package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Represents a lecturer's availability slot on a specific date.
 */
@Entity
@Table(name = "availability_slots", indexes = {
    @Index(name = "idx_lecturer_date", columnList = "lecturer_id, slot_date")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private User lecturer;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SlotStatus status = SlotStatus.AVAILABLE;

    @Column
    private String mode; // e.g. "Online" or "Physical"

    @Column
    private String location;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(name = "block_reason")
    private String blockReason;

    public enum SlotStatus {
        AVAILABLE, BOOKED, BLOCKED, EXPIRED
    }
}
