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
    prompt_presentation TEXT,
    prompt_relevance TEXT,
    prompt_objectivity TEXT,
    prompt_method TEXT,
    prompt_provenance TEXT,
    prompt_timeliness TEXT,
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
    relation_type TEXT NOT NULL DEFAULT 'Affected'
      CHECK (relation_type IN ('Affected', 'Mitigation')),
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

  // Mitigation tasks linked to risks below
  const mit1 = insertTask.run(proj.lastInsertRowid, 'Recruit two backup participants', 'Data collection', 'Complete', 'Medium', '2026-03-10', 3, '2026-03-12', 2);
  const mit2 = insertTask.run(proj.lastInsertRowid, 'Trial automated transcription tool', 'Data collection', 'Complete', 'Low', '2026-03-31', 2, '2026-03-31', 1);

  // Risks
  const insertRisk = db.prepare('INSERT INTO Risk (project_id, description, likelihood, impact, mitigation, review_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const r1 = insertRisk.run(proj.lastInsertRowid, 'Interview participants cancel at short notice', 'Medium', 'High', 'Recruit two extra participants as backup, offer flexible scheduling', '2026-04-15', 'Open');
  const r2 = insertRisk.run(proj.lastInsertRowid, 'Transcription takes longer than expected', 'High', 'Medium', 'Start transcribing after each interview rather than batching, consider automated transcription tool', '2026-04-10', 'Open');
  insertRisk.run(proj.lastInsertRowid, 'Supervisor feedback delayed', 'Medium', 'Medium', 'Submit drafts two weeks early, have backup reviewer', '2026-05-20', 'Open');
  const r4 = insertRisk.run(proj.lastInsertRowid, 'Insufficient interview data for thematic analysis', 'Low', 'High', 'Plan follow-up questions, consider supplementary survey if needed', '2026-05-01', 'Open');
  insertRisk.run(proj.lastInsertRowid, 'Personal circumstances disrupt study schedule', 'Medium', 'High', 'Built buffer weeks into plan, can extend writing phase if needed', '2026-06-01', 'Open');

  // Risk to task links
  const insertLink = db.prepare('INSERT INTO RiskTask (risk_id, task_id, relation_type) VALUES (?, ?, ?)');
  insertLink.run(r1.lastInsertRowid, mit1.lastInsertRowid, 'Mitigation');
  insertLink.run(r2.lastInsertRowid, 6, 'Affected');
  insertLink.run(r2.lastInsertRowid, mit2.lastInsertRowid, 'Mitigation');
  insertLink.run(r4.lastInsertRowid, 8, 'Affected');

  // Literature items
  const insertLit = db.prepare('INSERT INTO LiteratureItem (project_id, author, title, year, source_type, notes, prompt_presentation, prompt_relevance, prompt_objectivity, prompt_method, prompt_provenance, prompt_timeliness) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertLit.run(proj.lastInsertRowid, 'Bloom, N., Liang, J., Roberts, J. and Ying, Z.J.', 'Does working from home work? Evidence from a Chinese experiment', 2015, 'Journal article', 'Randomised trial at a large firm, 13 percent performance rise for home workers. Useful baseline for productivity claims.', 'Clear structure, results tables easy to follow', 'Directly relevant to core research question', 'Authors declare no conflicts, funded study', 'Randomised controlled trial with 249 staff', 'Quarterly Journal of Economics, peer reviewed', 'Pre-pandemic so context differs from current remote work');
  insertLit.run(proj.lastInsertRowid, 'Felstead, A. and Henseke, G.', 'Assessing the growth of remote working and its consequences for effort, well-being and work-life balance', 2017, 'Journal article', 'UK survey evidence linking remote work to higher effort and blurred boundaries.', 'Well organised, some dense statistical sections', 'Covers UK context which matches study population', 'Balanced discussion of positives and negatives', 'Analysis of national survey data', 'New Technology, Work and Employment, peer reviewed', 'Predates 2020 shift, treat trends with care');
  insertLit.run(proj.lastInsertRowid, 'Office for National Statistics', 'Characteristics of homeworkers, Great Britain', 2024, 'Website', 'Official statistics on who works from home and how often. Used for sampling frame decisions.', 'Charts and tables with plain summaries', 'Provides population context for SME sample', 'National statistics body, politically neutral', 'Labour Force Survey based estimates', 'UK official statistics producer', 'Recent release, current picture');
  insertLit.run(proj.lastInsertRowid, 'Yang, L. et al.', 'The effects of remote work on collaboration among information workers', 2022, 'Journal article', 'Large scale study of collaboration networks becoming more siloed under remote work.', 'Long paper, good figures', 'Relevant to team productivity angle', 'Industry data but peer reviewed analysis', 'Analysis of communication metadata for 61000 workers', 'Nature Human Behaviour, peer reviewed', 'Covers 2020 data, recent enough');

  // Weekly log entries
  const insertLog = db.prepare('INSERT INTO LogEntry (project_id, week_number, entry_date, what_done, what_well, what_poorly, planned_next) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertLog.run(proj.lastInsertRowid, 1, '2026-02-13', 'Drafted research questions and shared with supervisor', 'Questions narrowed to team productivity in SMEs', 'First draft was too broad and needed two rewrites', 'Start literature review');
  insertLog.run(proj.lastInsertRowid, 2, '2026-02-20', 'Started literature review, logged first sources', 'Found strong baseline studies quickly', 'Underestimated reading time for long papers', 'Continue review, draft interview schedule');
  insertLog.run(proj.lastInsertRowid, 4, '2026-03-06', 'Finished interview schedule and pilot tested questions', 'Pilot flagged two confusing questions early', 'Pilot session ran over the planned hour', 'Recruit participants');
  insertLog.run(proj.lastInsertRowid, 6, '2026-03-20', 'Recruitment complete including backups', 'Backup recruits reduce cancellation risk', 'Took nine days against a plan of seven', 'Run first interview batch');

  console.log('Database seeded with sample data');
}

module.exports = db;
