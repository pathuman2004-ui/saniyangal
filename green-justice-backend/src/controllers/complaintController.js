const pool = require('../config/db');
const generateComplaintCode = require('../utils/generateComplaintCode');
const { emitComplaintUpdate } = require('../services/socketService');

async function createComplaint(req, res, next) {
  try {
    const {
      violation_type_id,
      description,
      district,
      landmark,
      latitude,
      longitude,
      language,
      size_level,
      reporter_name,
      reporter_phone
    } = req.body;

    if (!violation_type_id || !district || !latitude || !longitude) {
      return res.status(400).json({
        message: 'violation_type_id, district, latitude, longitude are required'
      });
    }

    const complaintCode = generateComplaintCode();

    const [result] = await pool.query(
      `INSERT INTO complaints
      (complaint_code, violation_type_id, description, district, landmark, latitude, longitude, language, size_level, reporter_name, reporter_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        complaintCode,
        violation_type_id,
        description || null,
        district,
        landmark || null,
        latitude,
        longitude,
        language || 'en',
        size_level || 'medium',
        reporter_name || null,
        reporter_phone || null
      ]
    );

    const complaintId = result.insertId;

    if (req.file) {
      const fileType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
      const fileUrl = `/uploads/${req.file.filename}`;
      await pool.query(
        'INSERT INTO evidence (complaint_id, file_url, file_type) VALUES (?, ?, ?)',
        [complaintId, fileUrl, fileType]
      );
    }

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint_id: complaintId,
      complaint_code: complaintCode
    });
  } catch (error) {
    next(error);
  }
}

async function getAllComplaints(req, res, next) {
  try {
    const {
      status,
      district,
      search,
      sortBy = 'newest',
      page = 1,
      limit = 10
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    let whereSql = 'WHERE c.is_deleted = FALSE';
    const params = [];

    if (status) {
      whereSql += ' AND c.status = ?';
      params.push(status);
    }

    if (district) {
      whereSql += ' AND c.district = ?';
      params.push(district);
    }

    if (search) {
      whereSql += ' AND (c.complaint_code LIKE ? OR c.description LIKE ? OR c.landmark LIKE ? OR vt.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    let orderSql = 'ORDER BY c.updated_at DESC';
    if (sortBy === 'oldest') orderSql = 'ORDER BY c.created_at ASC';
    if (sortBy === 'highly_reported') orderSql = 'ORDER BY c.report_count DESC, c.updated_at DESC';
    if (sortBy === 'size') orderSql = `ORDER BY FIELD(c.size_level, 'large', 'medium', 'small'), c.updated_at DESC`;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM complaints c
      JOIN violation_types vt ON c.violation_type_id = vt.id
      ${whereSql}
    `;

    const listQuery = `
      SELECT c.*, vt.name AS violation_type
      FROM complaints c
      JOIN violation_types vt ON c.violation_type_id = vt.id
      ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `;

    const [countRows] = await pool.query(countQuery, params);
    const [rows] = await pool.query(listQuery, [...params, safeLimit, offset]);

    res.json({
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT c.*, vt.name AS violation_type
       FROM complaints c
       JOIN violation_types vt ON c.violation_type_id = vt.id
       WHERE c.id = ? AND c.is_deleted = FALSE`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaint = rows[0];

    await pool.query('UPDATE complaints SET report_count = report_count + 1 WHERE id = ?', [id]);

    const [evidenceRows] = await pool.query('SELECT * FROM evidence WHERE complaint_id = ?', [id]);
    const [statusRows] = await pool.query(
      `SELECT l.*, a.name AS updated_by_name
       FROM complaint_status_logs l
       LEFT JOIN authorities a ON l.updated_by_authority_id = a.id
       WHERE l.complaint_id = ?
       ORDER BY l.created_at DESC`,
      [id]
    );

    res.json({
      complaint: {
        ...complaint,
        report_count: complaint.report_count + 1
      },
      evidence: evidenceRows,
      status_logs: statusRows
    });
  } catch (error) {
    next(error);
  }
}

async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const allowed = ['not_viewed', 'in_progress', 'resolved', 'rejected'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const [rows] = await pool.query(
      'SELECT id, complaint_code, status FROM complaints WHERE id = ? AND is_deleted = FALSE',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaint = rows[0];
    await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
    await pool.query(
      `INSERT INTO complaint_status_logs
      (complaint_id, updated_by_authority_id, old_status, new_status, note)
      VALUES (?, ?, ?, ?, ?)`,
      [id, req.user.id, complaint.status, status, note || null]
    );

    emitComplaintUpdate(complaint.complaint_code, {
      complaint_id: Number(id),
      complaint_code: complaint.complaint_code,
      old_status: complaint.status,
      new_status: status,
      note: note || null,
      updated_at: new Date().toISOString()
    });

    res.json({ message: 'Complaint status updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function getComplaintStatusByCode(req, res, next) {
  try {
    const { complaintCode } = req.params;

    const [rows] = await pool.query(
      `SELECT complaint_code, status, updated_at, created_at
       FROM complaints
       WHERE complaint_code = ? AND is_deleted = FALSE`,
      [complaintCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function deleteComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id FROM complaints WHERE id = ? AND is_deleted = FALSE', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await pool.query('UPDATE complaints SET is_deleted = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  getComplaintStatusByCode,
  deleteComplaint
};
