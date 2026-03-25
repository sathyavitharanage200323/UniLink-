package com.example.backend.repository;

import com.example.backend.model.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByLecturerId(Long lecturerId);

    boolean existsByLecturerIdAndSlotDateAndStartTimeAndEndTime(
            Long lecturerId,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime
    );

    List<AvailabilitySlot> findByLecturerIdAndSlotDate(Long lecturerId, LocalDate slotDate);
}