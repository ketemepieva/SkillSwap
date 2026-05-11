CREATE DATABASE IF NOT EXISTS skillswap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillswap;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  bio TEXT,
  credibility_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nom_competence VARCHAR(160) NOT NULL,
  categorie VARCHAR(60) NOT NULL,
  niveau ENUM('Debutant', 'Intermediaire', 'Avance', 'Expert') NOT NULL DEFAULT 'Debutant',
  rarete_weight DECIMAL(4,2) DEFAULT 1,
  is_offer TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exchanges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposer_id INT NOT NULL,
  receiver_id INT NOT NULL,
  offered_skill_id INT NOT NULL,
  requested_skill_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
  learning_objective TEXT,
  estimated_duration_weeks INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exchange_proposer FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_exchange_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_exchange_offer_skill FOREIGN KEY (offered_skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  CONSTRAINT fk_exchange_request_skill FOREIGN KEY (requested_skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exchange_id INT NOT NULL,
  step_number INT NOT NULL DEFAULT 1,
  title VARCHAR(180) NOT NULL,
  session_date DATETIME NOT NULL,
  status ENUM('planned', 'done', 'cancelled') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_exchange FOREIGN KEY (exchange_id) REFERENCES exchanges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  badge VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
);
