-- Smart Tree Tracker - Database Setup
-- Run: sudo mysql < server/setup-db.sql

CREATE DATABASE IF NOT EXISTS tree_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'tracker'@'localhost'
  IDENTIFIED BY 'tracker_pass';

GRANT ALL PRIVILEGES ON tree_tracker.* TO 'tracker'@'localhost';

FLUSH PRIVILEGES;

USE tree_tracker;

CREATE TABLE IF NOT EXISTS tree_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tree_id VARCHAR(50) NOT NULL,
  caretaker VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  action VARCHAR(20) NOT NULL,
  notes TEXT,
  photo_url LONGTEXT,
  timestamp BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tree_id (tree_id),
  INDEX idx_caretaker (caretaker),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Database setup complete!' AS message;
