import { Router } from 'express';
import {
  registerComplaint, getUserComplaints, getAllComplaints,
  getAllComplaintsForAuthority, updateComplaintStatus,
  addContractorReview, getComplaintStats, getMapData
} from '../controllers/complaintController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, registerComplaint);
router.get('/my', protect, getUserComplaints);
router.get('/stats', protect, getComplaintStats);
router.get('/all', protect, getAllComplaintsForAuthority);   // authority — shows reporter
router.get('/public', protect, getAllComplaints);             // public — anonymous
router.get('/map', protect, getMapData);                     // map colour data
router.patch('/:id/status', protect, updateComplaintStatus);
router.post('/:id/review', protect, addContractorReview);

export default router;