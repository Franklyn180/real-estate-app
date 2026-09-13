const express = require('express');
const cors = require('cors');
const { db, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'real-estate-backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/properties', (req, res) => {
  db.all('SELECT * FROM properties ORDER BY id ASC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Unable to fetch properties.' });
      return;
    }

    res.json(rows);
  });
});

app.get('/api/properties/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM properties WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Unable to fetch property.' });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }

    res.json(row);
  });
});

app.get('/api/agents', (req, res) => {
  db.all('SELECT * FROM agents ORDER BY id ASC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Unable to fetch agents.' });
      return;
    }

    res.json(rows);
  });
});

app.post('/api/enquiries', (req, res) => {
  const { name, email, propertyId, message } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }

  const enquiry = {
    name,
    email,
    propertyId: propertyId || null,
    message: message || '',
    receivedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Your enquiry has been received. An advisor will contact you soon.',
    enquiry
  });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Real estate backend is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
