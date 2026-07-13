const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// List all literature items
router.get('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const items = db.prepare('SELECT * FROM LiteratureItem WHERE project_id = ? ORDER BY year DESC, author ASC').all(project.id);
  res.render('literature/index', { items, msg: req.query.msg || null });
});

// New literature item form
router.get('/new', (req, res) => {
  res.render('literature/new');
});

// Create literature item
router.post('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const b = req.body;

  db.prepare(`
    INSERT INTO LiteratureItem (project_id, author, title, year, source_type, notes,
      prompt_presentation, prompt_relevance, prompt_objectivity, prompt_method, prompt_provenance, prompt_timeliness)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project.id, b.author || '', b.title, b.year || null, b.source_type || 'Other', b.notes || '',
    b.prompt_presentation || '', b.prompt_relevance || '', b.prompt_objectivity || '',
    b.prompt_method || '', b.prompt_provenance || '', b.prompt_timeliness || '');

  res.redirect('/literature?msg=Source added');
});

// Edit literature item form
router.get('/:id/edit', (req, res) => {
  const item = db.prepare('SELECT * FROM LiteratureItem WHERE id = ?').get(req.params.id);
  if (!item) return res.redirect('/literature');
  res.render('literature/edit', { item });
});

// Confirm delete page
router.get('/:id/delete', (req, res) => {
  const item = db.prepare('SELECT * FROM LiteratureItem WHERE id = ?').get(req.params.id);
  if (!item) return res.redirect('/literature');
  res.render('literature/delete', { item });
});

// Update literature item
router.post('/:id', (req, res) => {
  const b = req.body;

  db.prepare(`
    UPDATE LiteratureItem SET author = ?, title = ?, year = ?, source_type = ?, notes = ?,
      prompt_presentation = ?, prompt_relevance = ?, prompt_objectivity = ?,
      prompt_method = ?, prompt_provenance = ?, prompt_timeliness = ?
    WHERE id = ?
  `).run(b.author || '', b.title, b.year || null, b.source_type || 'Other', b.notes || '',
    b.prompt_presentation || '', b.prompt_relevance || '', b.prompt_objectivity || '',
    b.prompt_method || '', b.prompt_provenance || '', b.prompt_timeliness || '', req.params.id);

  res.redirect('/literature?msg=Source updated');
});

// Delete literature item
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM LiteratureItem WHERE id = ?').run(req.params.id);
  res.redirect('/literature?msg=Source deleted');
});

module.exports = router;
