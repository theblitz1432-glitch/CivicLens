import { Router } from 'express';
import { submitRating, getContractorRating, getAllRatings, checkRated } from '../controllers/ratingController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, submitRating);
router.get('/all', protect, getAllRatings);
router.get('/contractor/:contractorId', protect, getContractorRating);
router.get('/check/:complaintId', protect, checkRated);

export default router;