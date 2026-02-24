const express = require('express');
const notesRouter = express.Router();
const dashRouter = express.Router();
const settingsRouter = express.Router();
const { query } = require('../config/database');

// Notes
notesRouter.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM librarian_notes ORDER BY pinned DESC, updated_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch notes' }); }
});
notesRouter.post('/', async (req, res) => {
  try {
    const { title, content, priority, tags, pinned } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
    const result = await query(
      'INSERT INTO librarian_notes (title, content, priority, tags, pinned) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, content, priority || 'normal', tags || [], pinned || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create note' }); }
});
notesRouter.put('/:id', async (req, res) => {
  try {
    const { title, content, priority, tags, pinned } = req.body;
    const result = await query(
      'UPDATE librarian_notes SET title=$1,content=$2,priority=$3,tags=$4,pinned=$5,updated_at=NOW() WHERE id=$6 RETURNING *',
      [title, content, priority, tags, pinned, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Note not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update note' }); }
});
notesRouter.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM librarian_notes WHERE id=$1', [req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete note' }); }
});

// Dashboard
dashRouter.get('/', async (req, res) => {
  try {
    const [totalBooks, issuedBooks, overdueBooks, availableBooks, totalUsers, recentActivity, topBooks] = await Promise.all([
      query('SELECT COUNT(*) as count, SUM(total_quantity) as total_copies FROM books'),
      query("SELECT COUNT(*) as count FROM transactions WHERE status = 'issued'"),
      query("SELECT COUNT(*) as count FROM transactions WHERE status = 'overdue'"),
      query('SELECT SUM(available_quantity) as count FROM books'),
      query("SELECT COUNT(*) as count FROM library_users WHERE active = true"),
      query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 15'),
      query(`SELECT b.title, b.author, COUNT(t.id) as borrow_count
             FROM books b LEFT JOIN transactions t ON t.book_id = b.id
             GROUP BY b.id ORDER BY borrow_count DESC LIMIT 5`),
    ]);

    res.json({
      stats: {
        totalBooks: parseInt(totalBooks.rows[0].count),
        totalCopies: parseInt(totalBooks.rows[0].total_copies) || 0,
        issuedBooks: parseInt(issuedBooks.rows[0].count),
        overdueBooks: parseInt(overdueBooks.rows[0].count),
        availableBooks: parseInt(availableBooks.rows[0].count) || 0,
        totalUsers: parseInt(totalUsers.rows[0].count),
      },
      recentActivity: recentActivity.rows,
      topBooks: topBooks.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Settings
settingsRouter.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM fine_settings LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (err) { res.status(500).json({ error: 'Failed to fetch settings' }); }
});
settingsRouter.put('/', async (req, res) => {
  try {
    const { fine_per_day, loan_period_days, max_books_per_user } = req.body;
    const result = await query(
      'UPDATE fine_settings SET fine_per_day=$1, loan_period_days=$2, max_books_per_user=$3, updated_at=NOW() RETURNING *',
      [fine_per_day, loan_period_days, max_books_per_user]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update settings' }); }
});

module.exports = { notesRouter, dashRouter, settingsRouter };
