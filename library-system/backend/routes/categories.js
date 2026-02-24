// categories.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, COUNT(b.id) as book_count FROM categories c
       LEFT JOIN books b ON b.category_id = c.id
       GROUP BY c.id ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch categories' }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await query(
      'INSERT INTO categories (name, description, color) VALUES ($1,$2,$3) RETURNING *',
      [name, description, color || '#3B82F6']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Category already exists' });
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const result = await query(
      'UPDATE categories SET name=$1, description=$2, color=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, description, color, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update category' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('UPDATE books SET category_id=NULL WHERE category_id=$1', [req.params.id]);
    await query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete category' }); }
});

module.exports = router;
