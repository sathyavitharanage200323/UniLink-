package com.example.backend.service;

import com.example.backend.dto.ChatMessageDTO;
import com.example.backend.dto.ChatRoomSummaryDTO;
import com.example.backend.exception.AccessDeniedException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final LecturerProfileRepository lecturerProfileRepository;
    private final StudentDisciplineRepository disciplineRepository;
    private final ChatMessageEditRepository chatMessageEditRepository;
    private final ChatMessageReactionRepository chatMessageReactionRepository;
    private final ChatPollRepository chatPollRepository;
    private final ChatPollOptionRepository chatPollOptionRepository;
    private final ChatPollVoteRepository chatPollVoteRepository;
    private final ProfanityFilterService profanityFilter;
    private static final long EDIT_WINDOW_MINUTES = 15;

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

    /** Create or return a direct message room between student and lecturer. */
    @Transactional
    public ChatRoom createOrGetDirectRoom(Long studentId, Long lecturerId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", studentId));
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", lecturerId));

        if (student.getRole() != User.Role.STUDENT) {
            throw new IllegalArgumentException("Direct room requires a student as sender.");
        }
        if (lecturer.getRole() != User.Role.LECTURER) {
            throw new IllegalArgumentException("Direct room requires a lecturer as recipient.");
        }

        List<ChatRoom> existingRooms = chatRoomRepository.findDirectRooms(studentId, lecturerId);
        ChatRoom latest = existingRooms.isEmpty() ? null : existingRooms.get(0);

        if (latest != null && latest.getStatus() == ChatRoom.RoomStatus.OPEN) {
            return latest;
        }

        ChatRoom room = ChatRoom.builder()
                .participantStudent(student)
                .participantLecturer(lecturer)
                .status(ChatRoom.RoomStatus.OPEN)
                .build();
        return chatRoomRepository.save(room);
    }

    /** Always create a new direct room between student and lecturer for a new question thread. */
    @Transactional
    public ChatRoom createNewDirectRoom(Long studentId, Long lecturerId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", studentId));
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", lecturerId));

        if (student.getRole() != User.Role.STUDENT) {
            throw new IllegalArgumentException("Direct room requires a student as sender.");
        }
        if (lecturer.getRole() != User.Role.LECTURER) {
            throw new IllegalArgumentException("Direct room requires a lecturer as recipient.");
        }

        ChatRoom room = ChatRoom.builder()
                .participantStudent(student)
                .participantLecturer(lecturer)
                .status(ChatRoom.RoomStatus.OPEN)
                .build();
        return chatRoomRepository.save(room);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomSummaryDTO> getRoomSummariesForUser(Long userId) {
        return chatRoomRepository.findAllByUserId(userId).stream()
                .sorted(Comparator.comparing(ChatRoom::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(room -> {
                    User lecturer = room.getAppointment() != null ? room.getAppointment().getLecturer() : room.getParticipantLecturer();
                    String designation = lecturer == null ? null : lecturerProfileRepository.findById(lecturer.getId())
                            .map(LecturerProfile::getDesignation)
                            .orElse(null);
                    return ChatRoomSummaryDTO.from(room, designation);
                })
                .collect(Collectors.toList());
    }

    /**
     * Mark a chat room as Resolved (lecturer closes the thread).
     */
    @Transactional
    public ChatRoom resolveRoom(Long roomId, Long resolvedByUserId) {
        ChatRoom room = getRoom(roomId);
        User resolver = userRepository.findById(resolvedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", resolvedByUserId));
        ensureRoomParticipant(room, resolver.getId());
        if (resolver.getRole() != User.Role.LECTURER) {
            throw new AccessDeniedException("Only lecturers can resolve a chat room.");
        }

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
        return sendMessage(roomId, senderId, content, type, fileUrl, fileName, null);
    }

    @Transactional
    public ChatMessage sendMessage(Long roomId, Long senderId, String content,
                                   ChatMessage.MessageType type,
                                   String fileUrl, String fileName,
                                   Long replyToMessageId) {
        ChatRoom room = getRoom(roomId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", senderId));
        ensureRoomParticipant(room, senderId);

        if (room.getStatus() == ChatRoom.RoomStatus.RESOLVED ||
            room.getStatus() == ChatRoom.RoomStatus.CLOSED) {
            throw new IllegalArgumentException("This chat room is closed or resolved.");
        }

        User lecturer = room.getAppointment() != null ? room.getAppointment().getLecturer() : room.getParticipantLecturer();
        User student  = room.getAppointment() != null ? room.getAppointment().getStudent() : room.getParticipantStudent();

        if (lecturer == null || student == null) {
            throw new IllegalArgumentException("Invalid room participants.");
        }

        ChatMessage replyTo = null;
        if (replyToMessageId != null) {
            replyTo = chatMessageRepository.findById(replyToMessageId)
                    .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", replyToMessageId));
            if (!replyTo.getRoom().getId().equals(roomId)) {
                throw new IllegalArgumentException("Reply target does not belong to this chat room.");
            }
        }

        // Security: block student messages when an active discipline block exists.
        if (sender.getId().equals(student.getId()) &&
            disciplineRepository.isStudentBlockedByLecturer(student, lecturer, LocalDateTime.now())) {
            throw new AccessDeniedException("You are blocked from messaging this lecturer.");
        }

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

        String safeContent = content == null ? "" : content;
        // Profanity check
        boolean hasProfanity = type != ChatMessage.MessageType.POLL && profanityFilter.containsProfanity(safeContent);
        String filtered = hasProfanity ? profanityFilter.filter(safeContent) : null;

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(safeContent)
                .filteredContent(filtered)
                .messageType(type != null ? type : ChatMessage.MessageType.TEXT)
                .fileUrl(fileUrl)
                .fileName(fileName)
                .profanityFlagged(hasProfanity)
                .replyToMessage(replyTo)
                .build();

        return chatMessageRepository.save(message);
    }

    @Transactional
    public ChatMessage createPoll(Long roomId, Long creatorId, String question, List<String> options) {
        ChatRoom room = getRoom(roomId);
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", creatorId));
        ensureRoomParticipant(room, creatorId);

        String q = question == null ? "" : question.trim();
        if (q.isBlank()) {
            throw new IllegalArgumentException("Poll question is required.");
        }
        if (q.length() > 500) {
            throw new IllegalArgumentException("Poll question is too long.");
        }
        List<String> cleaned = (options == null ? List.<String>of() : options).stream()
                .map(v -> v == null ? "" : v.trim())
                .filter(v -> !v.isBlank())
                .distinct()
                .toList();
        if (cleaned.size() < 2) {
            throw new IllegalArgumentException("A poll must have at least 2 options.");
        }
        if (cleaned.size() > 6) {
            throw new IllegalArgumentException("A poll can have at most 6 options.");
        }

        ChatPoll poll = ChatPoll.builder()
                .room(room)
                .creator(creator)
                .question(q)
                .build();
        ChatPoll savedPoll = chatPollRepository.save(poll);

        int pos = 0;
        for (String option : cleaned) {
            chatPollOptionRepository.save(
                    ChatPollOption.builder()
                            .poll(savedPoll)
                            .optionText(option)
                            .position(pos++)
                            .build()
            );
        }
        Long pollId = savedPoll.getId();
        savedPoll = chatPollRepository.findById(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatPoll", pollId));

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(creator)
                .content(q)
                .messageType(ChatMessage.MessageType.POLL)
                .poll(savedPoll)
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

    /** Returns unread message count in a room for a specific user. */
    public long getUnreadCount(Long roomId, Long userId) {
        ChatRoom room = getRoom(roomId);
        ensureRoomParticipant(room, userId);
        if (room.getStatus() == ChatRoom.RoomStatus.RESOLVED || room.getStatus() == ChatRoom.RoomStatus.CLOSED) {
            return 0;
        }
        return chatMessageRepository.countUnreadByRoomAndNotSender(room, userId);
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

    @Transactional
    public ChatMessage editMessage(Long messageId, Long requestingUserId, String updatedContent) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        if (!msg.getSender().getId().equals(requestingUserId)) {
            throw new AccessDeniedException("You can only edit your own messages.");
        }
        if (msg.isDeleted()) {
            throw new IllegalArgumentException("Deleted messages cannot be edited.");
        }
        if (msg.getMessageType() != ChatMessage.MessageType.TEXT && msg.getMessageType() != ChatMessage.MessageType.CODE) {
            throw new IllegalArgumentException("Only text/code messages can be edited.");
        }
        if (msg.getSentAt() == null || msg.getSentAt().isBefore(LocalDateTime.now().minusMinutes(EDIT_WINDOW_MINUTES))) {
            throw new IllegalArgumentException("Edit window has expired. You can edit within 15 minutes.");
        }

        String normalized = updatedContent == null ? "" : updatedContent.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Edited message cannot be empty.");
        }
        if (normalized.length() > 2000) {
            throw new IllegalArgumentException("Edited message exceeds 2000 characters.");
        }

        chatMessageEditRepository.save(
                ChatMessageEdit.builder()
                        .message(msg)
                        .editedBy(msg.getSender())
                        .previousContent(msg.getContent())
                        .build()
        );

        boolean hasProfanity = profanityFilter.containsProfanity(normalized);
        msg.setContent(normalized);
        msg.setFilteredContent(hasProfanity ? profanityFilter.filter(normalized) : null);
        msg.setProfanityFlagged(hasProfanity);
        msg.setEditedAt(LocalDateTime.now());
        msg.setEditCount(msg.getEditCount() + 1);
        return chatMessageRepository.save(msg);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO.EditHistoryDTO> getEditHistory(Long messageId, Long requestingUserId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        ensureRoomParticipant(msg.getRoom(), requestingUserId);
        return chatMessageEditRepository.findByMessageOrderByEditedAtDesc(msg).stream()
                .map(ChatMessageDTO.EditHistoryDTO::from)
                .toList();
    }

    @Transactional
    public ChatMessage toggleReaction(Long messageId, Long userId, String emoji) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        ensureRoomParticipant(msg.getRoom(), userId);

        String normalized = emoji == null ? "" : emoji.trim();
        if (normalized.isBlank() || normalized.length() > 16) {
            throw new IllegalArgumentException("Invalid emoji reaction.");
        }

        chatMessageReactionRepository.findByMessageAndUserAndEmoji(msg, user, normalized)
                .ifPresentOrElse(
                        chatMessageReactionRepository::delete,
                        () -> chatMessageReactionRepository.save(
                                ChatMessageReaction.builder()
                                        .message(msg)
                                        .user(user)
                                        .emoji(normalized)
                                        .build()
                        )
                );

        return chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
    }

    @Transactional
    public ChatMessage votePoll(Long pollId, Long optionId, Long voterId) {
        ChatPoll poll = chatPollRepository.findById(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatPoll", pollId));
        ChatPollOption option = chatPollOptionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatPollOption", optionId));
        if (!option.getPoll().getId().equals(pollId)) {
            throw new IllegalArgumentException("Selected option does not belong to the poll.");
        }

        User voter = userRepository.findById(voterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", voterId));
        ensureRoomParticipant(poll.getRoom(), voterId);

        ChatPollVote vote = chatPollVoteRepository.findByPollAndVoter(poll, voter)
                .orElseGet(() -> ChatPollVote.builder().poll(poll).voter(voter).build());
        vote.setOption(option);
        chatPollVoteRepository.save(vote);

        return chatMessageRepository.findByPollId(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage for poll " + pollId + " not found."));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> buildAppointmentDraftFromMessage(Long messageId, Long requesterId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatMessage", messageId));
        ChatRoom room = msg.getRoom();
        ensureRoomParticipant(room, requesterId);

        User lecturer = room.getAppointment() != null ? room.getAppointment().getLecturer() : room.getParticipantLecturer();
        User student = room.getAppointment() != null ? room.getAppointment().getStudent() : room.getParticipantStudent();
        if (lecturer == null || student == null) {
            throw new IllegalArgumentException("Unable to resolve room participants.");
        }

        String excerpt = msg.getContent() == null ? "" : msg.getContent().trim();
        if (excerpt.length() > 180) excerpt = excerpt.substring(0, 180) + "...";
        String reason = "Follow-up from chat message: " + excerpt;

        return Map.of(
                "lecturerId", lecturer.getId(),
                "studentId", student.getId(),
                "reason", reason,
                "messageId", msg.getId(),
                "roomId", room.getId()
        );
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

    private void ensureRoomParticipant(ChatRoom room, Long userId) {
        if (room == null || userId == null) {
            throw new AccessDeniedException("Chat room access denied.");
        }

        Long studentId = room.getAppointment() != null && room.getAppointment().getStudent() != null
                ? room.getAppointment().getStudent().getId()
                : (room.getParticipantStudent() != null ? room.getParticipantStudent().getId() : null);
        Long lecturerId = room.getAppointment() != null && room.getAppointment().getLecturer() != null
                ? room.getAppointment().getLecturer().getId()
                : (room.getParticipantLecturer() != null ? room.getParticipantLecturer().getId() : null);

        if (!userId.equals(studentId) && !userId.equals(lecturerId)) {
            throw new AccessDeniedException("You are not a participant of this chat room.");
        }
    }
}
