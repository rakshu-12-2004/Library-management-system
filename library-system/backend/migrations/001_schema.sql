-- Digital Library Management System Schema
-- Run this file to set up the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  rack_number VARCHAR(20),
  publisher VARCHAR(255),
  published_year INTEGER,
  description TEXT,
  cover_image_url TEXT,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'issued', 'overdue', 'lost')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Library users (borrowers)
CREATE TABLE IF NOT EXISTS library_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  member_id VARCHAR(50) UNIQUE NOT NULL,
  user_type VARCHAR(20) DEFAULT 'student' CHECK (user_type IN ('student', 'faculty', 'staff', 'public')),
  department VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions (check-out / check-in)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES library_users(id) ON DELETE CASCADE,
  issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL,
  return_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue')),
  fine_amount DECIMAL(10, 2) DEFAULT 0.00,
  fine_paid BOOLEAN DEFAULT FALSE,
  issued_by VARCHAR(255),
  returned_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Librarian notes
CREATE TABLE IF NOT EXISTS librarian_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[],
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fine settings
CREATE TABLE IF NOT EXISTS fine_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fine_per_day DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  loan_period_days INTEGER NOT NULL DEFAULT 14,
  max_books_per_user INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_subject ON books(subject_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_transactions_book ON transactions(book_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Default fine settings
INSERT INTO fine_settings (fine_per_day, loan_period_days, max_books_per_user) 
VALUES (1.00, 14, 5) ON CONFLICT DO NOTHING;

-- Trigger to update book status automatically
CREATE OR REPLACE FUNCTION update_book_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'returned' THEN
    UPDATE books 
    SET available_quantity = available_quantity + 1,
        status = CASE WHEN available_quantity + 1 > 0 THEN 'available' ELSE status END
    WHERE id = NEW.book_id;
  ELSIF NEW.status = 'issued' AND OLD.status IS NULL THEN
    UPDATE books 
    SET available_quantity = available_quantity - 1,
        status = CASE WHEN available_quantity - 1 = 0 THEN 'issued' ELSE 'available' END
    WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_status_change
AFTER INSERT OR UPDATE OF status ON transactions
FOR EACH ROW EXECUTE FUNCTION update_book_status();

-- Trigger to mark overdue transactions
CREATE OR REPLACE FUNCTION mark_overdue_transactions()
RETURNS void AS $$
BEGIN
  UPDATE transactions 
  SET status = 'overdue',
      fine_amount = EXTRACT(EPOCH FROM (NOW() - due_date)) / 86400 * 
        (SELECT fine_per_day FROM fine_settings LIMIT 1)
  WHERE status = 'issued' AND due_date < NOW();
  
  UPDATE books SET status = 'overdue'
  WHERE id IN (
    SELECT DISTINCT book_id FROM transactions WHERE status = 'overdue'
  );
END;
$$ LANGUAGE plpgsql;
