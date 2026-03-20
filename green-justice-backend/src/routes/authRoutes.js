const express = require('express');
const { loginAuthority, createAuthority } = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', loginAuthority);
router.post('/create-authority', protect, adminOnly, createAuthority);

module.exports = router;
