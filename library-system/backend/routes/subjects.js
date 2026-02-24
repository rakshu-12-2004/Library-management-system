const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query;
    let sql = `SELECT s.*, c.name as category_name, COUNT(b.id) as book_count FROM subjects s
               LEFT JOIN categories c ON s.category_id = c.id
               LEFT JOIN books b ON b.subject_id = s.id`;
    const params = [];
    if (category_id) { sql += ' WHERE s.category_id = $1'; params.push(category_id); }
    sql += ' GROUP BY s.id, c.name ORDER BY s.name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch subjects' }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, category_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await query(
      'INSERT INTO subjects (name, description, category_id) VALUES ($1,$2,$3) RETURNING *',
      [name, description, category_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create subject' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, category_id } = req.body;
    const result = await query(
      'UPDATE subjects SET name=$1, description=$2, category_id=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, description, category_id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Subject not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update subject' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('UPDATE books SET subject_id=NULL WHERE subject_id=$1', [req.params.id]);
    await query('DELETE FROM subjects WHERE id=$1', [req.params.id]);
    res.json({ message: 'Subject deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete subject' }); }
});

module.exports = router;
