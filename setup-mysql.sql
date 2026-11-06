-- MySQL Setup Script for Drishti AI
-- Run this with admin privileges

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS drishti_ai;

-- Create user (if not exists)
CREATE USER IF NOT EXISTS 'drishti'@'localhost' IDENTIFIED BY 'najla@09';

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON drishti_ai.* TO 'drishti'@'localhost';

-- Refresh permissions
FLUSH PRIVILEGES;

USE drishti_ai;

CREATE TABLE IF NOT EXISTS users (
	id VARCHAR(50) NOT NULL,
	name VARCHAR(150) NOT NULL,
	username VARCHAR(100) NOT NULL UNIQUE,
	email VARCHAR(255) NULL UNIQUE,
	password VARCHAR(255) NULL,
	pin_hash VARCHAR(255) NULL,
	role VARCHAR(50) NOT NULL DEFAULT 'health_worker',
	phone VARCHAR(20) NULL,
	village VARCHAR(150) NULL,
	district VARCHAR(150) NULL,
	state VARCHAR(150) NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS patients (
	id VARCHAR(100) NOT NULL,
	patient_code VARCHAR(100) NOT NULL UNIQUE,
	user_id VARCHAR(50) NULL,
	name VARCHAR(150) NOT NULL,
	age INT NULL,
	gender VARCHAR(30) NULL,
	phone VARCHAR(30) NULL,
	village VARCHAR(150) NULL,
	district VARCHAR(150) NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS retinal_scans (
	id VARCHAR(100) NOT NULL,
	patient_id VARCHAR(100) NOT NULL,
	eye VARCHAR(20) NOT NULL,
	image_path VARCHAR(500) NULL,
	image_quality DECIMAL(5,2) NULL,
	quality_status VARCHAR(50) NULL,
	dr_grade INT NULL,
	confidence DECIMAL(6,5) NULL,
	risk_level VARCHAR(50) NULL,
	ai_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	CONSTRAINT fk_retinal_scans_patient
		FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
	INDEX idx_retinal_scans_patient_id (patient_id),
	INDEX idx_retinal_scans_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS doctors (
	id VARCHAR(50) NOT NULL,
	name VARCHAR(150) NOT NULL,
	title VARCHAR(200) NULL,
	role VARCHAR(200) NULL,
	specialty VARCHAR(200) NULL,
	hospital VARCHAR(250) NULL,
	location VARCHAR(250) NULL,
	fee DECIMAL(10,2) NULL DEFAULT 500.00,
	experience VARCHAR(100) NULL,
	rating DECIMAL(3,2) NULL DEFAULT 4.90,
	reviews_count INT NULL DEFAULT 0,
	avatar_color VARCHAR(20) NULL DEFAULT '#0891b2',
	about TEXT NULL,
	created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS doctor_available_days (
	id INT NOT NULL AUTO_INCREMENT,
	doctor_id VARCHAR(50) NOT NULL,
	day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_doctor_days (doctor_id)
);

CREATE TABLE IF NOT EXISTS doctor_available_slots (
	id INT NOT NULL AUTO_INCREMENT,
	doctor_id VARCHAR(50) NOT NULL,
	slot_time VARCHAR(30) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_doctor_slots (doctor_id)
);

CREATE TABLE IF NOT EXISTS doctor_languages (
	id INT NOT NULL AUTO_INCREMENT,
	doctor_id VARCHAR(50) NOT NULL,
	language_name VARCHAR(50) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_doctor_languages (doctor_id)
);

CREATE TABLE IF NOT EXISTS doctor_modes (
	id INT NOT NULL AUTO_INCREMENT,
	doctor_id VARCHAR(50) NOT NULL,
	mode ENUM('in-person','tele-consultation') NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_doctor_modes (doctor_id)
);

-- ===================================================================
-- Compatibility migrations for databases created by earlier app schemas
-- ===================================================================

-- 1. Ensure patient_code exists in patients table
SET @patient_code_exists = (
	SELECT COUNT(*)
	FROM information_schema.columns
	WHERE table_schema = DATABASE()
	  AND table_name = 'patients'
	  AND column_name = 'patient_code'
);
SET @add_patient_code = IF(
	@patient_code_exists = 0,
	'ALTER TABLE patients ADD COLUMN patient_code VARCHAR(100) NULL AFTER id',
	'SELECT 1'
);
PREPARE add_patient_code_statement FROM @add_patient_code;
EXECUTE add_patient_code_statement;
DEALLOCATE PREPARE add_patient_code_statement;
UPDATE patients SET patient_code = id WHERE patient_code IS NULL OR patient_code = '';

-- 2. Ensure gender is VARCHAR(30) in patients table
SET @gender_is_enum = (
	SELECT COUNT(*)
	FROM information_schema.columns
	WHERE table_schema = DATABASE()
	  AND table_name = 'patients'
	  AND column_name = 'gender'
	  AND data_type = 'enum'
);
SET @alter_gender = IF(
	@gender_is_enum > 0,
	'ALTER TABLE patients MODIFY COLUMN gender VARCHAR(30) NULL',
	'SELECT 1'
);
PREPARE alter_gender_stmt FROM @alter_gender;
EXECUTE alter_gender_stmt;
DEALLOCATE PREPARE alter_gender_stmt;

-- 3. Ensure email exists on users table
SET @email_exists = (
	SELECT COUNT(*)
	FROM information_schema.columns
	WHERE table_schema = DATABASE()
	  AND table_name = 'users'
	  AND column_name = 'email'
);
SET @add_email = IF(
	@email_exists = 0,
	'ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL UNIQUE AFTER name',
	'SELECT 1'
);
PREPARE add_email_stmt FROM @add_email;
EXECUTE add_email_stmt;
DEALLOCATE PREPARE add_email_stmt;

-- 4. Ensure password exists on users table
SET @password_exists = (
	SELECT COUNT(*)
	FROM information_schema.columns
	WHERE table_schema = DATABASE()
	  AND table_name = 'users'
	  AND column_name = 'password'
);
SET @add_password = IF(
	@password_exists = 0,
	'ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER email',
	'SELECT 1'
);
PREPARE add_password_stmt FROM @add_password;
EXECUTE add_password_stmt;
DEALLOCATE PREPARE add_password_stmt;

-- 5. Ensure role is VARCHAR(50) in users table
SET @role_is_enum = (
	SELECT COUNT(*)
	FROM information_schema.columns
	WHERE table_schema = DATABASE()
	  AND table_name = 'users'
	  AND column_name = 'role'
	  AND data_type = 'enum'
);
SET @alter_role = IF(
	@role_is_enum > 0,
	'ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT \'health_worker\'',
	'SELECT 1'
);
PREPARE alter_role_stmt FROM @alter_role;
EXECUTE alter_role_stmt;
DEALLOCATE PREPARE alter_role_stmt;

-- Verify
SELECT USER(), DATABASE();
