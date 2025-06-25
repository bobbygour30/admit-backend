const express = require('express');
const router = express.Router();
const { registerUser, uploadDocument, getUser, getAllUsers , deleteUser } = require('../controllers/registrationController');

router.post('/register', registerUser);
router.post('/upload-document', uploadDocument);
router.get('/user', getUser);
router.post('/users', getAllUsers);
router.delete('/users/:applicationNumber', deleteUser);

module.exports = router;