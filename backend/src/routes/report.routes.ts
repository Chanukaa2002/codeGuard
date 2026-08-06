import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, reportController.getReports);
router.get('/:id', authMiddleware, reportController.getReportById);
router.delete('/:id', authMiddleware, reportController.deleteReport);

export default router;
