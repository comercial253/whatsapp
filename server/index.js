const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'chat.db'));
const WA_API_TOKEN = process.env.WA_API_TOKEN || '';
const WA_INSTANCE_ID = process.env.WA_INSTANCE_ID || '';

app.use(express.json());

async function sendWhatsAppMessage(phone, message) {
  if (!WA_API_TOKEN || !WA_INSTANCE_ID) {
    console.log('WA API credentials not set, skipping real send');
    return;
  }
  const url = `https://waapi.app/api/v1/instances/${WA_INSTANCE_ID}/client/action/send-message`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WA_API_TOKEN}`,
      },
      body: JSON.stringify({ phone, message }),
    });
    const data = await res.text();
    console.log('WA API response', data);
  } catch (e) {
    console.error('WA API error', e.message);
  }
}

// Initialize tables
const initDb = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      assigned_to INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      user_id INTEGER,
      direction TEXT,
      message TEXT,
      media_mimetype TEXT,
      media_data TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  const insertOutgoing = (convId) => {
    db.run(
      'INSERT INTO conversation_messages(conversation_id, user_id, direction, message, media_mimetype, media_data) VALUES (?,?,?,?,?,?)',
      [convId, userId, 'outgoing', message, null, null],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });
        db.run(
          `INSERT INTO messages_${userId}(phone, message) VALUES (?,?)`,
          [phone, message],
          () => {}
        );
        sendWhatsAppMessage(phone, message);
        res.json({ id: this.lastID });
      }
    );
  };

  db.get('SELECT id, assigned_to FROM conversations WHERE phone = ?', [phone], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) {
      db.run('INSERT INTO conversations(phone, assigned_to) VALUES (?,?)', [phone, userId], function (convErr) {
        if (convErr) return res.status(400).json({ error: convErr.message });
        insertOutgoing(this.lastID);
      });
    } else {
      if (!row.assigned_to) {
        db.run('UPDATE conversations SET assigned_to=? WHERE id=?', [userId, row.id]);
      }
      insertOutgoing(row.id);
    }
  });
});

app.get('/messages/:userId', (req, res) => {
  const { userId } = req.params;
  db.all(`SELECT * FROM messages_${userId} ORDER BY sent_at DESC`, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/webhook', (req, res) => {
  const event = req.body.event;
  const msg = req.body?.data?.message;
  const media = req.body?.data?.media;

  if (event !== 'message' || !msg) return res.status(400).end();

  const phone = (msg.from || msg.id?.remote || '').replace(/@c\.us$/, '');
  const message = msg.body || '';
  const mime = media?.mimetype || null;
  const mediaData = media?.data || null;

  if (!phone) return res.status(400).end();

  db.get('SELECT id FROM conversations WHERE phone = ?', [phone], (err, row) => {
    if (err) return res.status(500).end();

    const handleMessage = (convId) => {
      db.run(
        'INSERT INTO conversation_messages(conversation_id, direction, message, media_mimetype, media_data) VALUES (?, ?, ?, ?, ?)',
        [convId, 'incoming', message, mime, mediaData]
      );
    };

    if (!row) {
      db.run('INSERT INTO conversations(phone) VALUES (?)', [phone], function () {
        handleMessage(this.lastID);
      });
    } else {
      handleMessage(row.id);
    }
  });

  res.json({ status: 'ok' });
});

app.get('/conversations', (req, res) => {
  const sql = `SELECT c.id, c.phone, c.assigned_to,
    (SELECT message FROM conversation_messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) as last_message,
    (SELECT sent_at FROM conversation_messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) as last_time
    FROM conversations c ORDER BY last_time DESC`;
  db.all(sql, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/messages/conversation/:id', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM conversation_messages WHERE conversation_id = ? ORDER BY sent_at ASC', [id], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/conversations/:id/assign', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  db.run('UPDATE conversations SET assigned_to=? WHERE id=?', [userId, id], function(err){
    if (err) return res.status(400).json({ error: err.message });
    res.json({ changed: this.changes });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on ' + PORT));
