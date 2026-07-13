const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// Download all project data as a JSON file
router.get('/', (req, res) => {
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
