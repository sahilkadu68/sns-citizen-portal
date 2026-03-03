
-- MySQL Schema for Smart Nagrik Seva (SNS)

CREATE DATABASE IF NOT EXISTS sns_db;
USE sns_db;

-- 1. Departments Table
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Zones Table (Managed by Departments)
CREATE TABLE zones (
    zone_id INT AUTO_INCREMENT PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    department_id INT,
    boundary_coordinates TEXT, -- Storing GeoJSON or serialized polygon for routing
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- 3. Categories Table
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sla_hours INT DEFAULT 48 -- Default SLA for resolution
);

-- 4. Citizens Table
CREATE TABLE citizens (
    citizen_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_locked BOOLEAN DEFAULT FALSE,
    failed_attempts INT DEFAULT 0
);

-- 5. Administrators Table
CREATE TABLE administrators (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Field Officer', 'Supervisor', 'Admin') NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- 6. Complaints Table
CREATE TABLE complaints (
    complaint_id VARCHAR(20) PRIMARY KEY, -- Formatted ID like SNS-2024-001
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    image_url_before TEXT,
    image_url_after TEXT,
    status ENUM('Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Escalated') DEFAULT 'Pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    citizen_id INT NOT NULL,
    category_id INT NOT NULL,
    zone_id INT NOT NULL,
    assigned_admin_id INT,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (zone_id) REFERENCES zones(zone_id),
    FOREIGN KEY (assigned_admin_id) REFERENCES administrators(admin_id)
);

-- 7. Feedback Table
CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    feedback_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    complaint_id VARCHAR(20) UNIQUE NOT NULL,
    citizen_id INT NOT NULL,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id),
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);

-- 8. Escalation Table
CREATE TABLE escalations (
    escalation_id INT AUTO_INCREMENT PRIMARY KEY,
    reason TEXT NOT NULL,
    escalation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    complaint_id VARCHAR(20) NOT NULL,
    escalated_from_admin_id INT,
    escalated_to_admin_id INT,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id),
    FOREIGN KEY (escalated_from_admin_id) REFERENCES administrators(admin_id),
    FOREIGN KEY (escalated_to_admin_id) REFERENCES administrators(admin_id)
);

-- 9. Notifications Table
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    type ENUM('SMS', 'Email', 'In-App') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    complaint_id VARCHAR(20),
    citizen_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id),
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);
