import { Router } from 'express';
import { getProjects, getAuthorities, createProject, seedData } from '../controllers/projectController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/projects', protect, getProjects);
router.get('/authorities', protect, getAuthorities);
router.post('/projects', protect, createProject);
router.post('/seed', seedData); // run once to seed

export default router;