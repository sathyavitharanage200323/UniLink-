package com.example.backend.service;

import com.example.backend.dto.PasswordResetConfirmRequest;
import com.example.backend.dto.PasswordResetRequest;
import com.example.backend.dto.PasswordResetVerifyRequest;
import com.example.backend.model.PasswordResetToken;
import com.example.backend.model.User;
import com.example.backend.repository.PasswordResetTokenRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int TOKEN_EXPIRY_MINUTES = 10;

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Transactional
    public void requestReset(PasswordResetRequest request) {
        if (request == null || isBlank(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase()).orElse(null);
        if (user == null || user.getRole() == User.Role.ADMIN) {
            return; // Always respond success to avoid account enumeration.
        }

        tokenRepository.markAllUsedByUserId(user.getId());
        String code = generateCode();

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .token(code)
                .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES))
                .used(false)
                .build();
        tokenRepository.save(token);

        emailService.sendPasswordResetCode(user.getEmail(), code);
    }

    @Transactional(readOnly = true)
    public void verifyCode(PasswordResetVerifyRequest request) {
        validateEmailAndCode(request == null ? null : request.getEmail(), request == null ? null : request.getCode());

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password reset is not available for this role");
        }

        tokenRepository.findValidToken(user.getId(), request.getCode().trim(), LocalDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));
    }

    @Transactional
    public void confirmReset(PasswordResetConfirmRequest request) {
        validateEmailAndCode(request == null ? null : request.getEmail(), request == null ? null : request.getCode());
        if (isBlank(request.getNewPassword()) || request.getNewPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password reset is not available for this role");
        }

        PasswordResetToken token = tokenRepository.findValidToken(user.getId(), request.getCode().trim(), LocalDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));

        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
    }

    private String generateCode() {
        int value = 100000 + new Random().nextInt(900000);
        return String.valueOf(value);
    }

    private void validateEmailAndCode(String email, String code) {
        if (isBlank(email) || isBlank(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and code are required");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
