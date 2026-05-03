const express = require('express');
const router = express.Router();
const db = require('../db/setup');

router.get('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  if (!project) return res.send('No project found');

  const taskCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM Task 
    WHERE project_id = ? GROUP BY status
  `).all(project.id);

  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM Task WHERE project_id = ?').get(project.id).count;

  const overdueRisks = db.prepare(`
    SELECT * FROM Risk WHERE project_id = ? AND review_date < date('now') AND status = 'Open'
  `).all(project.id);

  const recentTasks = db.prepare(`
    SELECT * FROM Task WHERE project_id = ? ORDER BY id DESC LIMIT 5
  `).all(project.id);

  const counts = { 'To Do': 0, 'In Progress': 0, 'Complete': 0 };
  taskCounts.forEach(r => { counts[r.status] = r.count; });

  res.render('dashboard', { project, counts, totalTasks, overdueRisks, recentTasks });
});

module.exports = router;
