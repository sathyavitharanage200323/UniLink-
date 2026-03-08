package com.example.backend.repository;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // All messages in a room ordered by time
    List<ChatMessage> findByRoomOrderBySentAtAsc(ChatRoom room);

    // Only pinned messages in a room
    List<ChatMessage> findByRoomAndPinnedTrueOrderBySentAtAsc(ChatRoom room);

    // Full-text style keyword search within a room
    @Query("SELECT m FROM ChatMessage m WHERE m.room = :room " +
           "AND m.deleted = false " +
           "AND (LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(m.filteredContent) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<ChatMessage> searchByKeyword(@Param("room") ChatRoom room,
                                      @Param("keyword") String keyword);

    // Messages by type for smart filtering (e.g., find all code snippets)
    List<ChatMessage> findByRoomAndMessageTypeOrderBySentAtAsc(
            ChatRoom room, ChatMessage.MessageType messageType);

    // Count unread messages for a user in a room
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.room = :room " +
           "AND m.sender.id <> :userId AND m.read = false")
    long countUnreadByRoomAndNotSender(@Param("room") ChatRoom room,
                                       @Param("userId") Long userId);
}
