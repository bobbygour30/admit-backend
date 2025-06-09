const express = require('express');
const router = express.Router();
const { registerUser, uploadDocument } = require('../controllers/registrationController');

router.post('/register', registerUser);
router.post('/upload-document', uploadDocument);

module.exports = router;