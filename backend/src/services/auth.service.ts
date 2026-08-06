import { prisma } from '../config/db';

export class AuthService {
  async syncUser(user: any) {
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.user_name || 'Anonymous';
    const avatarUrl = user.user_metadata?.avatar_url || null;
    const githubId = user.user_metadata?.provider_id || null;

    return await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email,
        name,
        avatarUrl,
        githubId,
      },
      create: {
        id: user.id,
        email,
        name,
        avatarUrl,
        githubId,
      },
    });
  }

  async getConfig(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { openRouterKey: true, aiModel: true },
    });
  }

  async updateConfig(userId: string, openRouterKey?: string, aiModel?: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        openRouterKey: openRouterKey !== undefined ? openRouterKey : undefined,
        aiModel: aiModel !== undefined ? aiModel : undefined,
      },
    });
  }
}

export const authService = new AuthService();
