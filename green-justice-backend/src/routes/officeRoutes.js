const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getSuggestedOffice } = require('../controllers/officeController');

const router = express.Router();

router.get('/suggest/:complaintId', protect, getSuggestedOffice);

module.exports = router;
