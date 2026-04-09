package com.example.backend.service;

import com.example.backend.dto.AvailabilitySlotDTO;
import com.example.backend.model.Appointment;
import com.example.backend.model.AvailabilitySlot;
import com.example.backend.model.User;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.AvailabilitySlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentRepository appointmentRepository;
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
        return availabilitySlotRepository.findByLecturerAndStatusOrderBySlotDateAscStartTimeAsc(lecturer, AvailabilitySlot.SlotStatus.AVAILABLE)
                .stream()
                .map(AvailabilitySlotDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AvailabilitySlotDTO createSlot(Long lecturerId, AvailabilitySlotDTO dto) {
        User lecturer = userService.getUser(lecturerId);
        
        LocalDate date = LocalDate.parse(dto.getSlotDate());
        LocalTime start = LocalTime.parse(dto.getStartTime());
        LocalTime end = LocalTime.parse(dto.getEndTime());
        
        if (date.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot create slot in the past");
        }
        if (date.isEqual(LocalDate.now()) && start.isBefore(LocalTime.now())) {
            throw new IllegalArgumentException("Cannot create slot in the past time today");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        // Validate overlap
        List<AvailabilitySlot> existingSlots = availabilitySlotRepository.findByLecturerOrderBySlotDateAscStartTimeAsc(lecturer);
        for (AvailabilitySlot existing : existingSlots) {
            if (existing.getSlotDate() != null && existing.getSlotDate().equals(date)) {
                if (existing.getStartTime() != null && existing.getEndTime() != null &&
                    start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime())) {
                    throw new IllegalArgumentException("Slot overlaps with an existing slot");
                }
            }
        }

        AvailabilitySlot slot = AvailabilitySlot.builder()
                .lecturer(lecturer)
                .slotDate(date)
                .startTime(start)
                .endTime(end)
                .status(AvailabilitySlot.SlotStatus.AVAILABLE)
                .mode(dto.getMode())
                .location(dto.getLocation())
                .meetingLink(dto.getMeetingLink())
                .build();

        return AvailabilitySlotDTO.from(availabilitySlotRepository.save(slot));
    }

    @Transactional
    public AvailabilitySlotDTO updateSlot(Long slotId, AvailabilitySlotDTO dto) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        
        if (slot.getStatus() == AvailabilitySlot.SlotStatus.BOOKED) {
            // Restrictions on booked slot edits
            slot.setLocation(dto.getLocation());
            slot.setMeetingLink(dto.getMeetingLink());
            slot.setMode(dto.getMode());
            return AvailabilitySlotDTO.from(availabilitySlotRepository.save(slot));
        }

        LocalDate date = LocalDate.parse(dto.getSlotDate());
        LocalTime start = LocalTime.parse(dto.getStartTime());
        LocalTime end = LocalTime.parse(dto.getEndTime());
        
        if (end.isBefore(start)) throw new IllegalArgumentException("End time must be after start time");

        slot.setSlotDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setMode(dto.getMode());
        slot.setLocation(dto.getLocation());
        slot.setMeetingLink(dto.getMeetingLink());
        
        if (dto.getStatus() != null) {
            slot.setStatus(AvailabilitySlot.SlotStatus.valueOf(dto.getStatus()));
        }

        return AvailabilitySlotDTO.from(availabilitySlotRepository.save(slot));
    }

    @Transactional
    public void deleteSlot(Long slotId) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        if (slot.getStatus() == AvailabilitySlot.SlotStatus.BOOKED) {
            throw new IllegalArgumentException("Cannot delete a booked slot.");
        }
        availabilitySlotRepository.delete(slot);
    }

    @Transactional
    public AvailabilitySlotDTO blockSlot(Long slotId, String reason) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        
        slot.setStatus(AvailabilitySlot.SlotStatus.BLOCKED);
        slot.setBlockReason(reason);
        // In the future, if it's BOOKED, we might want to also cancel the appointment.
        return AvailabilitySlotDTO.from(availabilitySlotRepository.save(slot));
    }

    @Transactional
    public Map<String, Integer> copyTodayToTomorrow(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        List<AvailabilitySlot> todaySlots = availabilitySlotRepository
                .findByLecturerAndSlotDateOrderByStartTimeAsc(lecturer, today);

        List<AvailabilitySlot> toCreate = new ArrayList<>();
        int skipped = 0;

        for (AvailabilitySlot slot : todaySlots) {
            if (slot.getStatus() != AvailabilitySlot.SlotStatus.AVAILABLE) {
                skipped++;
                continue;
            }

            boolean exists = availabilitySlotRepository
                    .findByLecturerAndSlotDateAndStartTimeAndEndTime(
                            lecturer,
                            tomorrow,
                            slot.getStartTime(),
                            slot.getEndTime()
                    )
                    .isPresent();

            if (exists) {
                skipped++;
                continue;
            }

            AvailabilitySlot copy = AvailabilitySlot.builder()
                    .lecturer(lecturer)
                    .slotDate(tomorrow)
                    .startTime(slot.getStartTime())
                    .endTime(slot.getEndTime())
                    .status(AvailabilitySlot.SlotStatus.AVAILABLE)
                    .mode(slot.getMode())
                    .location(slot.getLocation())
                    .meetingLink(slot.getMeetingLink())
                    .blockReason(null)
                    .isAvailable(true)
                    .build();
            toCreate.add(copy);
        }

        if (!toCreate.isEmpty()) {
            availabilitySlotRepository.saveAll(toCreate);
        }

        return Map.of(
                "created", toCreate.size(),
                "skipped", skipped
        );
    }
}
