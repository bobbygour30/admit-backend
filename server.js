require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const registrationRoutes = require('./routes/registration');
const admitCardRoutes = require('./routes/admitCard');
const paymentRoutes = require('./routes/payment');

const app = express();

// Connect to MongoDB
connectDB();

// Define allowed origins
const allowedOrigins = [
  'https://admitcard-frontend.vercel.app',
  'http://localhost:5173',
  'https://admit-backend-beta.vercel.app', // Add backend URL for testing
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204, // Ensure 204 for OPTIONS
  })
);

// Explicitly handle OPTIONS for registration route
app.options('/api/registration/register', (req, res) => {
  res.status(204).end();
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log('Received request:', req.method, req.url, req.body);
  next();
});

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
  res.status(err.status || 500).json({
    message: err.status ? err.message : 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !module.exports) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Keep for Vercel