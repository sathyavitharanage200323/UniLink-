package com.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("UniLink Password Reset Code");
        message.setText("Your UniLink password reset code is: " + code + "\n\n" +
                "This code expires in 10 minutes. If you did not request this, please ignore this email.");
        mailSender.send(message);
    }
}
