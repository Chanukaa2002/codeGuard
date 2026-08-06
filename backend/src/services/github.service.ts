import { prisma } from '../config/db';
import { redis } from '../utils/redis';

export class GithubService {
  async fetchRepos(token: string, page: string, perPage: string) {
    const tokenHash = Buffer.from(token).toString('base64').substring(0, 32);
    const cacheKey = `github_repos:${tokenHash}:page:${page}:per_page:${perPage}`;

    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (redisError) {
      console.warn('Redis cache read failed, falling back to GitHub API:', redisError);
    }

    const githubRes = await fetch(`https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`, {
      headers: {
        Authorization: `Bearer ${token}`, // Assuming token is passed cleanly, wait in original code authHeader was passed which includes 'Bearer '
        Accept: 'application/vnd.github.v3+json',
      }
    });

    if (!githubRes.ok) {
      const errText = await githubRes.text();
      throw new Error(`Failed to fetch from GitHub: ${errText}`);
    }

    const data = await githubRes.json();

    try {
      await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
    } catch (redisError) {
      console.warn('Redis cache write failed, ignoring:', redisError);
    }

    return data;
  }

  async fetchBranches(token: string, owner: string, repo: string) {
    const tokenHash = Buffer.from(token).toString('base64').substring(0, 32);
    const cacheKey = `github_branches:${tokenHash}:${owner}:${repo}`;

    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (redisError) {
      console.warn('Redis cache read failed for branches:', redisError);
    }

    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      }
    });

    if (!githubRes.ok) {
      const errText = await githubRes.text();
      throw new Error(`Failed to fetch branches: ${errText}`);
    }

    const data = await githubRes.json();

    try {
      await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
    } catch (redisError) {
      console.warn('Redis cache write failed for branches:', redisError);
    }

    return data;
  }

  async initiateScan(userId: string, owner: string, repo: string, branch: string, githubToken: string) {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      throw new Error('User not found in DB');
    }
    
    if (!dbUser.openRouterKey) {
      throw new Error('OpenRouter API key is missing. Please configure it in your profile.');
    }

    const scanReport = await prisma.scanReport.create({
      data: {
        userId: dbUser.id,
        repositoryName: `${owner}/${repo}`,
        branchName: branch,
        status: 'pending',
      }
    });

    const workerUrl = process.env.WORKER_URL || 'http://localhost:3002';
    
    // send HTTP request to worker
    await fetch(`${workerUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scanReportId: scanReport.id,
        owner,
        repo,
        branch,
        githubToken,
        openRouterKey: dbUser.openRouterKey,
        aiModel: dbUser.aiModel,
      })
    }).catch(err => {
      console.error('Failed to notify worker:', err.message);
    });

    return scanReport.id;
  }
}

export const githubService = new GithubService();
