import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

router.get('/dashboard-stats', AdminController.getDashboardStats);
router.get('/departments', AdminController.getDepartments);
router.post('/departments', AdminController.createDepartment);

router.get('/subjects', AdminController.getSubjects);
router.post('/subjects', AdminController.createSubject);

router.get('/students', AdminController.getStudents);
router.post('/students', AdminController.createStudent);

router.get('/faculty', AdminController.getFaculty);
router.post('/faculty', AdminController.createFaculty);

router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/metadata', AdminController.getMetadata);

export default router;
