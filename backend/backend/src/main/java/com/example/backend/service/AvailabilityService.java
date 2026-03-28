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

    public List<AvailabilitySlotDTO> getLecturerAvailability(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return availabilitySlotRepository.findByLecturerOrderBySlotDateAscStartTimeAsc(lecturer)
                .stream()
                .map(AvailabilitySlotDTO::from)
                .collect(Collectors.toList());
    }

    public List<AvailabilitySlotDTO> getLecturerAvailableSlots(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return availabilitySlotRepository.findByLecturerAndAvailableTrueOrderBySlotDateAscStartTimeAsc(lecturer)
                .stream()
                .map(AvailabilitySlotDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<AvailabilitySlotDTO> updateLecturerAvailability(Long lecturerId, List<AvailabilitySlotDTO> slots) {
        User lecturer = userService.getUser(lecturerId);

        availabilitySlotRepository.deleteByLecturer(lecturer);
        availabilitySlotRepository.flush();

        List<AvailabilitySlot> newSlots = slots.stream()
                .map(dto -> AvailabilitySlot.builder()
                        .lecturer(lecturer)
                        .slotDate(java.time.LocalDate.parse(dto.getSlotDate()))
                        .startTime(java.time.LocalTime.parse(dto.getStartTime()))
                        .endTime(java.time.LocalTime.parse(dto.getEndTime()))
                        .available(dto.isAvailable())
                        .build())
                .collect(Collectors.toList());

        List<AvailabilitySlot> saved = availabilitySlotRepository.saveAll(newSlots);

        return saved.stream()
                .map(AvailabilitySlotDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AvailabilitySlotDTO toggleSlotAvailability(Long slotId) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        slot.setAvailable(!slot.isAvailable());
        return AvailabilitySlotDTO.from(availabilitySlotRepository.save(slot));
    }
}
