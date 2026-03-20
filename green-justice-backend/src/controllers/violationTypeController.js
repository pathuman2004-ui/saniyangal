const pool = require('../config/db');

async function getViolationTypes(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM violation_types ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = { getViolationTypes };
