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

// Define allowed origins based on environment
const allowedOrigins = [
  'https://admitcard-frontend.vercel.app', // Production frontend
  process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null, // Development frontend
].filter(Boolean); // Remove null values

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies/auth headers if needed
  })
);

// Middleware
app.use(express.json({ limit: '10mb' }));

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});