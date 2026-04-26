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
            if (!columnType.contains("'AUDIO'") || !columnType.contains("'POLL'")) {
                jdbcTemplate.execute(
                        "ALTER TABLE chat_messages " +
                                "MODIFY COLUMN message_type " +
                                "ENUM('TEXT','CODE','FILE','IMAGE','AUDIO','POLL','SYSTEM') " +
                                "NOT NULL DEFAULT 'TEXT'"
                );
                log.info("Updated chat_messages.message_type enum to include AUDIO and POLL.");
            }
        } catch (Exception ex) {
            log.warn("Could not verify/update chat_messages.message_type enum: {}", ex.getMessage());
        }
    }

    @PostConstruct
    public void ensureUserNotificationPreferenceColumn() {
        try {
            Integer columnCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' " +
                            "AND COLUMN_NAME = 'notifications_enabled'",
                    Integer.class
            );

            if (columnCount == null || columnCount == 0) {
                jdbcTemplate.execute(
                        "ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE"
                );
                log.info("Added users.notifications_enabled column.");
            }
        } catch (Exception ex) {
            log.warn("Could not verify/create users.notifications_enabled column: {}", ex.getMessage());
        }
    }

    @PostConstruct
    public void ensureAdvancedChatFeatureTables() {
        try {
            jdbcTemplate.execute("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_message_id BIGINT NULL");
            jdbcTemplate.execute("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at DATETIME NULL");
            jdbcTemplate.execute("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edit_count INT NOT NULL DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS poll_id BIGINT NULL");

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS chat_message_edits (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "message_id BIGINT NOT NULL," +
                    "edited_by BIGINT NOT NULL," +
                    "previous_content TEXT NOT NULL," +
                    "edited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                    "INDEX idx_cme_message (message_id)," +
                    "CONSTRAINT fk_cme_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE," +
                    "CONSTRAINT fk_cme_user FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE" +
                    ")");

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS chat_message_reactions (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "message_id BIGINT NOT NULL," +
                    "user_id BIGINT NOT NULL," +
                    "emoji VARCHAR(16) NOT NULL," +
                    "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                    "UNIQUE KEY uk_msg_user_emoji (message_id, user_id, emoji)," +
                    "INDEX idx_cmr_message (message_id)," +
                    "CONSTRAINT fk_cmr_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE," +
                    "CONSTRAINT fk_cmr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                    ")");

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS chat_polls (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "room_id BIGINT NOT NULL," +
                    "creator_id BIGINT NOT NULL," +
                    "question VARCHAR(500) NOT NULL," +
                    "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                    "INDEX idx_cp_room (room_id)," +
                    "CONSTRAINT fk_cp_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE," +
                    "CONSTRAINT fk_cp_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE" +
                    ")");

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS chat_poll_options (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "poll_id BIGINT NOT NULL," +
                    "option_text VARCHAR(255) NOT NULL," +
                    "position INT NOT NULL," +
                    "INDEX idx_cpo_poll (poll_id)," +
                    "CONSTRAINT fk_cpo_poll FOREIGN KEY (poll_id) REFERENCES chat_polls(id) ON DELETE CASCADE" +
                    ")");

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS chat_poll_votes (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "poll_id BIGINT NOT NULL," +
                    "option_id BIGINT NOT NULL," +
                    "voter_id BIGINT NOT NULL," +
                    "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                    "UNIQUE KEY uk_poll_user_vote (poll_id, voter_id)," +
                    "INDEX idx_cpv_poll (poll_id)," +
                    "CONSTRAINT fk_cpv_poll FOREIGN KEY (poll_id) REFERENCES chat_polls(id) ON DELETE CASCADE," +
                    "CONSTRAINT fk_cpv_option FOREIGN KEY (option_id) REFERENCES chat_poll_options(id) ON DELETE CASCADE," +
                    "CONSTRAINT fk_cpv_voter FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE" +
                    ")");

            jdbcTemplate.execute("ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_message_reply_to " +
                    "FOREIGN KEY (reply_to_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL");
        } catch (Exception ex) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (!(msg.contains("duplicate") || msg.contains("already exists"))) {
                log.warn("Could not verify/create advanced chat feature schema: {}", ex.getMessage());
            }
        }
    }
}
