const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Endpoint (Experiment 1 Registration/Login verification)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Credentials required' });
  }
  // Simulated authentication
  res.status(200).json({ status: 'success', message: 'Authenticated successfully' });
});

// Order Placement Endpoint
app.post('/api/order', (req, res) => {
  const { username, product } = req.body;
  if (!product) {
    return res.status(400).json({ status: 'error', message: 'Missing product' });
  }
  res.status(200).json({ 
    status: 'success', 
    message: `Order confirmed: ${product} for ${username || 'Guest'}!` 
  });
});

app.listen(PORT, () => {
  console.log(`E-Store active at http://localhost:${PORT}`);
});
