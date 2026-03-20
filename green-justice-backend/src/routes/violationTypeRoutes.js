const express = require('express');
const { getViolationTypes } = require('../controllers/violationTypeController');

const router = express.Router();

router.get('/', getViolationTypes);

module.exports = router;
