const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { body, query: queryParam, validationResult } = require('express-validator');

// GET /api/books - List books with pagination, search, filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 10, search = '', category_id, subject_id, status
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(b.title ILIKE $${idx} OR b.author ILIKE $${idx} OR b.isbn ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (category_id) { conditions.push(`b.category_id = $${idx++}`); params.push(category_id); }
    if (subject_id) { conditions.push(`b.subject_id = $${idx++}`); params.push(subject_id); }
    if (status) { conditions.push(`b.status = $${idx++}`); params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM books b ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const booksResult = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color, 
              s.name as subject_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN subjects s ON b.subject_id = s.id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({
      books: booksResult.rows,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, c.name as category_name, s.name as subject_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN subjects s ON b.subject_id = s.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Book not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// POST /api/books
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('total_quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, author, isbn, category_id, subject_id, total_quantity, rack_number, publisher, published_year, description } = req.body;
      const result = await query(
        `INSERT INTO books (title, author, isbn, category_id, subject_id, total_quantity, available_quantity, rack_number, publisher, published_year, description)
         VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10) RETURNING *`,
        [title, author, isbn || null, category_id || null, subject_id || null, total_quantity, rack_number || null, publisher || null, published_year || null, description || null]
      );
      
      // Log activity
      await query(
        `INSERT INTO activity_log (action_type, description, entity_type, entity_id) VALUES ($1,$2,$3,$4)`,
        ['BOOK_ADDED', `New book added: ${title} by ${author}`, 'book', result.rows[0].id]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ error: 'ISBN already exists' });
      res.status(500).json({ error: 'Failed to create book' });
    }
  }
);

// PUT /api/books/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, author, isbn, category_id, subject_id, total_quantity, rack_number, publisher, published_year, description } = req.body;
    const result = await query(
      `UPDATE books SET title=$1, author=$2, isbn=$3, category_id=$4, subject_id=$5,
       total_quantity=$6, rack_number=$7, publisher=$8, published_year=$9, description=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, author, isbn, category_id, subject_id, total_quantity, rack_number, publisher, published_year, description, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Book not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  try {
    const active = await query(
      `SELECT COUNT(*) FROM transactions WHERE book_id=$1 AND status IN ('issued','overdue')`,
      [req.params.id]
    );
    if (parseInt(active.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active transactions' });
    }
    await query('DELETE FROM books WHERE id=$1', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

module.exports = router;
