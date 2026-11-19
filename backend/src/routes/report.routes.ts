import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/exam/:examId/excel', ReportController.exportExamExcel);
router.get('/attempt/:attemptId/pdf', ReportController.exportStudentResultPdf);

export default router;
