package com.example.backend.service;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    /** Lecturer toggles Do Not Disturb mode, optionally setting an auto-reply message. */
    @Transactional
    public User toggleDoNotDisturb(Long lecturerId, boolean dnd, String autoReplyMessage) {
        User lecturer = getUser(lecturerId);
        lecturer.setDoNotDisturb(dnd);
        if (autoReplyMessage != null) {
            lecturer.setAutoReplyMessage(autoReplyMessage);
        }
        return userRepository.save(lecturer);
    }
}
