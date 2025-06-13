const express = require('express');
const router = express.Router();
const { registerUser, uploadDocument, getUser, getAllUsers } = require('../controllers/registrationController');

router.post('/register', registerUser);
router.post('/upload-document', uploadDocument);
router.get('/user', getUser);
router.post('/users', getAllUsers);

module.exports = router;