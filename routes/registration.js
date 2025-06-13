const express = require('express');
const router = express.Router();
const { registerUser, uploadDocument, getAllUsers } = require('../controllers/registrationController');

router.post('/register', registerUser);
router.post('/upload-document', uploadDocument);
router.post('/users', getAllUsers);

module.exports = router;