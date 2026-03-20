const pool = require('../config/db');

async function getSuggestedOffice(req, res, next) {
  try {
    const { complaintId } = req.params;

    const [complaintRows] = await pool.query(
      'SELECT violation_type_id, district FROM complaints WHERE id = ? AND is_deleted = FALSE',
      [complaintId]
    );

    if (complaintRows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaint = complaintRows[0];

    const [officeRows] = await pool.query(
      `SELECT o.*
       FROM office_violation_map ovm
       JOIN offices o ON ovm.office_id = o.id
       WHERE ovm.violation_type_id = ? AND ovm.district = ?
       LIMIT 1`,
      [complaint.violation_type_id, complaint.district]
    );

    if (officeRows.length === 0) {
      return res.status(404).json({ message: 'No matching office found for this complaint' });
    }

    res.json(officeRows[0]);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSuggestedOffice };
