import { Router } from 'express';
import {
  getProjects, getContractorProjects, getAuthorities, createProject,
  updateProject, uploadProjectReport, getContractorComplaints,
  getContractorStats, getAuthorityStats, seedData
} from '../controllers/projectController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/projects', protect, getProjects);
router.get('/projects/mine', protect, getContractorProjects);
router.get('/authorities', protect, getAuthorities);
router.post('/projects', protect, createProject);
router.patch('/projects/:id', protect, updateProject);
router.post('/projects/:id/report', protect, uploadProjectReport);
router.get('/complaints', protect, getContractorComplaints);
router.get('/stats/contractor', protect, getContractorStats);
router.get('/stats/authority', protect, getAuthorityStats);
router.post('/seed', seedData);

export default router;