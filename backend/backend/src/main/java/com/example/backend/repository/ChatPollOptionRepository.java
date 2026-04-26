package com.example.backend.repository;

import com.example.backend.model.ChatPollOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatPollOptionRepository extends JpaRepository<ChatPollOption, Long> {
}

