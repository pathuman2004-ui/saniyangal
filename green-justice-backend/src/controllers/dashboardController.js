const pool = require('../config/db');

async function getDashboardStats(req, res, next) {
  try {
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM complaints WHERE is_deleted = FALSE'
    );

    const [statusRows] = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM complaints
       WHERE is_deleted = FALSE
       GROUP BY status`
    );

    const [districtRows] = await pool.query(
      `SELECT district, COUNT(*) AS count
       FROM complaints
       WHERE is_deleted = FALSE
       GROUP BY district
       ORDER BY count DESC`
    );

    const [typeRows] = await pool.query(
      `SELECT vt.name AS violation_type, COUNT(*) AS count
       FROM complaints c
       JOIN violation_types vt ON c.violation_type_id = vt.id
       WHERE c.is_deleted = FALSE
       GROUP BY vt.name
       ORDER BY count DESC`
    );

    res.json({
      total: totalRows[0].total,
      by_status: statusRows,
      by_district: districtRows,
      by_violation_type: typeRows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboardStats };
