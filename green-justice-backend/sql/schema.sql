CREATE DATABASE IF NOT EXISTS green_justice;
USE green_justice;

CREATE TABLE IF NOT EXISTS authorities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role ENUM('authority', 'admin') DEFAULT 'authority',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS violation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS offices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT
);

CREATE TABLE IF NOT EXISTS office_violation_map (
    id INT AUTO_INCREMENT PRIMARY KEY,
    office_id INT NOT NULL,
    violation_type_id INT NOT NULL,
    district VARCHAR(100) NOT NULL,
    FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
    FOREIGN KEY (violation_type_id) REFERENCES violation_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_code VARCHAR(50) NOT NULL UNIQUE,
    violation_type_id INT NOT NULL,
    description TEXT,
    district VARCHAR(100) NOT NULL,
    landmark VARCHAR(255),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    language VARCHAR(20) DEFAULT 'en',
    size_level ENUM('small', 'medium', 'large') DEFAULT 'medium',
    reporter_name VARCHAR(100) NULL,
    reporter_phone VARCHAR(30) NULL,
    report_count INT DEFAULT 0,
    status ENUM('not_viewed', 'in_progress', 'resolved', 'rejected') DEFAULT 'not_viewed',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_type_id) REFERENCES violation_types(id)
);

CREATE TABLE IF NOT EXISTS evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type ENUM('image', 'video') NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaint_status_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    updated_by_authority_id INT NULL,
    old_status ENUM('not_viewed', 'in_progress', 'resolved', 'rejected') NULL,
    new_status ENUM('not_viewed', 'in_progress', 'resolved', 'rejected') NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by_authority_id) REFERENCES authorities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    sent_to_authority_id INT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent',
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_to_authority_id) REFERENCES authorities(id) ON DELETE SET NULL
);

INSERT IGNORE INTO violation_types (id, name, description) VALUES
(1, 'Illegal Waste Dumping', 'Garbage or waste dumped in public places'),
(2, 'Water Pollution', 'Pollution in rivers, lakes, drains or sea'),
(3, 'Air Pollution', 'Smoke, bad smell, or toxic gas release'),
(4, 'Illegal Tree Cutting', 'Unauthorized cutting of trees'),
(5, 'Noise Pollution', 'Excessive sound disturbing environment');

INSERT IGNORE INTO offices (id, name, district, email, phone, address) VALUES
(1, 'Municipal Environmental Office', 'Ampara', 'env.ampara@example.com', '+94-000000001', 'Main Street, Ampara'),
(2, 'District Environmental Authority', 'Batticaloa', 'env.batticaloa@example.com', '+94-000000002', 'Town Hall Road, Batticaloa'),
(3, 'Coastal Protection Unit', 'Ampara', 'coastal.ampara@example.com', '+94-000000003', 'Coastal Road, Ampara');

INSERT IGNORE INTO office_violation_map (id, office_id, violation_type_id, district) VALUES
(1, 1, 1, 'Ampara'),
(2, 1, 4, 'Ampara'),
(3, 2, 1, 'Batticaloa'),
(4, 2, 5, 'Batticaloa'),
(5, 3, 2, 'Ampara');
