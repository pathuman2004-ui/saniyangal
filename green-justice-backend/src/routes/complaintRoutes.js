const express = require('express');
const upload = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  getComplaintStatusByCode,
  deleteComplaint
} = require('../controllers/complaintController');

const router = express.Router();

router.get('/status/:complaintCode', getComplaintStatusByCode);
router.post('/', upload.single('evidence'), createComplaint);
router.get('/', protect, getAllComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, updateComplaintStatus);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
