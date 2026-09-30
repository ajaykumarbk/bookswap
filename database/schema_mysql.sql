-- MySQL 8.0 / OCI HeatWave Database Schema for BookSwap
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  profile_image TEXT,
  bio TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  location_visibility VARCHAR(50) DEFAULT 'approximate',
  email_verified TINYINT DEFAULT 1,
  phone_verified TINYINT DEFAULT 0,
  rating DOUBLE DEFAULT 5.0,
  completed_swaps INT DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user',
  is_suspended TINYINT DEFAULT 0,
  interested_genres JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  isbn VARCHAR(50),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255),
  edition VARCHAR(100),
  publication_year INT,
  description TEXT,
  genre VARCHAR(100) NOT NULL,
  language VARCHAR(50) DEFAULT 'English',
  `condition` VARCHAR(50) NOT NULL,
  cover_image TEXT,
  status VARCHAR(50) DEFAULT 'Available',
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  views INT DEFAULT 0,
  swap_requests_count INT DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wishlist (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  book_title VARCHAR(500) NOT NULL,
  author VARCHAR(255),
  isbn VARCHAR(50),
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS swap_requests (
  id VARCHAR(64) PRIMARY KEY,
  requester_id VARCHAR(64) NOT NULL,
  owner_id VARCHAR(64) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  message TEXT,
  counter_offered_by VARCHAR(64),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  expires_at DATETIME,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS swap_items (
  id VARCHAR(64) PRIMARY KEY,
  swap_request_id VARCHAR(64) NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  sender_id VARCHAR(64) NOT NULL,
  receiver_id VARCHAR(64) NOT NULL,
  swap_request_id VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at DATETIME NOT NULL,
  read_at DATETIME,
  FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meetups (
  id VARCHAR(64) PRIMARY KEY,
  swap_request_id VARCHAR(64) UNIQUE NOT NULL,
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  notes TEXT,
  user_a_confirmed TINYINT DEFAULT 0,
  user_b_confirmed TINYINT DEFAULT 0,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  swap_request_id VARCHAR(64) NOT NULL,
  reviewer_id VARCHAR(64) NOT NULL,
  reviewee_id VARCHAR(64) NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  tags JSON,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id VARCHAR(64),
  is_read TINYINT DEFAULT 0,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  reporter_id VARCHAR(64) NOT NULL,
  reported_user_id VARCHAR(64),
  reported_book_id VARCHAR(64),
  reason VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at DATETIME NOT NULL,
  resolved_at DATETIME,
  FOREIGN KEY (reporter_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_blocks (
  id VARCHAR(64) PRIMARY KEY,
  blocker_id VARCHAR(64) NOT NULL,
  blocked_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY (blocker_id, blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
