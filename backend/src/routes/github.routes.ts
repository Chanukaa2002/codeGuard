import { Router } from 'express';
import { githubController } from '../controllers/github.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/repos', authMiddleware, githubController.getRepos);
router.get('/repos/:owner/:repo/branches', authMiddleware, githubController.getBranches);
router.post('/repos/:owner/:repo/scan', authMiddleware, githubController.scanRepo);

export default router;
