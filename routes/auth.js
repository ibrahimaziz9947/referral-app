const express = require('express');
const router = express.Router();
const { signupUser, loginUser, resetPassword } = require('../controllers/userController');


router.post('/signup', signupUser);

router.post('/login', loginUser);

router.post('/reset-password', resetPassword);

module.exports = router;
