const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { search, user_type } = req.query;
    let conditions = [], params = [], idx = 1;
    if (search) { conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR member_id ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (user_type) { conditions.push(`user_type = $${idx++}`); params.push(user_type); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT u.*, COUNT(t.id) FILTER (WHERE t.status IN ('issued','overdue')) as active_borrows
       FROM library_users u LEFT JOIN transactions t ON t.user_id = u.id
       ${where} GROUP BY u.id ORDER BY u.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch users' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await query('SELECT * FROM library_users WHERE id=$1', [req.params.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
    const transactions = await query(
      `SELECT t.*, b.title as book_title FROM transactions t JOIN books b ON t.book_id=b.id
       WHERE t.user_id=$1 ORDER BY t.created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json({ ...user.rows[0], transactions: transactions.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch user' }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, member_id, user_type, department } = req.body;
    if (!name || !member_id) return res.status(400).json({ error: 'Name and member_id are required' });
    const result = await query(
      'INSERT INTO library_users (name, email, phone, member_id, user_type, department) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, email, phone, member_id, user_type || 'student', department]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Member ID or email already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, user_type, department, active } = req.body;
    const result = await query(
      'UPDATE library_users SET name=$1,email=$2,phone=$3,user_type=$4,department=$5,active=$6,updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, email, phone, user_type, department, active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update user' }); }
});

module.exports = router;
