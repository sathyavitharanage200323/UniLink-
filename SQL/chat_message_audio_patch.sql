-- Add AUDIO message type to chat_messages enum for existing databases.
-- Run this in the `unilink` database.

ALTER TABLE chat_messages
  MODIFY COLUMN message_type ENUM('TEXT','CODE','FILE','IMAGE','AUDIO','SYSTEM')
  NOT NULL DEFAULT 'TEXT';
