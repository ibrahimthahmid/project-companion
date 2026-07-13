const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// List all log entries, most recent week first
router.get('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const entries = db.prepare('SELECT * FROM LogEntry WHERE project_id = ? ORDER BY week_number DESC').all(project.id);
  res.render('logs/index', { entries, msg: req.query.msg || null });
});

// New log entry form
router.get('/new', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const last = db.prepare('SELECT MAX(week_number) AS w FROM LogEntry WHERE project_id = ?').get(project.id);
  const nextWeek = (last.w || 0) + 1;
  res.render('logs/new', { nextWeek });
});

// Create log entry
router.post('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const b = req.body;

  db.prepare(`
    INSERT INTO LogEntry (project_id, week_number, entry_date, what_done, what_well, what_poorly, planned_next)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(project.id, b.week_number || null, b.entry_date || null,
    b.what_done || '', b.what_well || '', b.what_poorly || '', b.planned_next || '');

  res.redirect('/logs?msg=Log entry added');
});

// Edit log entry form
router.get('/:id/edit', (req, res) => {
  const entry = db.prepare('SELECT * FROM LogEntry WHERE id = ?').get(req.params.id);
  if (!entry) return res.redirect('/logs');
  res.render('logs/edit', { entry });
});

// Confirm delete page
router.get('/:id/delete', (req, res) => {
  const entry = db.prepare('SELECT * FROM LogEntry WHERE id = ?').get(req.params.id);
  if (!entry) return res.redirect('/logs');
  res.render('logs/delete', { entry });
});

// Update log entry
router.post('/:id', (req, res) => {
  const b = req.body;

  db.prepare(`
    UPDATE LogEntry SET week_number = ?, entry_date = ?, what_done = ?, what_well = ?, what_poorly = ?, planned_next = ?
    WHERE id = ?
  `).run(b.week_number || null, b.entry_date || null,
    b.what_done || '', b.what_well || '', b.what_poorly || '', b.planned_next || '', req.params.id);

  res.redirect('/logs?msg=Log entry updated');
});

// Delete log entry
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM LogEntry WHERE id = ?').run(req.params.id);
  res.redirect('/logs?msg=Log entry deleted');
});

module.exports = router;
