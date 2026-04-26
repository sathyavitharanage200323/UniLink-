package com.example.backend.repository;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatMessageEdit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageEditRepository extends JpaRepository<ChatMessageEdit, Long> {
    List<ChatMessageEdit> findByMessageOrderByEditedAtDesc(ChatMessage message);
}

