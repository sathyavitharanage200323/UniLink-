package com.example.backend.service;

import com.example.backend.dto.AvailabilitySlotDTO;
import com.example.backend.model.AvailabilitySlot;
import com.example.backend.model.User;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.AvailabilitySlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    // ── helpers ──────────────────────────────────────────────────────────────

    private AvailabilitySlotDTO withConflict(AvailabilitySlot slot) {
        AvailabilitySlotDTO dto = AvailabilitySlotDTO.from(slot);
        // Only check conflicts for date-specific slots (sentinel year 2099 = weekly template)
        if (slot.getSlotDate() != null && slot.getStartTime() != null && slot.getEndTime() != null
                && slot.getSlotDate().getYear() < 2099) {
            LocalDateTime start = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
            LocalDateTime end   = LocalDateTime.of(slot.getSlotDate(), slot.getEndTime());
            boolean conflict = !appointmentRepository.findConflicting(slot.getLecturer(), start, end).isEmpty();
            dto.setHasConflict(conflict);
        }
        return dto;
    }

    private void broadcastAvailability(Long lecturerId) {
        try {
            User lecturer = userService.getUser(lecturerId);
            List<AvailabilitySlotDTO> slots = availabilitySlotRepository
                    .findByLecturerOrderBySlotDateAscStartTimeAsc(lecturer)
                    .stream()
                    .map(this::withConflict)
                    .collect(Collectors.toList());
            messagingTemplate.convertAndSend("/topic/availability/" + lecturerId, slots);
        } catch (Exception ignored) {}
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    public List<AvailabilitySlotDTO> getLecturerAvailability(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return availabilitySlotRepository.findByLecturerOrderBySlotDateAscStartTimeAsc(lecturer)
                .stream().map(this::withConflict).collect(Collectors.toList());
    }

    public List<AvailabilitySlotDTO> getLecturerAvailableSlots(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return availabilitySlotRepository
                .findByLecturerAndStatusOrderBySlotDateAscStartTimeAsc(lecturer, AvailabilitySlot.SlotStatus.AVAILABLE)
                .stream().map(this::withConflict).collect(Collectors.toList());
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    @Transactional
    public AvailabilitySlotDTO createSlot(Long lecturerId, AvailabilitySlotDTO dto) {
        User lecturer = userService.getUser(lecturerId);

        LocalDate date  = LocalDate.parse(dto.getSlotDate());
        LocalTime start = LocalTime.parse(dto.getStartTime());
        LocalTime end   = LocalTime.parse(dto.getEndTime());

        if (date.isBefore(LocalDate.now()))
            throw new IllegalArgumentException("Cannot create slot in the past");
        if (date.isEqual(LocalDate.now()) && start.isBefore(LocalTime.now()))
            throw new IllegalArgumentException("Cannot create slot in the past time today");
        if (end.isBefore(start))
            throw new IllegalArgumentException("End time must be after start time");

        // Overlap check
        for (AvailabilitySlot existing : availabilitySlotRepository.findByLecturerOrderBySlotDateAscStartTimeAsc(lecturer)) {
            if (date.equals(existing.getSlotDate())
                    && existing.getStartTime() != null && existing.getEndTime() != null
                    && start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime())) {
                throw new IllegalArgumentException("Slot overlaps with an existing slot");
            }
        }

        AvailabilitySlot slot = AvailabilitySlot.builder()
                .lecturer(lecturer).slotDate(date).startTime(start).endTime(end)
                .status(AvailabilitySlot.SlotStatus.AVAILABLE)
                .mode(dto.getMode()).location(dto.getLocation()).meetingLink(dto.getMeetingLink())
                .build();

        AvailabilitySlotDTO result = withConflict(availabilitySlotRepository.save(slot));
        broadcastAvailability(lecturerId);
        return result;
    }

    @Transactional
    public AvailabilitySlotDTO updateSlot(Long slotId, AvailabilitySlotDTO dto) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (slot.getStatus() == AvailabilitySlot.SlotStatus.BOOKED) {
            slot.setLocation(dto.getLocation());
            slot.setMeetingLink(dto.getMeetingLink());
            slot.setMode(dto.getMode());
            AvailabilitySlotDTO result = withConflict(availabilitySlotRepository.save(slot));
            broadcastAvailability(slot.getLecturer().getId());
            return result;
        }

        LocalDate date  = LocalDate.parse(dto.getSlotDate());
        LocalTime start = LocalTime.parse(dto.getStartTime());
        LocalTime end   = LocalTime.parse(dto.getEndTime());
        if (end.isBefore(start)) throw new IllegalArgumentException("End time must be after start time");

        slot.setSlotDate(date); slot.setStartTime(start); slot.setEndTime(end);
        slot.setMode(dto.getMode()); slot.setLocation(dto.getLocation()); slot.setMeetingLink(dto.getMeetingLink());
        if (dto.getStatus() != null) slot.setStatus(AvailabilitySlot.SlotStatus.valueOf(dto.getStatus()));

        AvailabilitySlotDTO result = withConflict(availabilitySlotRepository.save(slot));
        broadcastAvailability(slot.getLecturer().getId());
        return result;
    }

    /** Bulk replace all weekly recurring slots for a lecturer. */
    @Transactional
    public List<AvailabilitySlotDTO> saveWeeklyAvailability(Long lecturerId, List<AvailabilitySlotDTO> dtos) {
        User lecturer = userService.getUser(lecturerId);
        availabilitySlotRepository.deleteWeeklyByLecturer(lecturer);

        List<AvailabilitySlot> toSave = dtos.stream()
                .filter(dto -> dto.getDayOfWeek() != null && dto.getStartTime() != null)
                .map(dto -> AvailabilitySlot.builder()
                        .lecturer(lecturer)
                        .dayOfWeek(dto.getDayOfWeek())
                        .slotDate(LocalDate.of(2099, 1, 1)) // sentinel for weekly
                        .startTime(LocalTime.parse(dto.getStartTime()))
                        .endTime(LocalTime.parse(dto.getEndTime()))
                        .status(Boolean.TRUE.equals(dto.getAvailable())
                                ? AvailabilitySlot.SlotStatus.AVAILABLE
                                : AvailabilitySlot.SlotStatus.BLOCKED)
                        .build())
                .collect(Collectors.toList());

        List<AvailabilitySlotDTO> result = availabilitySlotRepository.saveAll(toSave)
                .stream().map(this::withConflict).collect(Collectors.toList());
        broadcastAvailability(lecturerId);
        return result;
    }

    @Transactional
    public void deleteSlot(Long slotId) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        if (slot.getStatus() == AvailabilitySlot.SlotStatus.BOOKED)
            throw new IllegalArgumentException("Cannot delete a booked slot.");
        Long lecturerId = slot.getLecturer().getId();
        availabilitySlotRepository.delete(slot);
        broadcastAvailability(lecturerId);
    }

    @Transactional
    public AvailabilitySlotDTO blockSlot(Long slotId, String reason) {
        AvailabilitySlot slot = availabilitySlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        slot.setStatus(AvailabilitySlot.SlotStatus.BLOCKED);
        slot.setBlockReason(reason);
        AvailabilitySlotDTO result = withConflict(availabilitySlotRepository.save(slot));
        broadcastAvailability(slot.getLecturer().getId());
        return result;
    }
}
