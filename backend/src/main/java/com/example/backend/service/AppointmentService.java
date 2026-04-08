package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Appointment;
import com.example.backend.model.User;
import com.example.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserService userService;
    private final DisciplineService disciplineService;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    private static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"};
    private static final String[] ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};

    @Transactional(readOnly = true)
    public List<Appointment> getByStudent(Long studentId) {
        User student = userService.getUser(studentId);
        return appointmentRepository.findByStudent(student);
    }

    @Transactional(readOnly = true)
    public List<Appointment> getByLecturer(Long lecturerId) {
        User lecturer = userService.getUser(lecturerId);
        return appointmentRepository.findByLecturer(lecturer);
    }

    @Transactional(readOnly = true)
    public Appointment getById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    @Transactional
    public Appointment create(Long studentId, Long lecturerId,
                               LocalDateTime startTime, LocalDateTime endTime,
                               String notes) {
        return create(studentId, lecturerId, startTime, endTime, notes, null);
    }

    @Transactional
    public Appointment create(Long studentId, Long lecturerId,
                               LocalDateTime startTime, LocalDateTime endTime,
                               String notes, String phoneNumber) {
        if (disciplineService.isBlocked(studentId, lecturerId)) {
            throw new RuntimeException("You are blocked by this lecturer and cannot book an appointment.");
        }
        User student  = userService.getUser(studentId);
        User lecturer = userService.getUser(lecturerId);
        Appointment appt = Appointment.builder()
                .student(student)
                .lecturer(lecturer)
                .startTime(startTime)
                .endTime(endTime)
                .status(Appointment.Status.PENDING)
                .notes(notes)
                .phoneNumber(phoneNumber)
                .build();
        return appointmentRepository.save(appt);
    }

    @Transactional
    public Appointment createWithFiles(Long studentId, Long lecturerId,
                                       LocalDateTime startTime, LocalDateTime endTime,
                                       String notes, String phoneNumber,
                                       MultipartFile image, MultipartFile document) {
        if (disciplineService.isBlocked(studentId, lecturerId)) {
            throw new RuntimeException("You are blocked by this lecturer and cannot book an appointment.");
        }

        String imagePath = null;
        String documentPath = null;

        if (image != null && !image.isEmpty()) {
            imagePath = saveFile(image, ALLOWED_IMAGE_TYPES, "images");
        }

        if (document != null && !document.isEmpty()) {
            documentPath = saveFile(document, ALLOWED_DOCUMENT_TYPES, "documents");
        }

        User student  = userService.getUser(studentId);
        User lecturer = userService.getUser(lecturerId);
        Appointment appt = Appointment.builder()
                .student(student)
                .lecturer(lecturer)
                .startTime(startTime)
                .endTime(endTime)
                .status(Appointment.Status.PENDING)
                .notes(notes)
                .phoneNumber(phoneNumber)
                .imagePath(imagePath)
                .documentPath(documentPath)
                .build();
        return appointmentRepository.save(appt);
    }

    private String saveFile(MultipartFile file, String[] allowedTypes, String subDir) {
        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds 15MB limit");
        }

        // Validate file type
        String contentType = file.getContentType();
        boolean isAllowed = false;
        for (String allowed : allowedTypes) {
            if (allowed.equals(contentType)) {
                isAllowed = true;
                break;
            }
        }
        if (!isAllowed) {
            throw new RuntimeException("File type not allowed: " + contentType);
        }

        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, subDir);
            Files.createDirectories(uploadPath);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.write(filePath, file.getBytes());

            // Return relative path for storage in database
            return subDir + "/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }

    @Transactional
    public Appointment updateStatus(Long id, Appointment.Status status) {
        Appointment appt = getById(id);
        appt.setStatus(status);
        return appointmentRepository.save(appt);
    }

    @Transactional
    public Appointment updateTime(Long id, LocalDateTime newStartTime, LocalDateTime newEndTime) {
        Appointment appt = getById(id);
        appt.setStartTime(newStartTime);
        appt.setEndTime(newEndTime);
        appt.setRescheduledAt(LocalDateTime.now());
        return appointmentRepository.save(appt);
    }

    @Transactional
    public Appointment updateTime(Long id, LocalDateTime newStartTime, LocalDateTime newEndTime, String reason) {
        Appointment appt = getById(id);
        appt.setStartTime(newStartTime);
        appt.setEndTime(newEndTime);
        appt.setRescheduledAt(LocalDateTime.now());
        appt.setRescheduleReason(reason);
        return appointmentRepository.save(appt);
    }

    @Transactional
    public void delete(Long id) {
        appointmentRepository.deleteById(id);
    }
}
