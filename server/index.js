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

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      phone TEXT,
      message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
};
initDb();

app.post('/users', (req, res) => {
  const { username, password } = req.body;
  db.run('INSERT INTO users(username,password) VALUES (?,?)', [username, password], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, username });
  });
});

app.get('/users', (req, res) => {
  db.all('SELECT id, username FROM users', (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/messages', (req, res) => {
  const { user_id, phone, message } = req.body;
  db.run('INSERT INTO messages(user_id, phone, message) VALUES (?,?,?)', [user_id, phone, message], function(err){
    if (err) return res.status(400).json({ error: err.message });
    // Placeholder for sending message to WhatsApp API
    console.log(`Send to ${phone}: ${message}`);
    res.json({ id: this.lastID });
  });
});

app.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages', (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on ' + PORT));
