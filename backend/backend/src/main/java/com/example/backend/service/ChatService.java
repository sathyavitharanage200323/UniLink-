package com.example.backend.service;

import com.example.backend.exception.AccessDeniedException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final StudentDisciplineRepository disciplineRepository;
    private final ProfanityFilterService profanityFilter;

    // ─────────────────────────────────────────────────────────────
    // ROOM MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    /**
     * Creates a ChatRoom for a confirmed appointment.
     * Called automatically when an appointment is confirmed.
     */
    @Transactional
    public ChatRoom createRoomForAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));

        if (appointment.getStatus() != Appointment.Status.CONFIRMED) {
            throw new IllegalArgumentException("Chat rooms can only be created for CONFIRMED appointments.");
        }

        // Prevent duplicate rooms
        return chatRoomRepository.findByAppointmentId(appointmentId).orElseGet(() -> {
            ChatRoom room = ChatRoom.builder()
                    .appointment(appointment)
                    .status(ChatRoom.RoomStatus.OPEN)
                    .build();
            return chatRoomRepository.save(room);
        });
    }

    public ChatRoom getRoom(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));
    }

    public ChatRoom getRoomByAppointmentId(Long appointmentId) {
        return chatRoomRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ChatRoom for appointment " + appointmentId + " not found."));
    }

    /**
     * Mark a chat room as Resolved (lecturer closes the thread).
     */
    @Transactional
    public ChatRoom resolveRoom(Long roomId, Long resolvedByUserId) {
        ChatRoom room = getRoom(roomId);
        User resolver = userRepository.findById(resolvedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", resolvedByUserId));

        room.setStatus(ChatRoom.RoomStatus.RESOLVED);
        room.setResolvedAt(LocalDateTime.now());
        room.setResolvedBy(resolver);
        return chatRoomRepository.save(room);
    }

    // ─────────────────────────────────────────────────────────────
    // MESSAGES
    // ─────────────────────────────────────────────────────────────

    /**
     * Saves a new message, applying the profanity filter automatically.
     */
    @Transactional
    public ChatMessage sendMessage(Long roomId, Long senderId, String content,
                                   ChatMessage.MessageType type,
                                   String fileUrl, String fileName) {
        ChatRoom room = getRoom(roomId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", senderId));

        if (room.getStatus() == ChatRoom.RoomStatus.RESOLVED ||
            room.getStatus() == ChatRoom.RoomStatus.CLOSED) {
            throw new IllegalArgumentException("This chat room is closed or resolved.");
        }

        // Auto-reply: if lecturer has DND on and sender is a student
        User lecturer = room.getAppointment().getLecturer();
        User student  = room.getAppointment().getStudent();
        if (sender.getId().equals(student.getId()) && lecturer.isDoNotDisturb()) {
            ChatMessage autoReply = ChatMessage.builder()
                    .room(room)
                    .sender(lecturer)
                    .content(lecturer.getAutoReplyMessage() != null
                            ? lecturer.getAutoReplyMessage()
                            : "The lecturer is currently unavailable. Please try again later.")
                    .messageType(ChatMessage.MessageType.SYSTEM)
                    .build();
            chatMessageRepository.save(autoReply);
        }

        // Profanity check
        boolean hasProfanity = profanityFilter.containsProfanity(content);
        String filtered = hasProfanity ? profanityFilter.filter(content) : null;

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .filteredContent(filtered)
                .messageType(type != null ? type : ChatMessage.MessageType.TEXT)
                .fileUrl(fileUrl)
                .fileName(fileName)
                .profanityFlagged(hasProfanity)
                .build();

        return chatMessageRepository.save(message);
    }

    /** Returns all messages for a room in chronological order. */
    public List<ChatMessage> getMessages(Long roomId) {
        ChatRoom room = getRoom(roomId);
        return chatMessageRepository.findByRoomOrderBySentAtAsc(room);
    }

    /** Smart keyword search within a room. */
    public List<ChatMessage> searchMessages(Long roomId, String keyword) {
        ChatRoom room = getRoom(roomId);
        return chatMessageRepository.searchByKeyword(room, keyword);
    }

    /** Filter messages by type (e.g., only CODE snippets). */
    public List<ChatMessage> filterByType(Long roomId, ChatMessage.MessageType type) {
        ChatRoom room = getRoom(roomId);
        return chatMessageRepository.findByRoomAndMessageTypeOrderBySentAtAsc(room, type);
    }

    /** Returns all pinned messages in a room. */
    public List<ChatMessage> getPinnedMessages(Long roomId) {
        ChatRoom room = getRoom(roomId);
        return chatMessageRepository.findByRoomAndPinnedTrueOrderBySentAtAsc(room);
    }

    /** Toggle pin on a message. */
    @Transactional
    public ChatMessage togglePin(Long messageId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        msg.setPinned(!msg.isPinned());
        return chatMessageRepository.save(msg);
    }

    /** Mark a message as the answer. */
    @Transactional
    public ChatMessage markAsAnswer(Long messageId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        msg.setMarkedAsAnswer(!msg.isMarkedAsAnswer());
        return chatMessageRepository.save(msg);
    }

    /** Mark a message as read. */
    @Transactional
    public ChatMessage markRead(Long messageId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        if (!msg.isRead()) {
            msg.setRead(true);
            msg.setReadAt(LocalDateTime.now());
            chatMessageRepository.save(msg);
        }
        return msg;
    }

    /** Soft-delete a message. */
    @Transactional
    public ChatMessage deleteMessage(Long messageId, Long requestingUserId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        if (!msg.getSender().getId().equals(requestingUserId)) {
            throw new AccessDeniedException("You can only delete your own messages.");
        }
        msg.setDeleted(true);
        msg.setContent("This message was deleted.");
        msg.setFilteredContent(null);
        return chatMessageRepository.save(msg);
    }
}
