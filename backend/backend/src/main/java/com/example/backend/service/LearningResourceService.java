package com.example.backend.service;

import com.example.backend.dto.LearningResourceResponse;
import com.example.backend.exception.AccessDeniedException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.LearningResource;
import com.example.backend.model.User;
import com.example.backend.repository.LearningResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private final LearningResourceRepository learningResourceRepository;
    private final UserService userService;

    public List<LearningResourceResponse> listAll() {
        return learningResourceRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<LearningResourceResponse> listByLecturer(Long lecturerId) {
        return learningResourceRepository.findByLecturerIdOrderByCreatedAtDesc(lecturerId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public LearningResourceResponse createNotice(Long lecturerId, String title, String description) {
        User lecturer = userService.getUser(lecturerId);
        if (lecturer.getRole() != User.Role.LECTURER) {
            throw new IllegalArgumentException("Only lecturers can create notices.");
        }

        LearningResource item = LearningResource.builder()
                .lecturer(lecturer)
                .type(LearningResource.ResourceType.NOTICE)
                .title(requireTitle(title))
                .description(normalizeText(description, 2500))
                .build();

        return toDto(learningResourceRepository.save(item));
    }

    @Transactional
    public LearningResourceResponse uploadPdf(Long lecturerId, String title, String description, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a PDF file.");
        }

        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String lowerName = originalName.toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        boolean isPdf = lowerName.endsWith(".pdf") || "application/pdf".equals(contentType);
        if (!isPdf) {
            throw new IllegalArgumentException("Only PDF files are allowed.");
        }

        User lecturer = userService.getUser(lecturerId);
        if (lecturer.getRole() != User.Role.LECTURER) {
            throw new IllegalArgumentException("Only lecturers can upload resources.");
        }

        String storedPath = storePdf(file);

        LearningResource item = LearningResource.builder()
                .lecturer(lecturer)
                .type(LearningResource.ResourceType.PDF)
                .title(requireTitle(title))
                .description(normalizeText(description, 2500))
                .filePath(storedPath)
                .fileName(originalName.isBlank() ? "resource.pdf" : originalName)
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .build();

        return toDto(learningResourceRepository.save(item));
    }

    @Transactional
    public void deleteResource(Long resourceId, Long userId, String role) {
        LearningResource item = learningResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", resourceId));

        boolean isAdmin = role != null && "ADMIN".equalsIgnoreCase(role);
        boolean isOwner = item.getLecturer() != null && item.getLecturer().getId().equals(userId);
        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You do not have permission to delete this resource.");
        }

        if (item.getFilePath() != null && !item.getFilePath().isBlank()) {
            try {
                Path file = Paths.get("uploads").resolve(item.getFilePath()).normalize();
                if (Files.exists(file)) {
                    Files.delete(file);
                }
            } catch (Exception ignored) {
                // Non-blocking cleanup.
            }
        }

        learningResourceRepository.delete(item);
    }

    private String storePdf(MultipartFile file) {
        try {
            Path base = Paths.get("uploads", "resources");
            if (!Files.exists(base)) {
                Files.createDirectories(base);
            }
            String safeName = Paths.get(file.getOriginalFilename() == null ? "resource.pdf" : file.getOriginalFilename())
                    .getFileName()
                    .toString()
                    .replaceAll("[^a-zA-Z0-9._-]", "_");
            String uniqueName = UUID.randomUUID() + "_" + safeName;
            Path path = base.resolve(uniqueName);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            return "resources/" + uniqueName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload PDF: " + e.getMessage());
        }
    }

    private LearningResourceResponse toDto(LearningResource item) {
        String lecturerName = item.getLecturer() == null ? "Lecturer" : item.getLecturer().getName();
        Long lecturerId = item.getLecturer() == null ? null : item.getLecturer().getId();
        return LearningResourceResponse.builder()
                .id(item.getId())
                .lecturerId(lecturerId)
                .lecturerName(lecturerName)
                .type(item.getType())
                .title(item.getTitle())
                .description(item.getDescription())
                .filePath(item.getFilePath())
                .fileName(item.getFileName())
                .mimeType(item.getMimeType())
                .fileSize(item.getFileSize())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private String requireTitle(String title) {
        String t = normalizeText(title, 220);
        if (t == null || t.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        return t;
    }

    private String normalizeText(String value, int maxLen) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.length() > maxLen) {
            throw new IllegalArgumentException("Text is too long. Maximum " + maxLen + " characters.");
        }
        return trimmed;
    }
}
