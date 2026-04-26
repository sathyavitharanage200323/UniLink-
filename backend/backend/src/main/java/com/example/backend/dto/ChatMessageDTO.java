package com.example.backend.dto;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatMessageEdit;
import com.example.backend.model.ChatMessageReaction;
import com.example.backend.model.ChatPoll;
import com.example.backend.model.ChatPollOption;
import com.example.backend.model.ChatPollVote;
import lombok.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Outbound DTO for a chat message – sent over REST and WebSocket.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageDTO {

    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String content;
    private ChatMessage.MessageType messageType;
    private String fileUrl;
    private String fileName;
    private boolean read;
    private LocalDateTime readAt;
    private boolean pinned;
    private boolean markedAsAnswer;
    private boolean deleted;
    private boolean profanityFlagged;
    private Long replyToMessageId;
    private String replyPreview;
    private LocalDateTime editedAt;
    private int editCount;
    private Map<String, Long> reactions;
    private PollDTO poll;
    private LocalDateTime sentAt;

    public static ChatMessageDTO from(ChatMessage m) {
        String displayContent = m.isDeleted()
                ? "This message was deleted."
                : (m.getFilteredContent() != null ? m.getFilteredContent() : m.getContent());

        return ChatMessageDTO.builder()
                .id(m.getId())
                .roomId(m.getRoom().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .senderRole(m.getSender().getRole().name())
                .content(displayContent)
                .messageType(m.getMessageType())
                .fileUrl(m.isDeleted() ? null : m.getFileUrl())
                .fileName(m.isDeleted() ? null : m.getFileName())
                .read(m.isRead())
                .readAt(m.getReadAt())
                .pinned(m.isPinned())
                .markedAsAnswer(m.isMarkedAsAnswer())
                .deleted(m.isDeleted())
                .profanityFlagged(m.isProfanityFlagged())
                .replyToMessageId(m.getReplyToMessage() != null ? m.getReplyToMessage().getId() : null)
                .replyPreview(m.getReplyToMessage() != null ? truncate(m.getReplyToMessage().getContent(), 120) : null)
                .editedAt(m.getEditedAt())
                .editCount(m.getEditCount())
                .reactions(buildReactionSummary(m))
                .poll(m.getPoll() != null ? PollDTO.from(m.getPoll()) : null)
                .sentAt(m.getSentAt())
                .build();
    }

    private static String truncate(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }

    private static Map<String, Long> buildReactionSummary(ChatMessage message) {
        List<ChatMessageReaction> reactions = message.getReactions();
        if (reactions == null || reactions.isEmpty()) return Collections.emptyMap();

        Map<String, Long> grouped = reactions.stream()
                .collect(Collectors.groupingBy(ChatMessageReaction::getEmoji, LinkedHashMap::new, Collectors.counting()));
        return grouped;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PollDTO {
        private Long id;
        private String question;
        private List<PollOptionDTO> options;
        private long totalVotes;

        public static PollDTO from(ChatPoll poll) {
            List<PollOptionDTO> mappedOptions = (poll.getOptions() == null ? List.<ChatPollOption>of() : poll.getOptions())
                    .stream()
                    .map(PollOptionDTO::from)
                    .toList();

            long total = mappedOptions.stream().mapToLong(PollOptionDTO::getVoteCount).sum();

            return PollDTO.builder()
                    .id(poll.getId())
                    .question(poll.getQuestion())
                    .options(mappedOptions)
                    .totalVotes(total)
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PollOptionDTO {
        private Long id;
        private String text;
        private int position;
        private long voteCount;

        public static PollOptionDTO from(ChatPollOption option) {
            long count = option.getVotes() == null ? 0 : option.getVotes().size();
            return PollOptionDTO.builder()
                    .id(option.getId())
                    .text(option.getOptionText())
                    .position(option.getPosition())
                    .voteCount(count)
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EditHistoryDTO {
        private Long id;
        private String previousContent;
        private LocalDateTime editedAt;
        private Long editedByUserId;
        private String editedByName;

        public static EditHistoryDTO from(ChatMessageEdit edit) {
            return EditHistoryDTO.builder()
                    .id(edit.getId())
                    .previousContent(edit.getPreviousContent())
                    .editedAt(edit.getEditedAt())
                    .editedByUserId(edit.getEditedBy().getId())
                    .editedByName(edit.getEditedBy().getName())
                    .build();
        }
    }
}
