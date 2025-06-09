require('dotenv').config(); // Load .env at the top
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const registrationRoutes = require('./routes/registration');
const admitCardRoutes = require('./routes/admitCard');
const paymentRoutes = require('./routes/payment');

const app = express();

// Connect to MongoDB
connectDB();

// CORS
app.use(cors({
  origin: ['https://admitcard-frontend.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware
app.use(express.json());

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
  console.error('Server Error:', err.message, err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});