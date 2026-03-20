const cron = require('node-cron');
const pool = require('../config/db');
const sendEmail = require('../utils/sendEmail');

async function checkPendingComplaintsAndSendReminders() {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.complaint_code, c.created_at, c.status, a.id AS authority_id, a.email
      FROM complaints c
      JOIN authorities a ON a.role IN ('authority', 'admin')
      WHERE c.is_deleted = FALSE
        AND c.status IN ('not_viewed', 'in_progress')
        AND c.created_at <= NOW() - INTERVAL 7 DAY
        AND NOT EXISTS (
          SELECT 1 FROM reminders r
          WHERE r.complaint_id = c.id
            AND DATE(r.sent_at) = CURDATE()
        )
      LIMIT 50
    `);

    for (const row of rows) {
      if (row.email) {
        await sendEmail(
          row.email,
          `Reminder: unresolved complaint ${row.complaint_code}`,
          `Complaint ${row.complaint_code} is still ${row.status}. Please review it.`
        );
      }

      await pool.query(
        'INSERT INTO reminders (complaint_id, sent_to_authority_id, status) VALUES (?, ?, ?)',
        [row.id, row.authority_id || null, 'sent']
      );
    }
  } catch (error) {
    console.error('Reminder job failed:', error.message);
  }
}

function startReminderJob() {
  cron.schedule('0 9 * * *', async () => {
    await checkPendingComplaintsAndSendReminders();
  });
}

module.exports = { startReminderJob, checkPendingComplaintsAndSendReminders };
