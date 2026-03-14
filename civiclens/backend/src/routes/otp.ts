import { Router } from 'express';
import { sendEmailOTP, sendPhoneOTP, verifyOTP } from '../controllers/otpController';
 
const router = Router();
 
router.post('/send-email', sendEmailOTP);
router.post('/send-phone', sendPhoneOTP);
router.post('/verify', verifyOTP);
 
export default router;
 