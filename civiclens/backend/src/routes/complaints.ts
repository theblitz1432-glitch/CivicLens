import { Router } from 'express';
import { registerComplaint, getUserComplaints, getAllComplaints, updateComplaintStatus, getComplaintStats } from '../controllers/complaintController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, registerComplaint);
router.get('/my', protect, getUserComplaints);
router.get('/stats', protect, getComplaintStats);
router.get('/all', protect, getAllComplaints);
router.patch('/:id/status', protect, updateComplaintStatus);

export default router;