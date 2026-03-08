package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatRoom;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generates a PDF transcript of an entire chat room conversation.
 * Students can download this as a study note.
 */
@Service
@RequiredArgsConstructor
public class ChatExportService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

    public byte[] exportToPdf(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));

        List<ChatMessage> messages = chatMessageRepository.findByRoomOrderBySentAtAsc(room);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 60);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            // Header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font metaFont  = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.ITALIC);
            Font nameFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font bodyFont  = FontFactory.getFont(FontFactory.HELVETICA, 10);

            doc.add(new Paragraph("UniLink – Chat Transcript", titleFont));
            doc.add(new Paragraph(
                    "Appointment #" + room.getAppointment().getId() +
                    "  |  Student: " + room.getAppointment().getStudent().getName() +
                    "  |  Lecturer: " + room.getAppointment().getLecturer().getName(),
                    metaFont));
            doc.add(new Paragraph(
                    "Exported: " + java.time.LocalDateTime.now().format(FMT),
                    metaFont));
            doc.add(new Paragraph(" "));

            // Messages
            for (ChatMessage msg : messages) {
                if (msg.isDeleted()) continue;

                String displayContent = msg.isMarkedAsAnswer()
                        ? "[ANSWER] " + msg.getContent()
                        : msg.getContent();

                String displayName = msg.getSender().getName()
                        + " [" + msg.getSender().getRole() + "]"
                        + "  " + (msg.getSentAt() != null ? msg.getSentAt().format(FMT) : "");

                doc.add(new Paragraph(displayName, nameFont));

                if (msg.getMessageType() == ChatMessage.MessageType.CODE) {
                    Font codeFont = FontFactory.getFont(FontFactory.COURIER, 9);
                    doc.add(new Paragraph(displayContent, codeFont));
                } else {
                    doc.add(new Paragraph(displayContent, bodyFont));
                }

                if (msg.getFileUrl() != null) {
                    Font fileFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.ITALIC);
                    doc.add(new Paragraph("[Attachment: " + msg.getFileName() + "]", fileFont));
                }
                doc.add(new Paragraph(" "));
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF transcript: " + e.getMessage(), e);
        }
    }

    /**
     * Exports chat as plain text (TXT).
     */
    public String exportToText(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));

        List<ChatMessage> messages = chatMessageRepository.findByRoomOrderBySentAtAsc(room);
        StringBuilder sb = new StringBuilder();
        sb.append("UniLink Chat Transcript\n");
        sb.append("Appointment #").append(room.getAppointment().getId()).append("\n");
        sb.append("Student: ").append(room.getAppointment().getStudent().getName()).append("\n");
        sb.append("Lecturer: ").append(room.getAppointment().getLecturer().getName()).append("\n");
        sb.append("-".repeat(60)).append("\n\n");

        for (ChatMessage msg : messages) {
            if (msg.isDeleted()) continue;
            sb.append("[").append(msg.getSentAt() != null ? msg.getSentAt().format(FMT) : "").append("] ");
            sb.append(msg.getSender().getName()).append(": ");
            sb.append(msg.getContent()).append("\n");
            if (msg.getFileUrl() != null) {
                sb.append("  [Attachment: ").append(msg.getFileName()).append("]\n");
            }
        }
        return sb.toString();
    }
}
