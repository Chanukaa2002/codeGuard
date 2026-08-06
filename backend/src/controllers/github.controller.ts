import { Request, Response } from 'express';
import { githubService } from '../services/github.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class GithubController {
  async getRepos(req: Request, res: Response): Promise<any> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const token = authHeader.replace('Bearer ', '');
      
      const page = req.query.page as string || '1';
      const perPage = req.query.per_page as string || '10';

      const data = await githubService.fetchRepos(token, page, perPage);
      return res.json(data);
    } catch (error: any) {
      console.error('Error in /api/github/repos:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
    }
  }

  async getBranches(req: Request, res: Response): Promise<any> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const token = authHeader.replace('Bearer ', '');

      const owner = req.params.owner as string;
      const repo = req.params.repo as string;

      const data = await githubService.fetchBranches(token, owner, repo);
      return res.json(data);
    } catch (error: any) {
      console.error('Error in /api/github/repos/branches:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
    }
  }

  async scanRepo(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { branch, githubToken } = req.body;
      const owner = req.params.owner as string;
      const repo = req.params.repo as string;

      if (!branch || !githubToken) {
        return res.status(400).json({ error: 'Missing branch or githubToken in request body' });
      }

      const reportId = await githubService.initiateScan(req.user.id, owner, repo, branch, githubToken);
      return res.json({ message: 'Scan initiated', reportId });
    } catch (error: any) {
      console.error('Error initiating scan:', error);
      if (error.message.includes('missing') || error.message.includes('not found')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
    }
  }
}

export const githubController = new GithubController();
