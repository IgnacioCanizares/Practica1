const express = require('express');
const router = express.Router();
const { register, validateEmail, login, updateUserData, updateCompanyData, updateLogo, getUser, deleteUser, requestPasswordReset, resetPassword, inviteToCompany } = require('../controllers/user');
const { validatorRegister, validatorValidateCode, validatorLogin, validatorOnboarding, validatorCompany, validatorGetUser, validatorPasswordReset, validatorInvite } = require('../validators/auth');
const { validateJWT } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', validatorRegister, register);
router.put('/validate', validateJWT, validatorValidateCode, validateEmail);
router.post('/login', validatorLogin, login);
router.put('/register', validateJWT, validatorOnboarding, updateUserData);
router.patch('/company', validateJWT, validatorCompany, updateCompanyData);
router.get('/profile', validateJWT, validatorGetUser, getUser);
router.delete('/profile', validateJWT, deleteUser);
router.post('/password/request-reset', validatorPasswordReset.request, requestPasswordReset);
router.post('/password/reset', validatorPasswordReset.reset, resetPassword);
router.post('/invite', validateJWT, validatorInvite, inviteToCompany);

module.exports = router;