const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { status, user_id, book_id, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [], params = [], idx = 1;

    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (user_id) { conditions.push(`t.user_id = $${idx++}`); params.push(user_id); }
    if (book_id) { conditions.push(`t.book_id = $${idx++}`); params.push(book_id); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM transactions t ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await query(
      `SELECT t.*, b.title as book_title, b.isbn, b.rack_number,
              u.name as user_name, u.member_id, u.email as user_email
       FROM transactions t
       JOIN books b ON t.book_id = b.id
       JOIN library_users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({
      transactions: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/transactions/checkout - Issue a book
router.post('/checkout', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { book_id, user_id, notes, issued_by } = req.body;

    if (!book_id || !user_id) {
      return res.status(400).json({ error: 'book_id and user_id are required' });
    }

    // Check book availability
    const bookCheck = await client.query(
      'SELECT * FROM books WHERE id=$1 FOR UPDATE', [book_id]
    );
    if (!bookCheck.rows.length) return res.status(404).json({ error: 'Book not found' });
    
    const book = bookCheck.rows[0];
    if (book.available_quantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Book is not available for checkout' });
    }

    // Check user active books limit
    const userCheck = await client.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id=$1 AND status IN ('issued','overdue')`,
      [user_id]
    );
    const settings = await client.query('SELECT * FROM fine_settings LIMIT 1');
    const maxBooks = settings.rows[0]?.max_books_per_user || 5;
    
    if (parseInt(userCheck.rows[0].count) >= maxBooks) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `User has reached the maximum limit of ${maxBooks} books` });
    }

    // Get loan period
    const loanDays = settings.rows[0]?.loan_period_days || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);

    // Create transaction
    const txResult = await client.query(
      `INSERT INTO transactions (book_id, user_id, issue_date, due_date, status, notes, issued_by)
       VALUES ($1,$2,NOW(),$3,'issued',$4,$5) RETURNING *`,
      [book_id, user_id, dueDate, notes || null, issued_by || 'Librarian']
    );

    // Update book availability
    await client.query(
      `UPDATE books SET available_quantity = available_quantity - 1,
       status = CASE WHEN available_quantity - 1 = 0 THEN 'issued' ELSE 'available' END,
       updated_at = NOW() WHERE id = $1`,
      [book_id]
    );

    // Log activity
    const userInfo = await client.query('SELECT name, member_id FROM library_users WHERE id=$1', [user_id]);
    await client.query(
      `INSERT INTO activity_log (action_type, description, entity_type, entity_id, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      ['BOOK_ISSUED', `"${book.title}" issued to ${userInfo.rows[0].name} (${userInfo.rows[0].member_id})`,
       'transaction', txResult.rows[0].id, JSON.stringify({ book_id, user_id, due_date: dueDate })]
    );

    await client.query('COMMIT');
    res.status(201).json({ transaction: txResult.rows[0], due_date: dueDate });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Checkout failed' });
  } finally {
    client.release();
  }
});

// POST /api/transactions/return - Return a book
router.post('/return', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { transaction_id, returned_by } = req.body;

    if (!transaction_id) return res.status(400).json({ error: 'transaction_id is required' });

    const txCheck = await client.query(
      'SELECT * FROM transactions WHERE id=$1 FOR UPDATE', [transaction_id]
    );
    if (!txCheck.rows.length) return res.status(404).json({ error: 'Transaction not found' });
    
    const tx = txCheck.rows[0];
    if (tx.status === 'returned') return res.status(400).json({ error: 'Book already returned' });

    // Calculate fine
    const settings = await client.query('SELECT * FROM fine_settings LIMIT 1');
    const finePerDay = parseFloat(settings.rows[0]?.fine_per_day || 1.00);
    const now = new Date();
    const dueDate = new Date(tx.due_date);
    
    let fineAmount = 0;
    if (now > dueDate) {
      const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysLate * finePerDay;
    }

    // Update transaction
    const updatedTx = await client.query(
      `UPDATE transactions SET status='returned', return_date=NOW(), fine_amount=$1, returned_by=$2, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [fineAmount, returned_by || 'Librarian', transaction_id]
    );

    // Update book availability
    await client.query(
      `UPDATE books SET available_quantity = available_quantity + 1,
       status = 'available', updated_at = NOW() WHERE id = $1`,
      [tx.book_id]
    );

    // Log activity
    const bookInfo = await client.query('SELECT title FROM books WHERE id=$1', [tx.book_id]);
    const userInfo = await client.query('SELECT name, member_id FROM library_users WHERE id=$1', [tx.user_id]);
    await client.query(
      `INSERT INTO activity_log (action_type, description, entity_type, entity_id, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      ['BOOK_RETURNED',
       `"${bookInfo.rows[0].title}" returned by ${userInfo.rows[0].name}${fineAmount > 0 ? ` | Fine: $${fineAmount.toFixed(2)}` : ''}`,
       'transaction', transaction_id,
       JSON.stringify({ book_id: tx.book_id, fine_amount: fineAmount, days_late: fineAmount > 0 ? Math.ceil(fineAmount / finePerDay) : 0 })]
    );

    await client.query('COMMIT');
    res.json({ transaction: updatedTx.rows[0], fine_amount: fineAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Return failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
