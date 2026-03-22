import { Router } from 'express';
import {
  registerCitizen,    loginCitizen,
  registerContractor, loginContractor,
  registerAuthority,  loginAuthority,
  changePassword, deleteAccount, logout,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// ── Citizen ───────────────────────────────────────────────────────────────
router.post('/citizen/register', registerCitizen);
router.post('/citizen/login',    loginCitizen);

// ── Contractor ────────────────────────────────────────────────────────────
router.post('/contractor/register', registerContractor);
router.post('/contractor/login',    loginContractor);

// ── Authority ─────────────────────────────────────────────────────────────
router.post('/authority/register', registerAuthority);
router.post('/authority/login',    loginAuthority);

// ── Shared (protected) ───────────────────────────────────────────────────
router.post('/logout',           protect, logout);
router.post('/change-password',  protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

export default router;