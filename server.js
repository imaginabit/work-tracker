import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'worktracker.db'));

const app = express();
app.use(cors());
app.use(express.json());

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#7C3AED',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#059669',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    clientId TEXT DEFAULT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    estimatedHours REAL DEFAULT 1,
    requirements TEXT DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    status TEXT DEFAULT 'backlog',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    taskId TEXT NOT NULL,
    date TEXT NOT NULL,
    startHour INTEGER NOT NULL,
    endHour INTEGER NOT NULL,
    description TEXT DEFAULT '',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
  );
`);

// Users
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY name ASC').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { id, name, color } = req.body;
  db.prepare(`INSERT INTO users (id, name, color, createdAt) VALUES (?, ?, ?, ?)`)
    .run(id, name, color || '#7C3AED', new Date().toISOString());
  res.json(req.body);
});

app.put('/api/users/:id', (req, res) => {
  const { name, color } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (color !== undefined) { fields.push('color = ?'); values.push(color); }
  if (fields.length === 0) return res.json({ ok: true });
  values.push(req.params.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});

app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM time_entries WHERE userId = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Clients
app.get('/api/clients', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const { id, name, color } = req.body;
  db.prepare(`INSERT INTO clients (id, name, color, createdAt) VALUES (?, ?, ?, ?)`)
    .run(id, name, color || '#059669', new Date().toISOString());
  res.json(req.body);
});

app.put('/api/clients/:id', (req, res) => {
  const { name, color } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (color !== undefined) { fields.push('color = ?'); values.push(color); }
  if (fields.length === 0) return res.json({ ok: true });
  values.push(req.params.id);
  db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});

app.delete('/api/clients/:id', (req, res) => {
  db.prepare('UPDATE tasks SET clientId = NULL WHERE clientId = ?').run(req.params.id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Tasks
app.get('/api/tasks', (req, res) => {
  const { clientId } = req.query;
  let query = "SELECT * FROM tasks";
  const params = [];
  if (clientId) {
    query += ' WHERE clientId = ?';
    params.push(clientId);
  }
  query += ' ORDER BY createdAt DESC';
  const tasks = db.prepare(query).all(...params);
  res.json(tasks.map(t => ({ ...t, requirements: JSON.parse(t.requirements || '[]'), tags: JSON.parse(t.tags || '[]') })));
});

app.get('/api/tasks/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json({ ...task, requirements: JSON.parse(task.requirements || '[]'), tags: JSON.parse(task.tags || '[]') });
});

app.post('/api/tasks', (req, res) => {
  const { id, clientId, name, description, deadline, estimatedHours, requirements, tags, status, createdAt } = req.body;
  db.prepare(`
    INSERT INTO tasks (id, clientId, name, description, deadline, estimatedHours, requirements, tags, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, clientId || null, name, description || '', deadline || '', estimatedHours || 1, JSON.stringify(requirements || []), JSON.stringify(tags || []), status || 'backlog', createdAt);
  res.json(req.body);
});

app.put('/api/tasks/:id', (req, res) => {
  const { clientId, name, description, deadline, estimatedHours, requirements, tags, status } = req.body;
  const fields = [];
  const values = [];
  if (clientId !== undefined) { fields.push('clientId = ?'); values.push(clientId || null); }
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (deadline !== undefined) { fields.push('deadline = ?'); values.push(deadline); }
  if (estimatedHours !== undefined) { fields.push('estimatedHours = ?'); values.push(estimatedHours); }
  if (requirements !== undefined) { fields.push('requirements = ?'); values.push(JSON.stringify(requirements)); }
  if (tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(tags)); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  values.push(req.params.id);
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM time_entries WHERE taskId = ?').run(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Time entries
app.get('/api/time-entries', (req, res) => {
  const { userId } = req.query;
  let query = 'SELECT * FROM time_entries';
  const params = [];
  if (userId) {
    query += ' WHERE userId = ?';
    params.push(userId);
  }
  query += ' ORDER BY date DESC, startHour DESC';
  const entries = db.prepare(query).all(...params);
  res.json(entries);
});

app.post('/api/time-entries', (req, res) => {
  const { id, userId, taskId, date, startHour, endHour, description } = req.body;
  db.prepare(`
    INSERT INTO time_entries (id, userId, taskId, date, startHour, endHour, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, taskId, date, startHour, endHour, description || '');
  res.json(req.body);
});

app.put('/api/time-entries/:id', (req, res) => {
  const { userId, taskId, date, startHour, endHour, description } = req.body;
  db.prepare(`
    UPDATE time_entries SET userId = ?, taskId = ?, date = ?, startHour = ?, endHour = ?, description = ?
    WHERE id = ?
  `).run(userId, taskId, date, startHour, endHour, description || '', req.params.id);
  res.json({ ok: true });
});

app.delete('/api/time-entries/:id', (req, res) => {
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
