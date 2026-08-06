import { Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  async syncUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const dbUser = await authService.syncUser(req.user);
      return res.json({ user: dbUser });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getConfig(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const dbUser = await authService.getConfig(req.user.id);
      return res.json(dbUser);
    } catch (error: any) {
      console.error('Error fetching config:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateConfig(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { openRouterKey, aiModel } = req.body;
      await authService.updateConfig(req.user.id, openRouterKey, aiModel);
      return res.json({ message: 'Configuration updated successfully' });
    } catch (error: any) {
      console.error('Error updating config:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const authController = new AuthController();
