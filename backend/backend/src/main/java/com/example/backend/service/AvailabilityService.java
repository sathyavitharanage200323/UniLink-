package com.example.backend.service;

import com.example.backend.dto.AvailabilitySlotDTO;
import com.example.backend.model.AvailabilitySlot;
import com.example.backend.model.User;
import com.example.backend.repository.AvailabilitySlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final UserService userService;

    /**
     * Get all availability slots for a lecturer
     */
    public List<AvailabilitySlotDTO> getLecturerAvailability(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return availabilitySlotRepository.findByLecturerOrderByDayOfWeekAscStartTimeAsc(lecturer)
                .stream()
                .map(AvailabilitySlotDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * Get only available slots for a lecturer (student view)
     */
    public List<AvailabilitySlotDTO> getLecturerAvailableSlots(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return availabilitySlotRepository.findByLecturerAndAvailableTrueOrderByDayOfWeekAscStartTimeAsc(lecturer)
                .stream()
                .map(AvailabilitySlotDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * Bulk update lecturer availability
     * Replaces all existing slots with the new set
     */
    @Transactional
    public List<AvailabilitySlotDTO> updateLecturerAvailability(Long lecturerId, List<AvailabilitySlotDTO> slots) {
        User lecturer = userService.getUser(lecturerId);
        
        // Delete existing slots
        availabilitySlotRepository.deleteByLecturer(lecturer);
        availabilitySlotRepository.flush();

        // Create new slots
        List<AvailabilitySlot> newSlots = slots.stream()
                .map(dto -> AvailabilitySlot.builder()
                        .lecturer(lecturer)
                        .dayOfWeek(AvailabilitySlot.DayOfWeek.valueOf(dto.getDayOfWeek()))
                        .startTime(LocalTime.parse(dto.getStartTime()))
                        .endTime(LocalTime.parse(dto.getEndTime()))
                        .available(dto.isAvailable())
                        .build())
                .collect(Collectors.toList());

        List<AvailabilitySlot> saved = availabilitySlotRepository.saveAll(newSlots);
        
        return saved.stream()
                .map(AvailabilitySlotDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * Toggle a single slot's availability
     */
    @Transactional
    public AvailabilitySlotDTO toggleSlotAvailability(Long slotId) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        slot.setAvailable(!slot.isAvailable());
        return AvailabilitySlotDTO.from(availabilitySlotRepository.save(slot));
    }
}
