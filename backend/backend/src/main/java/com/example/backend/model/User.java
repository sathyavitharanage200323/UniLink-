package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // STUDENT, LECTURER, or ADMIN

    @Column(length = 100)
    private String department;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String expertise;

    // Do Not Disturb toggle for lecturers
    @Column(name = "do_not_disturb", nullable = false)
    private boolean doNotDisturb = false;

    // Next available slot message for auto-reply
    @Column(name = "auto_reply_message", length = 500)
    private String autoReplyMessage;

    // Global in-app notification preference (especially used by students)
    @Builder.Default
    @Column(name = "notifications_enabled", nullable = false)
    private boolean notificationEnabled = true;

    // Profile image fields present in DB from previous version
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "profile_image", length = 255)
    private String profileImage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Role {
        STUDENT, LECTURER, ADMIN
    }
}
