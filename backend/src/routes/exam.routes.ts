import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['STUDENT', 'ADMIN', 'FACULTY']));

router.post('/:examId/start', ExamController.startAttempt);
router.get('/attempts/:attemptId/paper', ExamController.getExamPaper);
router.post('/attempts/:attemptId/autosave', ExamController.autosaveAnswer);
router.post('/attempts/:attemptId/run-code', ExamController.runSampleCode);
router.post('/attempts/:attemptId/submit', ExamController.submitExam);

export default router;
