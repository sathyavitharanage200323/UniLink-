package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "lecturer_preferences")
public class LecturerPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lecturer_id", nullable = false, unique = true)
    private Long lecturerId;

    @Column(name = "slot_duration", nullable = false)
    private Integer slotDuration = 30;

    @Column(name = "break_time", nullable = false)
    private Integer breakTime = 15;

    @Column(name = "work_start_time", nullable = false)
    private LocalTime workStartTime = LocalTime.of(9, 0);

    @Column(name = "work_end_time", nullable = false)
    private LocalTime workEndTime = LocalTime.of(21, 0);

    @Column(name = "max_slots_per_day", nullable = false)
    private Integer maxSlotsPerDay = 12;

    @Column(name = "preferred_mode", length = 20)
    private String preferredMode = "BOTH";

    public LecturerPreference() {
    }

    public Long getId() {
        return id;
    }

    public Long getLecturerId() {
        return lecturerId;
    }

    public void setLecturerId(Long lecturerId) {
        this.lecturerId = lecturerId;
    }

    public Integer getSlotDuration() {
        return slotDuration;
    }

    public void setSlotDuration(Integer slotDuration) {
        this.slotDuration = slotDuration;
    }

    public Integer getBreakTime() {
        return breakTime;
    }

    public void setBreakTime(Integer breakTime) {
        this.breakTime = breakTime;
    }

    public LocalTime getWorkStartTime() {
        return workStartTime;
    }

    public void setWorkStartTime(LocalTime workStartTime) {
        this.workStartTime = workStartTime;
    }

    public LocalTime getWorkEndTime() {
        return workEndTime;
    }

    public void setWorkEndTime(LocalTime workEndTime) {
        this.workEndTime = workEndTime;
    }

    public Integer getMaxSlotsPerDay() {
        return maxSlotsPerDay;
    }

    public void setMaxSlotsPerDay(Integer maxSlotsPerDay) {
        this.maxSlotsPerDay = maxSlotsPerDay;
    }

    public String getPreferredMode() {
        return preferredMode;
    }

    public void setPreferredMode(String preferredMode) {
        this.preferredMode = preferredMode;
    }
}