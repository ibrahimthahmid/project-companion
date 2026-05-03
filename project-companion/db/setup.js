const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'project.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS Project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS Task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    phase TEXT,
    status TEXT DEFAULT 'To Do',
    priority TEXT DEFAULT 'Medium',
    planned_start TEXT,
    planned_duration INTEGER,
    actual_start TEXT,
    actual_duration INTEGER,
    FOREIGN KEY (project_id) REFERENCES Project(id)
  );

  CREATE TABLE IF NOT EXISTS Risk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    likelihood TEXT DEFAULT 'Medium',
    impact TEXT DEFAULT 'Medium',
    mitigation TEXT,
    review_date TEXT,
    status TEXT DEFAULT 'Open',
    FOREIGN KEY (project_id) REFERENCES Project(id)
  );

  CREATE TABLE IF NOT EXISTS LiteratureItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    author TEXT,
    title TEXT NOT NULL,
    year INTEGER,
    source_type TEXT,
    notes TEXT,
    prompt_notes TEXT,
    FOREIGN KEY (project_id) REFERENCES Project(id)
  );

  CREATE TABLE IF NOT EXISTS LogEntry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    week_number INTEGER,
    entry_date TEXT,
    what_done TEXT,
    what_well TEXT,
    what_poorly TEXT,
    planned_next TEXT,
    FOREIGN KEY (project_id) REFERENCES Project(id)
  );

  CREATE TABLE IF NOT EXISTS RiskTask (
    risk_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    PRIMARY KEY (risk_id, task_id),
    FOREIGN KEY (risk_id) REFERENCES Risk(id),
    FOREIGN KEY (task_id) REFERENCES Task(id)
  );
`);

// Seed data if empty
const count = db.prepare('SELECT COUNT(*) as c FROM Project').get().c;
if (count === 0) {
  const insertProject = db.prepare('INSERT INTO Project (title, description) VALUES (?, ?)');
  const proj = insertProject.run('Remote Work Productivity Study', 'Investigating the impact of remote working on team productivity in UK SMEs');

  const insertTask = db.prepare('INSERT INTO Task (project_id, title, phase, status, priority, planned_start, planned_duration, actual_start, actual_duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  // Completed tasks
  insertTask.run(proj.lastInsertRowid, 'Draft research questions', 'Planning', 'Complete', 'High', '2026-02-10', 5, '2026-02-10', 4);
  insertTask.run(proj.lastInsertRowid, 'Complete literature review', 'Planning', 'Complete', 'High', '2026-02-17', 10, '2026-02-17', 12);
  insertTask.run(proj.lastInsertRowid, 'Design interview schedule', 'Planning', 'Complete', 'High', '2026-03-03', 5, '2026-03-03', 5);
  insertTask.run(proj.lastInsertRowid, 'Recruit interview participants', 'Data collection', 'Complete', 'High', '2026-03-10', 7, '2026-03-10', 9);
  insertTask.run(proj.lastInsertRowid, 'Conduct interviews batch 1', 'Data collection', 'Complete', 'Medium', '2026-03-24', 7, '2026-03-25', 7);
  insertTask.run(proj.lastInsertRowid, 'Transcribe interview recordings', 'Data collection', 'Complete', 'Medium', '2026-04-01', 5, '2026-04-01', 6);
  insertTask.run(proj.lastInsertRowid, 'Conduct interviews batch 2', 'Data collection', 'Complete', 'Medium', '2026-04-07', 7, '2026-04-08', 7);

  // In Progress
  insertTask.run(proj.lastInsertRowid, 'Begin thematic analysis', 'Analysis', 'In Progress', 'High', '2026-04-14', 10, '2026-04-15', null);
  insertTask.run(proj.lastInsertRowid, 'Code interview transcripts', 'Analysis', 'In Progress', 'High', '2026-04-14', 7, '2026-04-16', null);

  // To Do
  insertTask.run(proj.lastInsertRowid, 'Write methodology chapter', 'Writing', 'To Do', 'High', '2026-05-05', 10, null, null);
  insertTask.run(proj.lastInsertRowid, 'Draft findings chapter', 'Writing', 'To Do', 'High', '2026-05-19', 14, null, null);
  insertTask.run(proj.lastInsertRowid, 'Peer review of draft', 'Review', 'To Do', 'Medium', '2026-06-09', 5, null, null);
  insertTask.run(proj.lastInsertRowid, 'Final submission', 'Review', 'To Do', 'High', '2026-06-23', 3, null, null);

  // Risks
  const insertRisk = db.prepare('INSERT INTO Risk (project_id, description, likelihood, impact, mitigation, review_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertRisk.run(proj.lastInsertRowid, 'Interview participants cancel at short notice', 'Medium', 'High', 'Recruit two extra participants as backup, offer flexible scheduling', '2026-04-15', 'Open');
  insertRisk.run(proj.lastInsertRowid, 'Transcription takes longer than expected', 'High', 'Medium', 'Start transcribing after each interview rather than batching, consider automated transcription tool', '2026-04-10', 'Open');
  insertRisk.run(proj.lastInsertRowid, 'Supervisor feedback delayed', 'Medium', 'Medium', 'Submit drafts two weeks early, have backup reviewer', '2026-05-20', 'Open');
  insertRisk.run(proj.lastInsertRowid, 'Insufficient interview data for thematic analysis', 'Low', 'High', 'Plan follow-up questions, consider supplementary survey if needed', '2026-05-01', 'Open');
  insertRisk.run(proj.lastInsertRowid, 'Personal circumstances disrupt study schedule', 'Medium', 'High', 'Built buffer weeks into plan, can extend writing phase if needed', '2026-06-01', 'Open');

  console.log('Database seeded with sample data');
}

module.exports = db;
