import { Router } from 'express';
import { scanController } from '../controllers/scan.controller';

const router = Router();

router.post('/process', scanController.process);

export default router;
