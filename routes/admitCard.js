const express = require('express');
const router = express.Router();
const { getAdmitCard } = require('../controllers/admitCardController');

// Routes
router.get('/', getAdmitCard); // GET /api/admit-card

module.exports = router;