package com.example.backend.controller;

import com.example.backend.dto.ChatRoomSummaryDTO;
import com.example.backend.dto.ChatMessageDTO;
import com.example.backend.dto.ChatSummaryDTO;
import com.example.backend.dto.SendMessageRequest;
import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatRoom;
import com.example.backend.service.ChatExportService;
import com.example.backend.service.ChatSummaryService;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST API for chat room and message operations.
 * Base URL: /api/chat
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final ChatExportService exportService;
    private final ChatSummaryService summaryService;
    private final SimpMessagingTemplate messagingTemplate;

    // ─── Rooms ───────────────────────────────────────────────────

    /** Create room for a confirmed appointment */
    @PostMapping("/rooms/appointment/{appointmentId}")
    public ResponseEntity<ChatRoom> createRoom(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(chatService.createRoomForAppointment(appointmentId));
    }

    /** Get room by ID */
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ChatRoom> getRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getRoom(roomId));
    }

    /** Get room by appointment ID */
    @GetMapping("/rooms/by-appointment/{appointmentId}")
    public ResponseEntity<ChatRoom> getRoomByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(chatService.getRoomByAppointmentId(appointmentId));
    }

    /** Create or get direct room between a student and lecturer */
    @PostMapping("/rooms/direct")
    public ResponseEntity<ChatRoom> createDirectRoom(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("studentId").toString());
        Long lecturerId = Long.valueOf(body.get("lecturerId").toString());
        return ResponseEntity.ok(chatService.createOrGetDirectRoom(studentId, lecturerId));
    }

    /** Always create a brand-new direct room between a student and lecturer */
    @PostMapping("/rooms/direct/new")
    public ResponseEntity<ChatRoom> createNewDirectRoom(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("studentId").toString());
        Long lecturerId = Long.valueOf(body.get("lecturerId").toString());
        return ResponseEntity.ok(chatService.createNewDirectRoom(studentId, lecturerId));
    }

    /** Get room summaries visible to a user (appointment + direct) */
    @GetMapping("/rooms/user/{userId}")
    public ResponseEntity<List<ChatRoomSummaryDTO>> getRoomsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(chatService.getRoomSummariesForUser(userId));
    }

    /** Mark room as resolved */
    @PatchMapping("/rooms/{roomId}/resolve")
    public ResponseEntity<ChatRoom> resolveRoom(@PathVariable Long roomId,
                                                @RequestParam Long userId) {
        return ResponseEntity.ok(chatService.resolveRoom(roomId, userId));
    }

    // ─── Messages ────────────────────────────────────────────────

    /** Get all messages in a room */
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(
                chatService.getMessages(roomId).stream()
                        .map(ChatMessageDTO::from).toList());
    }

        /** Send message via REST and broadcast to websocket subscribers for reliability. */
        @PostMapping("/rooms/{roomId}/messages")
        public ResponseEntity<ChatMessageDTO> sendMessage(@PathVariable Long roomId,
                                  @RequestBody SendMessageRequest request) {
        ChatMessage saved = chatService.sendMessage(
            roomId,
            request.getSenderId(),
            request.getContent(),
            request.getMessageType(),
            request.getFileUrl(),
            request.getFileName());

        ChatMessageDTO dto = ChatMessageDTO.from(saved);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, dto);
        return ResponseEntity.ok(dto);
        }

    /** Keyword search across messages */
    @GetMapping("/rooms/{roomId}/messages/search")
    public ResponseEntity<List<ChatMessageDTO>> search(@PathVariable Long roomId,
                                                       @RequestParam String keyword) {
        return ResponseEntity.ok(
                chatService.searchMessages(roomId, keyword).stream()
                        .map(ChatMessageDTO::from).toList());
    }

    /** Filter messages by type (CODE, FILE, IMAGE, TEXT) */
    @GetMapping("/rooms/{roomId}/messages/filter")
    public ResponseEntity<List<ChatMessageDTO>> filterByType(
            @PathVariable Long roomId,
            @RequestParam ChatMessage.MessageType type) {
        return ResponseEntity.ok(
                chatService.filterByType(roomId, type).stream()
                        .map(ChatMessageDTO::from).toList());
    }

    /** Get pinned messages */
    @GetMapping("/rooms/{roomId}/messages/pinned")
    public ResponseEntity<List<ChatMessageDTO>> getPinned(@PathVariable Long roomId) {
        return ResponseEntity.ok(
                chatService.getPinnedMessages(roomId).stream()
                        .map(ChatMessageDTO::from).toList());
    }

    /** Get unread message count in room for user */
    @GetMapping("/rooms/{roomId}/messages/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long roomId,
                                                            @RequestParam Long userId) {
        return ResponseEntity.ok(Map.of("count", chatService.getUnreadCount(roomId, userId)));
    }

    /** Toggle pin on a message */
    @PatchMapping("/messages/{messageId}/pin")
    public ResponseEntity<ChatMessageDTO> togglePin(@PathVariable Long messageId) {
        return ResponseEntity.ok(ChatMessageDTO.from(chatService.togglePin(messageId)));
    }

    /** Mark a message as the answer */
    @PatchMapping("/messages/{messageId}/mark-answer")
    public ResponseEntity<ChatMessageDTO> markAnswer(@PathVariable Long messageId) {
        return ResponseEntity.ok(ChatMessageDTO.from(chatService.markAsAnswer(messageId)));
    }

    /** Mark a message as read */
    @PatchMapping("/messages/{messageId}/read")
    public ResponseEntity<ChatMessageDTO> markRead(@PathVariable Long messageId) {
        return ResponseEntity.ok(ChatMessageDTO.from(chatService.markRead(messageId)));
    }

    /** Soft-delete a message */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ChatMessageDTO> deleteMessage(@PathVariable Long messageId,
                                                        @RequestParam Long userId) {
        return ResponseEntity.ok(ChatMessageDTO.from(chatService.deleteMessage(messageId, userId)));
    }

    // ─── File Upload ─────────────────────────────────────────────

    /**
     * Upload an attachment (image, PDF, code file).
     * Returns the relative URL to embed in a chat message.
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam MultipartFile file) {
        try {
            String uploadDir = "uploads/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalName = file.getOriginalFilename();
            // Sanitize file name to prevent path traversal
            String safeName = Paths.get(originalName).getFileName().toString()
                    .replaceAll("[^a-zA-Z0-9._-]", "_");
            String uniqueName = UUID.randomUUID() + "_" + safeName;
            Path filePath = uploadPath.resolve(uniqueName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok(Map.of(
                    "fileUrl", "/" + uploadDir + uniqueName,
                    "fileName", originalName != null ? originalName : uniqueName
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "File upload failed."));
        }
    }

    // ─── Export ──────────────────────────────────────────────────

    /** Export chat transcript as PDF */
    @GetMapping("/rooms/{roomId}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long roomId) {
        byte[] pdf = exportService.exportToPdf(roomId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename("chat-" + roomId + ".pdf").build());
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    /** Export chat transcript as TXT */
    @GetMapping("/rooms/{roomId}/export/txt")
    public ResponseEntity<byte[]> exportTxt(@PathVariable Long roomId) {
        byte[] txt = exportService.exportToText(roomId).getBytes();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename("chat-" + roomId + ".txt").build());
        return ResponseEntity.ok().headers(headers).body(txt);
    }

    /** Generate Gemini summary for a room */
    @PostMapping("/rooms/{roomId}/summary/generate")
    public ResponseEntity<ChatSummaryDTO> generateSummary(@PathVariable Long roomId,
                                                          @RequestParam(defaultValue = "false") boolean includeSystemMessages) {
        return ResponseEntity.ok(summaryService.generateSummary(roomId, includeSystemMessages));
    }

    /** Export Gemini summary as TXT */
    @GetMapping("/rooms/{roomId}/summary/export/txt")
    public ResponseEntity<byte[]> exportSummaryTxt(@PathVariable Long roomId,
                                                   @RequestParam(defaultValue = "false") boolean includeSystemMessages) {
        ChatSummaryDTO summary = summaryService.generateSummary(roomId, includeSystemMessages);
        byte[] txt = summaryService.exportSummaryToText(summary).getBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename("chat-summary-" + roomId + ".txt").build());
        return ResponseEntity.ok().headers(headers).body(txt);
    }

    /** Export Gemini summary as PDF */
    @GetMapping("/rooms/{roomId}/summary/export/pdf")
    public ResponseEntity<byte[]> exportSummaryPdf(@PathVariable Long roomId,
                                                   @RequestParam(defaultValue = "false") boolean includeSystemMessages) {
        ChatSummaryDTO summary = summaryService.generateSummary(roomId, includeSystemMessages);
        byte[] pdf = summaryService.exportSummaryToPdf(summary);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename("chat-summary-" + roomId + ".pdf").build());
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}
