require('dotenv').config(); // Load .env at the top
const express = require('express');
const connectDB = require('./config/db');
const registrationRoutes = require('./routes/registration');
const admitCardRoutes = require('./routes/admitCard');
const paymentRoutes = require('./routes/payment');

const app = express();

// Connect to MongoDB
connectDB();

// Custom CORS Middleware (replacing cors package)
app.use((req, res, next) => {
  const allowedOrigins = ['https://admitcard-frontend.vercel.app', 'http://localhost:5173'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase payload limit for base64 files

// Routes
app.use('/api/registration', registrationRoutes);
app.use('/api/admit-card', admitCardRoutes);
app.use('/api/payment', paymentRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
  });
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});