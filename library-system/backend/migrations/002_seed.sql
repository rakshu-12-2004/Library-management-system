-- Seed Data for Digital Library Management System

-- Categories
INSERT INTO categories (id, name, description, color) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fiction', 'Novels, short stories, and creative literature', '#8B5CF6'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Science & Technology', 'Scientific research, technology, and computing', '#3B82F6'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'History & Politics', 'World history, political science, and governance', '#EF4444'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Arts & Humanities', 'Art, music, philosophy, and cultural studies', '#F59E0B'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Business & Economics', 'Business management, economics, and finance', '#10B981'),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Health & Medicine', 'Medical sciences, health, and wellness', '#EC4899'),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'Children & Young Adult', 'Books for children and young adults', '#F97316'),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'Reference', 'Encyclopedias, dictionaries, and reference works', '#6B7280')
ON CONFLICT DO NOTHING;

-- Subjects
INSERT INTO subjects (id, name, description, category_id) VALUES
  ('s1a2b3c4-d5e6-f789-0abc-def123456789', 'World Literature', 'Classic and modern world literature', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('s2b3c4d5-e6f7-a890-1bcd-ef2345678901', 'Mystery & Thriller', 'Crime fiction, mystery, and thrillers', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('s3c4d5e6-f7a8-b901-2cde-f34567890123', 'Computer Science', 'Programming, algorithms, and software', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('s4d5e6f7-a8b9-c012-3def-456789012345', 'Physics & Mathematics', 'Advanced physics and mathematics', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('s5e6f7a8-b9c0-d123-4efa-567890123456', 'Ancient History', 'Ancient civilizations and archaeology', 'c3d4e5f6-a7b8-9012-cdef-123456789012'),
  ('s6f7a8b9-c0d1-e234-5fab-678901234567', 'Modern History', 'Contemporary history and current affairs', 'c3d4e5f6-a7b8-9012-cdef-123456789012'),
  ('s7a8b9c0-d1e2-f345-6abc-789012345678', 'Philosophy', 'Classical and modern philosophy', 'd4e5f6a7-b8c9-0123-defa-234567890123'),
  ('s8b9c0d1-e2f3-a456-7bcd-890123456789', 'Marketing', 'Marketing strategies and consumer behavior', 'e5f6a7b8-c9d0-1234-efab-345678901234'),
  ('s9c0d1e2-f3a4-b567-8cde-901234567890', 'Entrepreneurship', 'Startup culture and business innovation', 'e5f6a7b8-c9d0-1234-efab-345678901234'),
  ('s0d1e2f3-a4b5-c678-9def-012345678901', 'Clinical Medicine', 'Medical practice and clinical procedures', 'f6a7b8c9-d0e1-2345-fabc-456789012345')
ON CONFLICT DO NOTHING;

-- Books
INSERT INTO books (title, author, isbn, category_id, subject_id, total_quantity, available_quantity, rack_number, publisher, published_year, description) VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 's1a2b3c4-d5e6-f789-0abc-def123456789', 3, 2, 'A-101', 'Scribner', 1925, 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.'),
  ('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 's1a2b3c4-d5e6-f789-0abc-def123456789', 4, 3, 'A-102', 'HarperCollins', 1960, 'A classic of American literature dealing with racial injustice and moral growth.'),
  ('1984', 'George Orwell', '978-0-452-28423-4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 's2b3c4d5-e6f7-a890-1bcd-ef2345678901', 5, 4, 'A-103', 'Signet Classic', 1949, 'A dystopian novel about a totalitarian society and the struggle against it.'),
  ('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 's3c4d5e6-f7a8-b901-2cde-f34567890123', 6, 5, 'B-201', 'Prentice Hall', 2008, 'A handbook of agile software craftsmanship with practical programming advice.'),
  ('The Pragmatic Programmer', 'David Thomas, Andrew Hunt', '978-0-13-595705-9', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 's3c4d5e6-f7a8-b901-2cde-f34567890123', 4, 3, 'B-202', 'Addison-Wesley', 2019, 'A guide to pragmatic programming practices and career advice for developers.'),
  ('A Brief History of Time', 'Stephen Hawking', '978-0-553-38016-3', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 's4d5e6f7-a8b9-c012-3def-456789012345', 3, 3, 'B-301', 'Bantam', 1988, 'An overview of cosmology for general readers by one of the greatest scientists.'),
  ('Sapiens', 'Yuval Noah Harari', '978-0-06-231609-7', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 's6f7a8b9-c0d1-e234-5fab-678901234567', 5, 2, 'C-101', 'HarperCollins', 2011, 'A brief history of humankind, exploring how Homo sapiens came to dominate the earth.'),
  ('The Art of War', 'Sun Tzu', '978-1-59030-225-5', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 's5e6f7a8-b9c0-d123-4efa-567890123456', 4, 4, 'C-201', 'Shambhala', 500, 'An ancient Chinese military treatise dating from the Spring and Autumn period.'),
  ('Think and Grow Rich', 'Napoleon Hill', '978-1-58542-433-7', 'e5f6a7b8-c9d0-1234-efab-345678901234', 's9c0d1e2-f3a4-b567-8cde-901234567890', 3, 1, 'E-101', 'TarcherPerigee', 1937, 'A classic personal development book teaching principles for success and wealth.'),
  ('The Da Vinci Code', 'Dan Brown', '978-0-385-50420-5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 's2b3c4d5-e6f7-a890-1bcd-ef2345678901', 6, 5, 'A-201', 'Doubleday', 2003, 'A mystery thriller involving a Harvard professor and a Louvre murder mystery.'),
  ('JavaScript: The Good Parts', 'Douglas Crockford', '978-0-596-51774-8', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 's3c4d5e6-f7a8-b901-2cde-f34567890123', 5, 4, 'B-203', 'O''Reilly Media', 2008, 'Explores the best features of JavaScript and guides building reliable applications.'),
  ('Thinking, Fast and Slow', 'Daniel Kahneman', 'b2c3d4e5-f6a7-8901-bcde-f1234', 'd4e5f6a7-b8c9-0123-defa-234567890123', 's7a8b9c0-d1e2-f345-6abc-789012345678', 4, 3, 'D-101', 'Farrar Straus Giroux', 2011, 'A seminal examination of the two systems of thought that drive human decision-making.')
ON CONFLICT DO NOTHING;

-- Library Users
INSERT INTO library_users (name, email, phone, member_id, user_type, department) VALUES
  ('Alice Johnson', 'alice.j@library.edu', '555-0101', 'MEM-001', 'student', 'Computer Science'),
  ('Bob Smith', 'bob.s@library.edu', '555-0102', 'MEM-002', 'student', 'Literature'),
  ('Carol White', 'carol.w@library.edu', '555-0103', 'MEM-003', 'faculty', 'History'),
  ('David Brown', 'david.b@library.edu', '555-0104', 'MEM-004', 'student', 'Physics'),
  ('Emma Davis', 'emma.d@library.edu', '555-0105', 'MEM-005', 'staff', 'Administration'),
  ('Frank Wilson', 'frank.w@library.edu', '555-0106', 'MEM-006', 'student', 'Business'),
  ('Grace Lee', 'grace.l@library.edu', '555-0107', 'MEM-007', 'faculty', 'Philosophy'),
  ('Henry Taylor', 'henry.t@library.edu', '555-0108', 'MEM-008', 'student', 'Medicine')
ON CONFLICT DO NOTHING;

-- Librarian Notes
INSERT INTO librarian_notes (title, content, priority, tags, pinned) VALUES
  ('Quarterly Audit Reminder', 'Conduct physical inventory count this Friday. Check all rack numbers and update quantities.', 'high', ARRAY['audit', 'inventory'], true),
  ('New Book Arrivals', '15 new Computer Science books arriving next week. Prepare rack B-204 for placement.', 'normal', ARRAY['arrivals', 'cs'], false),
  ('Overdue Follow-up', 'Send reminder emails to all users with books overdue more than 7 days.', 'urgent', ARRAY['overdue', 'reminders'], true),
  ('Reading Club Schedule', 'Next reading club meeting on the 15th. Current book: Sapiens by Yuval Harari.', 'low', ARRAY['events', 'reading-club'], false),
  ('System Maintenance', 'Library system will be down for maintenance on Sunday 2-4 AM. Inform staff.', 'normal', ARRAY['maintenance', 'system'], false)
ON CONFLICT DO NOTHING;
