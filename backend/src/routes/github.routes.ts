import { Router } from 'express';
import { githubController } from '../controllers/github.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/repos', githubController.getRepos);
router.get('/repos/:owner/:repo/branches', githubController.getBranches);
router.post('/repos/:owner/:repo/scan', authMiddleware, githubController.scanRepo);

export default router;
