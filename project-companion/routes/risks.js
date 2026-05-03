const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// List all risks
router.get('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const risks = db.prepare('SELECT * FROM Risk WHERE project_id = ? ORDER BY id ASC').all(project.id);
  res.render('risks/index', { risks });
});

// New risk form
router.get('/new', (req, res) => {
  res.render('risks/new');
});

// Create risk
router.post('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const { description, likelihood, impact, mitigation, review_date } = req.body;
  
  db.prepare(`
    INSERT INTO Risk (project_id, description, likelihood, impact, mitigation, review_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(project.id, description, likelihood || 'Medium', impact || 'Medium', mitigation || '', review_date || null);
  
  res.redirect('/risks?msg=Risk created');
});

module.exports = router;
