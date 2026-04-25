package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Appointment;
import com.example.backend.model.AvailabilitySlot;
import com.example.backend.model.User;
import com.example.backend.model.WaitlistEntry;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.AvailabilitySlotRepository;
import com.example.backend.repository.WaitlistEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final WaitlistEntryRepository waitlistEntryRepository;
    private final UserService userService;
    private final DisciplineService disciplineService;
    private final EmailService emailService;

    public List<Appointment> getAll() {
        return appointmentRepository.findAll(org.springframework.data.domain.Sort.by(
            org.springframework.data.domain.Sort.Direction.DESC, "startTime"));
    }

    public Appointment save(Appointment appt) {
        return appointmentRepository.save(appt);
    }

    public List<Appointment> getByStudent(Long studentId) {
        User student = userService.getUser(studentId);
        return appointmentRepository.findByStudentOrderByStartTimeDesc(student);
    }

    public List<Appointment> getByLecturer(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return appointmentRepository.findByLecturerOrderByStartTimeDesc(lecturer);
    }

    public Appointment getById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    @Transactional
    public Appointment create(Long studentId, Long lecturerId,
                               LocalDateTime startTime, LocalDateTime endTime,
                               String notes) {
        validateTimeRange(startTime, endTime);
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot book an appointment in the past.");
        }

        User student  = userService.getUser(studentId);
        User lecturer = userService.getUser(lecturerId);

        if (student.getId().equals(lecturer.getId())) {
            throw new IllegalArgumentException("Student and lecturer cannot be the same user.");
        }
        if (disciplineService.isBlocked(studentId, lecturerId)) {
            throw new IllegalArgumentException("You are blocked by this lecturer and cannot book an appointment.");
        }

        AvailabilitySlot slot = findMatchingSlotForUpdate(lecturer, startTime, endTime);
        if (slot.getStatus() != AvailabilitySlot.SlotStatus.AVAILABLE) {
            throw new IllegalArgumentException("Selected slot is no longer available.");
        }

        slot.setStatus(AvailabilitySlot.SlotStatus.BOOKED);
        slot.setBlockReason(null);
        availabilitySlotRepository.save(slot);

        Appointment appt = Appointment.builder()
                .student(student)
                .lecturer(lecturer)
                .startTime(startTime)
                .endTime(endTime)
                .status(Appointment.Status.PENDING)
                .notes(normalizeNotes(notes))
                .build();
        Appointment saved = appointmentRepository.save(appt);

        // If the same student had already joined this slot's waitlist, close that entry.
        waitlistEntryRepository.updateStatusForStudentAndSlot(
                student,
                lecturer,
                startTime.toLocalDate(),
                startTime.toLocalTime().withSecond(0).withNano(0),
                endTime.toLocalTime().withSecond(0).withNano(0),
                WaitlistEntry.Status.ACTIVE,
                WaitlistEntry.Status.CANCELLED
        );

        return saved;
    }

    @Transactional
    public Map<String, Object> joinWaitlist(Long studentId, Long lecturerId, LocalDateTime startTime, LocalDateTime endTime) {
        validateTimeRange(startTime, endTime);
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot join waitlist for a past slot.");
        }

        User student = userService.getUser(studentId);
        User lecturer = userService.getUser(lecturerId);

        if (student.getId().equals(lecturer.getId())) {
            throw new IllegalArgumentException("Student and lecturer cannot be the same user.");
        }

        AvailabilitySlot slot = findMatchingSlotForUpdate(lecturer, startTime, endTime);
        if (slot.getStatus() != AvailabilitySlot.SlotStatus.BOOKED) {
            throw new IllegalArgumentException("This slot is currently available. Please book directly.");
        }

        boolean alreadyBooked = appointmentRepository.existsByStudentAndLecturerAndStartTimeAndEndTimeAndStatusIn(
                student,
                lecturer,
                startTime,
                endTime,
                List.of(Appointment.Status.PENDING, Appointment.Status.CONFIRMED)
        );
        if (alreadyBooked) {
            throw new IllegalArgumentException("You already have an appointment for this slot.");
        }

        var existing = waitlistEntryRepository.findFirstByStudentAndLecturerAndSlotDateAndStartTimeAndEndTimeAndStatus(
                student,
                lecturer,
                startTime.toLocalDate(),
                startTime.toLocalTime().withSecond(0).withNano(0),
                endTime.toLocalTime().withSecond(0).withNano(0),
                WaitlistEntry.Status.ACTIVE
        );
        if (existing.isPresent()) {
            throw new IllegalArgumentException("You are already in the waitlist for this slot.");
        }

        waitlistEntryRepository.save(
                WaitlistEntry.builder()
                        .student(student)
                        .lecturer(lecturer)
                        .slotDate(startTime.toLocalDate())
                        .startTime(startTime.toLocalTime().withSecond(0).withNano(0))
                        .endTime(endTime.toLocalTime().withSecond(0).withNano(0))
                        .status(WaitlistEntry.Status.ACTIVE)
                        .build()
        );

        long queueSize = waitlistEntryRepository
                .findByLecturerAndSlotDateAndStartTimeAndEndTimeAndStatusOrderByCreatedAtAsc(
                        lecturer,
                        startTime.toLocalDate(),
                        startTime.toLocalTime().withSecond(0).withNano(0),
                        endTime.toLocalTime().withSecond(0).withNano(0),
                        WaitlistEntry.Status.ACTIVE
                )
                .size();

        return Map.of(
                "message", "Added to waitlist successfully.",
                "queuePosition", queueSize
        );
    }

    @Transactional
    public Appointment updateStatus(Long id, Appointment.Status status, String reason,
                                    String meetingLink, String meetingLocation, String confirmMsg) {
        Appointment appt = getById(id);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        if (!isValidTransition(appt.getStatus(), status)) {
            throw new IllegalArgumentException("Invalid appointment status transition.");
        }

        appt.setStatus(status);

        if (status == Appointment.Status.CANCELLED) {
            Map<String, Object> waitlistResult = releaseSlotForAppointment(appt);
            appt.setRescheduleReason(reason != null && !reason.isBlank() ? reason : null);
            emailService.sendBookingDeclinedEmail(
                    appt.getStudent().getEmail(),
                    appt.getStudent().getName(),
                    appt.getLecturer().getName(),
                    appt.getLecturer().getDepartment(),
                    reason
            );
            if (Boolean.TRUE.equals(waitlistResult.get("autoAssigned"))) {
                appt.setConfirmationMessage("Slot auto-filled from waitlist.");
            }
        } else if (status == Appointment.Status.CONFIRMED) {
            // Save meeting details on the appointment
            if (meetingLink != null && !meetingLink.isBlank()) appt.setMeetingLink(meetingLink);
            if (meetingLocation != null && !meetingLocation.isBlank()) appt.setMeetingLocation(meetingLocation);
            if (confirmMsg != null && !confirmMsg.isBlank()) appt.setConfirmationMessage(confirmMsg);

            try {
                emailService.sendBookingAcceptedEmail(
                        appt.getStudent().getEmail(),
                        appt.getStudent().getName(),
                        appt.getLecturer().getName(),
                        appt.getLecturer().getDepartment(),
                        appt.getStartTime().format(dateFormatter),
                        appt.getStartTime().format(timeFormatter) + " – " + appt.getEndTime().format(timeFormatter),
                        meetingLink,
                        meetingLocation,
                        confirmMsg
                );
            } catch (Exception ignored) { /* email failure should not block confirmation */ }
        }

        return appointmentRepository.save(appt);
    }

    @Transactional
    public Appointment updateTime(Long id, LocalDateTime newStartTime, LocalDateTime newEndTime, String reason, String meetingLocation) {
        Appointment appt = getById(id);
        validateTimeRange(newStartTime, newEndTime);
        if (newStartTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot reschedule an appointment to a past time.");
        }

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        AvailabilitySlot currentSlot = findMatchingSlotForUpdate(appt.getLecturer(), appt.getStartTime(), appt.getEndTime());
        AvailabilitySlot newSlot = findMatchingSlotForUpdate(appt.getLecturer(), newStartTime, newEndTime);

        if (!newSlot.getId().equals(currentSlot.getId()) && newSlot.getStatus() != AvailabilitySlot.SlotStatus.AVAILABLE) {
            throw new IllegalArgumentException("Target slot is not available for rescheduling.");
        }

        // Release old slot and run waitlist auto-fill.
        processWaitlistAfterRelease(currentSlot);

        newSlot.setStatus(AvailabilitySlot.SlotStatus.BOOKED);
        newSlot.setBlockReason(null);
        availabilitySlotRepository.save(newSlot);

        // Update appointment: new time, back to PENDING, save reason & timestamp
        appt.setStartTime(newStartTime);
        appt.setEndTime(newEndTime);
        appt.setStatus(Appointment.Status.PENDING);
        appt.setRescheduledAt(LocalDateTime.now());
        appt.setRescheduleReason(reason != null && !reason.isBlank() ? reason : null);
        // Save new meeting location if provided
        if (meetingLocation != null && !meetingLocation.isBlank()) appt.setMeetingLocation(meetingLocation);
        // Clear previous confirmation details
        appt.setMeetingLink(null);
        appt.setMeetingLocation(null);
        appt.setConfirmationMessage(null);

        Appointment saved = appointmentRepository.save(appt);

        // Notify student by email
        try {
            emailService.sendRescheduleEmail(
                    appt.getStudent().getEmail(),
                    appt.getStudent().getName(),
                    appt.getLecturer().getName(),
                    appt.getLecturer().getDepartment(),
                    newStartTime.format(dateFmt),
                    newStartTime.format(timeFmt) + " – " + newEndTime.format(timeFmt),
                    reason
            );
        } catch (Exception ignored) { /* email failure should not block the reschedule */ }

        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Appointment appt = getById(id);
        releaseSlotForAppointment(appt);
        appointmentRepository.delete(appt);
    }

    @Transactional
    public Appointment uploadAttachments(Long id, MultipartFile image, MultipartFile document) {
        Appointment appt = getById(id);
        String uploadDir = "uploads/";
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            if (image != null && !image.isEmpty()) {
                String safeName = Paths.get(image.getOriginalFilename() != null ? image.getOriginalFilename() : "image")
                        .getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
                String uniqueName = UUID.randomUUID() + "_" + safeName;
                Files.copy(image.getInputStream(), uploadPath.resolve(uniqueName), StandardCopyOption.REPLACE_EXISTING);
                appt.setImagePath(uniqueName);
            }

            if (document != null && !document.isEmpty()) {
                String safeName = Paths.get(document.getOriginalFilename() != null ? document.getOriginalFilename() : "document")
                        .getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
                String uniqueName = UUID.randomUUID() + "_" + safeName;
                Files.copy(document.getInputStream(), uploadPath.resolve(uniqueName), StandardCopyOption.REPLACE_EXISTING);
                appt.setDocumentPath(uniqueName);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload attachment: " + e.getMessage());
        }
        return appointmentRepository.save(appt);
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Start and end time are required.");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time.");
        }
    }

    private String normalizeNotes(String notes) {
        if (notes == null) return null;
        String trimmed = notes.trim();
        if (trimmed.length() > 500) {
            throw new IllegalArgumentException("Notes cannot exceed 500 characters.");
        }
        return trimmed;
    }

    private boolean isValidTransition(Appointment.Status current, Appointment.Status next) {
        if (current == next) return true;

        return switch (current) {
            case PENDING -> next == Appointment.Status.CONFIRMED || next == Appointment.Status.CANCELLED;
            case CONFIRMED -> next == Appointment.Status.COMPLETED || next == Appointment.Status.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    private AvailabilitySlot findMatchingSlotForUpdate(User lecturer, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDate slotDate = startTime.toLocalDate();
        LocalTime start = startTime.toLocalTime().withSecond(0).withNano(0);
        LocalTime end = endTime.toLocalTime().withSecond(0).withNano(0);

        return availabilitySlotRepository.findForUpdateByLecturerAndSlotDateAndStartTimeAndEndTime(
                        lecturer,
                        slotDate,
                        start,
                        end
                )
                .orElseThrow(() -> new IllegalArgumentException("Selected availability slot does not exist."));
    }

    private Map<String, Object> releaseSlotForAppointment(Appointment appt) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("autoAssigned", false);
        result.put("assignedAppointmentId", null);

        if (appt.getStatus() == Appointment.Status.COMPLETED) {
            return result;
        }

        availabilitySlotRepository
                .findForUpdateByLecturerAndSlotDateAndStartTimeAndEndTime(
                        appt.getLecturer(),
                        appt.getStartTime().toLocalDate(),
                        appt.getStartTime().toLocalTime().withSecond(0).withNano(0),
                        appt.getEndTime().toLocalTime().withSecond(0).withNano(0)
                )
                .ifPresent(slot -> {
                    if (slot.getStatus() == AvailabilitySlot.SlotStatus.BOOKED) {
                        slot.setStatus(AvailabilitySlot.SlotStatus.AVAILABLE);
                        slot.setBlockReason(null);
                        Map<String, Object> waitlistResult = processWaitlistAfterRelease(
                                availabilitySlotRepository.save(slot)
                        );
                        result.putAll(waitlistResult);
                    }
                });
        return result;
    }

    private Map<String, Object> processWaitlistAfterRelease(AvailabilitySlot slot) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("autoAssigned", false);
        result.put("assignedAppointmentId", null);

        List<WaitlistEntry> queue = waitlistEntryRepository
                .findByLecturerAndSlotDateAndStartTimeAndEndTimeAndStatusOrderByCreatedAtAsc(
                        slot.getLecturer(),
                        slot.getSlotDate(),
                        slot.getStartTime(),
                        slot.getEndTime(),
                        WaitlistEntry.Status.ACTIVE
                );

        if (queue.isEmpty()) {
            return result;
        }

        LocalDateTime startAt = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        LocalDateTime endAt = LocalDateTime.of(slot.getSlotDate(), slot.getEndTime());
        notifyWaitlistQueueOpened(queue, slot);

        for (WaitlistEntry entry : queue) {
            User student = entry.getStudent();

            boolean blocked = disciplineService.isBlocked(student.getId(), slot.getLecturer().getId());
            boolean alreadyBooked = appointmentRepository.existsByStudentAndLecturerAndStartTimeAndEndTimeAndStatusIn(
                    student,
                    slot.getLecturer(),
                    startAt,
                    endAt,
                    List.of(Appointment.Status.PENDING, Appointment.Status.CONFIRMED)
            );

            if (blocked || alreadyBooked) {
                entry.setStatus(WaitlistEntry.Status.CANCELLED);
                waitlistEntryRepository.save(entry);
                continue;
            }

            Appointment autoAssigned = appointmentRepository.save(
                    Appointment.builder()
                            .student(student)
                            .lecturer(slot.getLecturer())
                            .startTime(startAt)
                            .endTime(endAt)
                            .status(Appointment.Status.PENDING)
                            .notes("Auto-assigned from waitlist queue.")
                            .build()
            );

            entry.setStatus(WaitlistEntry.Status.AUTO_ASSIGNED);
            entry.setAssignedAppointmentId(autoAssigned.getId());
            waitlistEntryRepository.save(entry);

            slot.setStatus(AvailabilitySlot.SlotStatus.BOOKED);
            slot.setBlockReason(null);
            availabilitySlotRepository.save(slot);

            notifyWaitlistAutoAssignment(student, slot);

            result.put("autoAssigned", true);
            result.put("assignedAppointmentId", autoAssigned.getId());
            return result;
        }

        slot.setStatus(AvailabilitySlot.SlotStatus.AVAILABLE);
        slot.setBlockReason(null);
        availabilitySlotRepository.save(slot);
        return result;
    }

    private void notifyWaitlistAutoAssignment(User student, AvailabilitySlot slot) {
        try {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            String bookingDate = slot.getSlotDate().format(dateFormatter);
            String bookingTime = slot.getStartTime().format(timeFormatter) + " - " + slot.getEndTime().format(timeFormatter);

            emailService.sendWaitlistAutoAssignedEmail(
                    student.getEmail(),
                    student.getName(),
                    slot.getLecturer().getName(),
                    bookingDate,
                    bookingTime
            );
        } catch (Exception ignored) {
            // Email failure should not block waitlist auto-fill.
        }
    }

    private void notifyWaitlistQueueOpened(List<WaitlistEntry> queue, AvailabilitySlot slot) {
        try {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            String bookingDate = slot.getSlotDate().format(dateFormatter);
            String bookingTime = slot.getStartTime().format(timeFormatter) + " - " + slot.getEndTime().format(timeFormatter);

            for (WaitlistEntry entry : queue) {
                emailService.sendWaitlistSlotAvailableNotification(
                        entry.getStudent().getEmail(),
                        entry.getStudent().getName(),
                        slot.getLecturer().getName(),
                        bookingDate,
                        bookingTime
                );
            }
        } catch (Exception ignored) {
            // Email failures should not block waitlist handling.
        }
    }
}
