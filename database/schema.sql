-- BookSwap PostgreSQL + PostGIS Production Schema
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  profile_image VARCHAR(1000),
  bio TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326),
  location_visibility VARCHAR(50) DEFAULT 'approximate',
  email_verified INTEGER DEFAULT 1,
  phone_verified INTEGER DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 5.0,
  completed_swaps INTEGER DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user',
  is_suspended INTEGER DEFAULT 0,
  interested_genres JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  isbn VARCHAR(50),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255),
  edition VARCHAR(100),
  publication_year INTEGER,
  description TEXT,
  genre VARCHAR(100) NOT NULL,
  language VARCHAR(50) DEFAULT 'English',
  condition VARCHAR(50) NOT NULL,
  cover_image VARCHAR(1000),
  status VARCHAR(50) DEFAULT 'Available',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326),
  views INTEGER DEFAULT 0,
  swap_requests_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  book_title VARCHAR(500) NOT NULL,
  author VARCHAR(255),
  isbn VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS swap_requests (
  id VARCHAR(64) PRIMARY KEY,
  requester_id VARCHAR(64) REFERENCES users(id),
  owner_id VARCHAR(64) REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'PENDING',
  message TEXT,
  counter_offered_by VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS swap_items (
  id VARCHAR(64) PRIMARY KEY,
  swap_request_id VARCHAR(64) REFERENCES swap_requests(id) ON DELETE CASCADE,
  book_id VARCHAR(64) REFERENCES books(id),
  user_id VARCHAR(64) REFERENCES users(id),
  direction VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  sender_id VARCHAR(64) REFERENCES users(id),
  receiver_id VARCHAR(64) REFERENCES users(id),
  swap_request_id VARCHAR(64) REFERENCES swap_requests(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_url VARCHAR(1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS meetups (
  id VARCHAR(64) PRIMARY KEY,
  swap_request_id VARCHAR(64) UNIQUE REFERENCES swap_requests(id) ON DELETE CASCADE,
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  user_a_confirmed INTEGER DEFAULT 0,
  user_b_confirmed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  swap_request_id VARCHAR(64) REFERENCES swap_requests(id),
  reviewer_id VARCHAR(64) REFERENCES users(id),
  reviewee_id VARCHAR(64) REFERENCES users(id),
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id VARCHAR(64),
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  reporter_id VARCHAR(64) REFERENCES users(id),
  reported_user_id VARCHAR(64) REFERENCES users(id),
  reported_book_id VARCHAR(64) REFERENCES books(id),
  reason VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial PostGIS Index
CREATE INDEX IF NOT EXISTS idx_books_location ON books USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);
