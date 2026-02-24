# 📚 Libraria — Digital Library Management System

A complete, production-ready Library Management System built with React, Node.js/Express, and PostgreSQL.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 📁 Category Management | Create, edit, delete categories with color coding |
| 📚 Subject Classification | Books organized by subjects linked to categories |
| 📖 Book Catalog | Full CRUD with ISBN, rack number, quantity tracking |
| 🔄 Checkout System | Issue books to members with due date tracking |
| 🔁 Return System | Process returns with automatic fine calculation |
| 💰 Fine Calculator | Auto-calculate fines based on configurable daily rate |
| 🔍 Search & Filters | Real-time search across all fields + multi-filter |
| 📊 Dashboard | Stats, recent activity, overdue tracking |
| 📝 Librarian Notes | Personal notepad with priorities, tags, pinning |
| 👥 Member Management | Register and manage library members |
| ⚙️ Settings | Configure fine rate, loan period, max books |

---

## 🗂️ Project Structure

```
library-system/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── routes/
│   │   ├── books.js             # Books CRUD + search/filter
│   │   ├── categories.js        # Category management
│   │   ├── subjects.js          # Subject management
│   │   ├── users.js             # Library member management
│   │   ├── transactions.js      # Checkout / return (with fine calc)
│   │   ├── notes.js             # Librarian notes CRUD
│   │   ├── dashboard.js         # Dashboard stats
│   │   └── settings.js          # Fine settings
│   ├── migrations/
│   │   ├── 001_schema.sql       # Full database schema
│   │   └── 002_seed.sql         # Sample data
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Express app entry point
│
└── frontend/
    └── library-system.html      # Complete React SPA (standalone)
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE library_management;"

# Run schema migrations
psql -U postgres -d library_management -f backend/migrations/001_schema.sql

# Load sample data
psql -U postgres -d library_management -f backend/migrations/002_seed.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials

# Start server
npm run dev        # Development (with nodemon)
npm start          # Production
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

The frontend is provided as a self-contained HTML file with React + CDN dependencies.

**Option A: Open directly**
```bash
open library-system.html
```
(Uses built-in mock data — works without a backend)

**Option B: Connect to real backend**
In the HTML file, update the `API_BASE` constant:
```js
const API_BASE = 'http://localhost:5000/api';
```
Then replace the mock data functions with real `fetch()` calls.

**Option C: Full React app**
```bash
npx create-react-app library-frontend
cd library-frontend
# Copy components from the HTML into /src
npm start
```

---

## 📡 API Documentation

### Books
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/books` | List books (pagination, search, filters) |
| GET | `/api/books/:id` | Get single book |
| POST | `/api/books` | Create book |
| PUT | `/api/books/:id` | Update book |
| DELETE | `/api/books/:id` | Delete book |

**Query params:** `page`, `limit`, `search`, `category_id`, `subject_id`, `status`

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | All categories with book counts |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Subjects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/subjects` | All subjects (filter by `category_id`) |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete subject |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions/checkout` | Issue a book |
| POST | `/api/transactions/return` | Return a book + calculate fine |

**Checkout body:**
```json
{ "book_id": "uuid", "user_id": "uuid", "issued_by": "Librarian" }
```

**Return body:**
```json
{ "transaction_id": "uuid", "returned_by": "Librarian" }
```

**Return response:**
```json
{ "transaction": {...}, "fine_amount": 8.00 }
```

### Members
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List members |
| GET | `/api/users/:id` | Member with transaction history |
| POST | `/api/users` | Register member |
| PUT | `/api/users/:id` | Update member |

### Librarian Notes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes` | All notes (pinned first) |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Stats + recent activity + top books |

### Settings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/settings` | Get fine settings |
| PUT | `/api/settings` | Update fine settings |

---

## 🗃️ Database Schema

```
categories     → id, name, description, color
subjects       → id, name, description, category_id (FK)
books          → id, title, author, isbn, category_id, subject_id, 
                  total_quantity, available_quantity, rack_number, status
library_users  → id, name, email, phone, member_id, user_type, department
transactions   → id, book_id, user_id, issue_date, due_date, return_date,
                  status, fine_amount, fine_paid
librarian_notes→ id, title, content, priority, tags[], pinned
activity_log   → id, action_type, description, entity_type, entity_id, metadata
fine_settings  → id, fine_per_day, loan_period_days, max_books_per_user
```

---

## 💡 Fine Calculation Logic

```
Fine = Days Late × Fine Per Day Rate

Days Late = ceil((return_date - due_date) / milliseconds_per_day)
```

Example: Book due Jan 1, returned Jan 9, at $1.00/day = **$8.00 fine**

Fine is calculated on:
- Return (exact days late)
- Overdue display (projected fine as of today)

---

## 🎨 Design System

- **Font**: Playfair Display (headings) + DM Sans (body)
- **Palette**: Warm ink/paper tones with gold accents
- **Theme**: Refined editorial / luxury library aesthetic
- **Components**: Cards, modals, tables, badges, toasts, pagination

---

## 📱 Responsive Breakpoints

- Desktop: Full sidebar + content
- Tablet: 2-column stats grid
- Mobile: Collapsed sidebar, single column forms

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind-inspired CSS |
| Backend | Node.js 18, Express 4 |
| Database | PostgreSQL 14 |
| Auth | Ready for JWT integration |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
