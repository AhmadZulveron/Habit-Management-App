-- =========================================================
-- HABIT MANAGEMENT APPLICATION DATABASE
-- Based on ERD in LAPORAN TUGAS AKHIR(5).docx
-- Database: MySQL
-- =========================================================

CREATE DATABASE IF NOT EXISTS habit_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE habit_management;

-- =========================================================
-- DROP TABLES
-- Order follows foreign key dependencies
-- =========================================================

DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS habit_completions;
DROP TABLE IF EXISTS habit_schedules;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS habit_templates;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- =========================================================
-- 1. USERS
-- =========================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    total_points INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- 2. CATEGORIES
-- =========================================================

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    icon VARCHAR(100) DEFAULT NULL,
    color VARCHAR(20) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_category_name (name)
);

-- =========================================================
-- 3. HABITS
-- =========================================================

CREATE TABLE habits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,

    priority ENUM('high', 'medium', 'low')
        NOT NULL DEFAULT 'medium',

    target INT UNSIGNED NOT NULL DEFAULT 1,

    status ENUM('active', 'inactive')
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_habits_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_habits_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================
-- 4. HABIT SCHEDULES
-- =========================================================

CREATE TABLE habit_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    habit_id BIGINT UNSIGNED NOT NULL,

    day_of_week TINYINT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_day_of_week
        CHECK (day_of_week BETWEEN 0 AND 6),

    CONSTRAINT fk_habit_schedules_habit
        FOREIGN KEY (habit_id)
        REFERENCES habits(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_habit_schedule (habit_id, day_of_week)
);

-- =========================================================
-- 5. HABIT COMPLETIONS
-- =========================================================

CREATE TABLE habit_completions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    habit_id BIGINT UNSIGNED NOT NULL,

    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    points_earned INT UNSIGNED NOT NULL DEFAULT 0,

    CONSTRAINT fk_habit_completions_habit
        FOREIGN KEY (habit_id)
        REFERENCES habits(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- 6. HABIT TEMPLATES
-- Source of recommendation candidates
-- =========================================================

CREATE TABLE habit_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    category_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,

    difficulty ENUM('easy', 'medium', 'hard')
        NOT NULL DEFAULT 'easy',

    priority ENUM('high', 'medium', 'low')
        NOT NULL DEFAULT 'medium',

    popularity_score DECIMAL(5,2)
        NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_habit_templates_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================
-- 7. BADGES
-- =========================================================

CREATE TABLE badges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,

    badge_type VARCHAR(50) NOT NULL,

    requirement_value INT UNSIGNED NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_badge_name (name)
);

-- =========================================================
-- 8. USER BADGES
-- =========================================================

CREATE TABLE user_badges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    badge_id BIGINT UNSIGNED NOT NULL,

    earned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_badges_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_badges_badge
        FOREIGN KEY (badge_id)
        REFERENCES badges(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_user_badge (user_id, badge_id)
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_habits_user_id
    ON habits(user_id);

CREATE INDEX idx_habits_category_id
    ON habits(category_id);

CREATE INDEX idx_habit_schedules_habit_id
    ON habit_schedules(habit_id);

CREATE INDEX idx_habit_completions_habit_id
    ON habit_completions(habit_id);

CREATE INDEX idx_habit_completions_completed_at
    ON habit_completions(completed_at);

CREATE INDEX idx_habit_templates_category_id
    ON habit_templates(category_id);

CREATE INDEX idx_user_badges_user_id
    ON user_badges(user_id);

CREATE INDEX idx_user_badges_badge_id
    ON user_badges(badge_id);