import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['STUDENT', 'ADMIN']));

router.get('/overview', StudentController.getOverview);
router.get('/results', StudentController.getResults);
router.get('/results/:attemptId', StudentController.getResultDetail);

export default router;
