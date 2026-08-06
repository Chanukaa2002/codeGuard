import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/sync', authMiddleware, authController.syncUser);
router.get('/config', authMiddleware, authController.getConfig);
router.post('/config', authMiddleware, authController.updateConfig);

export default router;
