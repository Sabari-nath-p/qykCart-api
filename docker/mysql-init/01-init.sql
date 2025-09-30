-- QYKCart Database Initialization Script
-- This script will be executed when MySQL container starts for the first time

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS qykcart_db;

-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS 'qykcart_user'@'%' IDENTIFIED BY 'qykcart_password';

-- Grant all privileges to the user for the database
GRANT ALL PRIVILEGES ON qykcart_db.* TO 'qykcart_user'@'%';

-- Refresh privileges
FLUSH PRIVILEGES;

-- Use the database
USE qykcart_db;

-- Create a simple health check table
CREATE TABLE IF NOT EXISTS health_check (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health check record
INSERT INTO health_check (status) VALUES ('database_initialized');

-- Display initialization complete message
SELECT 'QYKCart Database initialized successfully!' AS message;