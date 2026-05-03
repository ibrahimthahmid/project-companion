const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// List all tasks with optional phase/status filter
router.get('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const { phase, status } = req.query;
  
  let sql = 'SELECT * FROM Task WHERE project_id = ?';
  const params = [project.id];
  
  if (phase && phase !== 'All') {
    sql += ' AND phase = ?';
    params.push(phase);
  }
  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY id ASC';
  
  const tasks = db.prepare(sql).all(...params);
  const phases = db.prepare('SELECT DISTINCT phase FROM Task WHERE project_id = ?').all(project.id).map(r => r.phase);
  
  res.render('tasks/index', { tasks, phases, currentPhase: phase || 'All', currentStatus: status || 'All' });
});

// New task form
router.get('/new', (req, res) => {
  res.render('tasks/new');
});

// Create task
router.post('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const { title, phase, status, priority, planned_start, planned_duration } = req.body;
  
  db.prepare(`
    INSERT INTO Task (project_id, title, phase, status, priority, planned_start, planned_duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(project.id, title, phase, status || 'To Do', priority || 'Medium', planned_start || null, planned_duration || null);
  
  res.redirect('/tasks?msg=Task created');
});

// Edit task form
router.get('/:id/edit', (req, res) => {
  const task = db.prepare('SELECT * FROM Task WHERE id = ?').get(req.params.id);
  if (!task) return res.redirect('/tasks');
  res.render('tasks/edit', { task });
});

// Update task
router.post('/:id', (req, res) => {
  const { title, phase, status, priority, planned_start, planned_duration, actual_start, actual_duration } = req.body;
  
  db.prepare(`
    UPDATE Task SET title = ?, phase = ?, status = ?, priority = ?, 
    planned_start = ?, planned_duration = ?, actual_start = ?, actual_duration = ?
    WHERE id = ?
  `).run(title, phase, status, priority, planned_start || null, planned_duration || null, actual_start || null, actual_duration || null, req.params.id);
  
  res.redirect('/tasks?msg=Task updated');
});

// Delete task
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM Task WHERE id = ?').run(req.params.id);
  res.redirect('/tasks?msg=Task deleted');
});

module.exports = router;
