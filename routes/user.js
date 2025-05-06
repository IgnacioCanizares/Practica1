const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    register,
    login,
    validateEmail,
    registerGuest
} = require('../controllers/user');


router.post('/register', register);
router.post('/login', login);
router.put('/validate', authMiddleware, validateEmail);
router.put('/register', authMiddleware, registerGuest);

module.exports = router;