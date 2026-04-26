package com.example.backend.repository;

import com.example.backend.model.ChatPoll;
import com.example.backend.model.ChatPollVote;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatPollVoteRepository extends JpaRepository<ChatPollVote, Long> {
    Optional<ChatPollVote> findByPollAndVoter(ChatPoll poll, User voter);
}

