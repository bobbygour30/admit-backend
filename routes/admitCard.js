const express = require('express');
const router = express.Router();
const { getAdmitCard, emailAdmitCard } = require('../controllers/admitCardController');

router.get('/', getAdmitCard);
router.post('/email', emailAdmitCard);

module.exports = router;