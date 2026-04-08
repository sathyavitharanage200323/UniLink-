package com.example.backend.controller;

import com.example.backend.dto.AuthUserResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.PasswordResetConfirmRequest;
import com.example.backend.dto.PasswordResetRequest;
import com.example.backend.dto.PasswordResetVerifyRequest;
import com.example.backend.service.AuthService;
import com.example.backend.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<AuthUserResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthUserResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request);
        return ResponseEntity.ok(Map.of("message", "If the account exists, a reset code has been sent."));
    }

    @PostMapping("/password-reset/verify")
    public ResponseEntity<Map<String, String>> verifyPasswordReset(@RequestBody PasswordResetVerifyRequest request) {
        passwordResetService.verifyCode(request);
        return ResponseEntity.ok(Map.of("message", "Code verified"));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Map<String, String>> confirmPasswordReset(@RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.confirmReset(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }
}
