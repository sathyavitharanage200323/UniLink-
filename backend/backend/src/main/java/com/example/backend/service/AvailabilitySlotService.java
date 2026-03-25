package com.example.backend.service;

import com.example.backend.model.AvailabilitySlot;
import com.example.backend.repository.AvailabilitySlotRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AvailabilitySlotService {

    private final AvailabilitySlotRepository repository;

    public AvailabilitySlotService(AvailabilitySlotRepository repository) {
        this.repository = repository;
    }

    public List<AvailabilitySlot> getSlotsByLecturer(Long lecturerId) {
        return repository.findByLecturerId(lecturerId);
    }

    public AvailabilitySlot createSlot(AvailabilitySlot slot) {
        validateSlot(slot, null);
        return repository.save(slot);
    }

    public AvailabilitySlot updateSlot(Long id, AvailabilitySlot updatedSlot) {
        AvailabilitySlot existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Slot not found."));

        validateSlot(updatedSlot, id);

        existing.setLecturerId(updatedSlot.getLecturerId());
        existing.setSlotDate(updatedSlot.getSlotDate());
        existing.setStartTime(updatedSlot.getStartTime());
        existing.setEndTime(updatedSlot.getEndTime());

        return repository.save(existing);
    }

    public void deleteSlot(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Slot not found.");
        }
        repository.deleteById(id);
    }

    private void validateSlot(AvailabilitySlot slot, Long editingId) {
        if (slot.getLecturerId() == null) {
            throw new RuntimeException("Lecturer ID is required.");
        }

        

        if (slot.getSlotDate() == null) {
            throw new RuntimeException("Slot date is required.");
        }

        if (slot.getStartTime() == null) {
            throw new RuntimeException("Start time is required.");
        }

        if (slot.getEndTime() == null) {
            throw new RuntimeException("End time is required.");
        }

        if (slot.getEndTime().isAfter(java.time.LocalTime.of(21, 0))) {
    throw new RuntimeException("Slots cannot go beyond 9:00 PM.");
}

        if (slot.getSlotDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Past dates are not allowed.");
        }

        if (!slot.getEndTime().isAfter(slot.getStartTime())) {
            throw new RuntimeException("End time must be later than start time.");
        }

        long minutes = ChronoUnit.MINUTES.between(slot.getStartTime(), slot.getEndTime());
        if (minutes != 30) {
            throw new RuntimeException("Each slot must be exactly 30 minutes long.");
        }

        boolean duplicate = repository.existsByLecturerIdAndSlotDateAndStartTimeAndEndTime(
                slot.getLecturerId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime()
        );

        if (duplicate && editingId == null) {
            throw new RuntimeException("This slot already exists.");
        }

        validateBreakGap(slot, editingId);
    }

    private void validateBreakGap(AvailabilitySlot newSlot, Long editingId) {
        List<AvailabilitySlot> sameDaySlots = repository.findByLecturerIdAndSlotDate(
                newSlot.getLecturerId(),
                newSlot.getSlotDate()
        );

        for (AvailabilitySlot existing : sameDaySlots) {
            if (editingId != null && existing.getId().equals(editingId)) {
                continue;
            }

            long minutesFromExistingEndToNewStart =
                    ChronoUnit.MINUTES.between(existing.getEndTime(), newSlot.getStartTime());

            long minutesFromNewEndToExistingStart =
                    ChronoUnit.MINUTES.between(newSlot.getEndTime(), existing.getStartTime());

            boolean enoughGapAfterExisting = minutesFromExistingEndToNewStart >= 15;
            boolean enoughGapBeforeExisting = minutesFromNewEndToExistingStart >= 15;

            if (!(enoughGapAfterExisting || enoughGapBeforeExisting)) {
                throw new RuntimeException(
                        "There must be at least a 15-minute break between slots on the same day."
                );
            }
        }
    }
}