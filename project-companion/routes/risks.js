const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// List all risks
router.get('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const risks = db.prepare(`
    SELECT Risk.*,
      (SELECT COUNT(*) FROM RiskTask WHERE RiskTask.risk_id = Risk.id AND relation_type = 'Mitigation') AS mitigation_count
    FROM Risk WHERE project_id = ? ORDER BY id ASC
  `).all(project.id);
  res.render('risks/index', { risks, msg: req.query.msg || null });
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

// Edit risk form with linked tasks
router.get('/:id/edit', (req, res) => {
  const risk = db.prepare('SELECT * FROM Risk WHERE id = ?').get(req.params.id);
  if (!risk) return res.redirect('/risks');

  const links = db.prepare(`
    SELECT RiskTask.task_id, RiskTask.relation_type, Task.title
    FROM RiskTask JOIN Task ON Task.id = RiskTask.task_id
    WHERE RiskTask.risk_id = ? ORDER BY RiskTask.relation_type, Task.title
  `).all(risk.id);

  const availableTasks = db.prepare(`
    SELECT * FROM Task
    WHERE id NOT IN (SELECT task_id FROM RiskTask WHERE risk_id = ?)
    ORDER BY title
  `).all(risk.id);

  res.render('risks/edit', { risk, links, availableTasks, msg: req.query.msg || null });
});

// Confirm delete page
router.get('/:id/delete', (req, res) => {
  const risk = db.prepare('SELECT * FROM Risk WHERE id = ?').get(req.params.id);
  if (!risk) return res.redirect('/risks');
  res.render('risks/delete', { risk });
});

// Update risk
router.post('/:id', (req, res) => {
  const { description, likelihood, impact, mitigation, review_date, status } = req.body;

  db.prepare(`
    UPDATE Risk SET description = ?, likelihood = ?, impact = ?, mitigation = ?, review_date = ?, status = ?
    WHERE id = ?
  `).run(description, likelihood, impact, mitigation || '', review_date || null, status || 'Open', req.params.id);

  res.redirect('/risks?msg=Risk updated');
});

// Delete risk
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM RiskTask WHERE risk_id = ?').run(req.params.id);
  db.prepare('DELETE FROM Risk WHERE id = ?').run(req.params.id);
  res.redirect('/risks?msg=Risk deleted');
});

// Link a task to this risk
router.post('/:id/links', (req, res) => {
  const { task_id, relation_type } = req.body;
  if (task_id) {
    db.prepare('INSERT OR IGNORE INTO RiskTask (risk_id, task_id, relation_type) VALUES (?, ?, ?)')
      .run(req.params.id, task_id, relation_type || 'Affected');
  }
  res.redirect('/risks/' + req.params.id + '/edit?msg=Task linked');
});

// Remove a task link from this risk
router.post('/:id/links/:taskId/delete', (req, res) => {
  db.prepare('DELETE FROM RiskTask WHERE risk_id = ? AND task_id = ?').run(req.params.id, req.params.taskId);
  res.redirect('/risks/' + req.params.id + '/edit?msg=Link removed');
});

module.exports = router;
