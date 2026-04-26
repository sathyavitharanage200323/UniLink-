package com.example.backend.repository;

import com.example.backend.model.ChatPoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatPollRepository extends JpaRepository<ChatPoll, Long> {
}

