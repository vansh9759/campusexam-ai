import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['FACULTY', 'ADMIN']));

router.get('/overview', FacultyController.getOverview);
router.get('/exams', FacultyController.getExams);
router.get('/exams/:id', FacultyController.getExamById);
router.post('/exams', FacultyController.createExam);
router.patch('/exams/:id/status', FacultyController.updateExamStatus);

router.get('/question-bank', FacultyController.getQuestionBank);
router.post('/question-bank', FacultyController.createQuestion);

router.post('/attempts/:attemptId/evaluate', FacultyController.evaluateStudentSubmission);
router.post('/exams/:examId/publish-results', FacultyController.publishResults);
router.get('/exams/:examId/analytics', FacultyController.getExamAnalytics);

export default router;
