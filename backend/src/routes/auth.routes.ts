import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticateToken, AuthController.me);

export default router;
