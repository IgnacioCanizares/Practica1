const express = require('express');
const router = express.Router();
const { register, validateEmail, login } = require('../controllers/user');
const { validatorRegister, validatorValidateCode, validatorLogin } = require('../validators/auth');
const { validateJWT } = require('../middleware/auth');

router.post('/register', validatorRegister, register);
router.put('/validate', validateJWT, validatorValidateCode, validateEmail);
router.post('/login', validatorLogin, login);

module.exports = router;