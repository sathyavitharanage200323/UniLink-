package com.example.backend.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseMigrations {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrations.class);
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureChatMessageAudioType() {
        try {
            String columnType = jdbcTemplate.queryForObject(
                    "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' " +
                            "AND COLUMN_NAME = 'message_type'",
                    String.class
            );

            if (columnType == null) {
                return;
            }
            if (!columnType.contains("'AUDIO'")) {
                jdbcTemplate.execute(
                        "ALTER TABLE chat_messages " +
                                "MODIFY COLUMN message_type " +
                                "ENUM('TEXT','CODE','FILE','IMAGE','AUDIO','SYSTEM') " +
                                "NOT NULL DEFAULT 'TEXT'"
                );
                log.info("Updated chat_messages.message_type enum to include AUDIO.");
            }
        } catch (Exception ex) {
            log.warn("Could not verify/update chat_messages.message_type enum: {}", ex.getMessage());
        }
    }
}
