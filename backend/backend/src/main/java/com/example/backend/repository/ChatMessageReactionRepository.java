package com.example.backend.repository;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatMessageReaction;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageReactionRepository extends JpaRepository<ChatMessageReaction, Long> {
    Optional<ChatMessageReaction> findByMessageAndUserAndEmoji(ChatMessage message, User user, String emoji);
    List<ChatMessageReaction> findByMessage(ChatMessage message);
}

