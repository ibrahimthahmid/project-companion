const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// Confirmation page stating what the export will contain
router.get('/', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const counts = {
    tasks: db.prepare('SELECT COUNT(*) AS n FROM Task WHERE project_id = ?').get(project.id).n,
    risks: db.prepare('SELECT COUNT(*) AS n FROM Risk WHERE project_id = ?').get(project.id).n,
    links: db.prepare('SELECT COUNT(*) AS n FROM RiskTask').get().n,
    literature: db.prepare('SELECT COUNT(*) AS n FROM LiteratureItem WHERE project_id = ?').get(project.id).n,
    logs: db.prepare('SELECT COUNT(*) AS n FROM LogEntry WHERE project_id = ?').get(project.id).n
  };
  res.render('export', { counts: counts });
});

// Download all project data as a JSON file
router.get('/download', (req, res) => {
  const project = db.prepare('SELECT * FROM Project LIMIT 1').get();
  const data = {
    exported_at: new Date().toISOString(),
    project: project,
    tasks: db.prepare('SELECT * FROM Task WHERE project_id = ?').all(project.id),
    risks: db.prepare('SELECT * FROM Risk WHERE project_id = ?').all(project.id),
    risk_task_links: db.prepare('SELECT * FROM RiskTask').all(),
    literature: db.prepare('SELECT * FROM LiteratureItem WHERE project_id = ?').all(project.id),
    log_entries: db.prepare('SELECT * FROM LogEntry WHERE project_id = ?').all(project.id)
  };
  res.setHeader('Content-Disposition', 'attachment; filename="project-companion-export.json"');
  res.json(data);
});

module.exports = router;
