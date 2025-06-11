const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'chat.db'));

app.use(express.json());

// Initialize tables
const initDb = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
  });
};
initDb();

app.post('/users', (req, res) => {
  const { username, password } = req.body;
  db.run('INSERT INTO users(username,password) VALUES (?,?)', [username, password], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    const userId = this.lastID;
    // create a table for this user's messages
    db.run(`CREATE TABLE IF NOT EXISTS messages_${userId} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) return res.status(500).json({ error: tableErr.message });
      res.json({ id: userId, username });
    });
  });
});

app.get('/users', (req, res) => {
  db.all('SELECT id, username FROM users', (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// simple login without sessions
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT id FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: row.id, username });
  });
});

app.post('/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const { phone, message } = req.body;
  db.run(`INSERT INTO messages_${userId}(phone, message) VALUES (?,?)`, [phone, message], function(err){
    if (err) return res.status(400).json({ error: err.message });
    console.log(`Send to ${phone}: ${message}`);
    res.json({ id: this.lastID });
  });
});

app.get('/messages/:userId', (req, res) => {
  const { userId } = req.params;
  db.all(`SELECT * FROM messages_${userId} ORDER BY sent_at DESC`, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on ' + PORT));
