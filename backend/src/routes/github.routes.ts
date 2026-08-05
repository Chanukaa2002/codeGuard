import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { redis } from '../utils/redis';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabaseUrl = process.env.SUPABASE_URL?.replace('/rest/v1/', '') || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/repos', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    // Optional query params
    const page = req.query.page || '1';
    const perPage = req.query.per_page || '10';
    
    // We can extract a unique key for caching based on the token + page
    // Since the token identifies the user, this is safe for per-user caching
    // Note: In production, hashing the token is safer for cache keys.
    const tokenHash = Buffer.from(authHeader).toString('base64').substring(0, 32);
    const cacheKey = `github_repos:${tokenHash}:page:${page}:per_page:${perPage}`;

    // Check Redis cache first, but gracefully fallback if Redis is down
    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (redisError) {
      console.warn('Redis cache read failed, falling back to GitHub API:', redisError);
    }

    // If not in cache, fetch from GitHub
    const githubRes = await fetch(`https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/vnd.github.v3+json',
      }
    });

    if (!githubRes.ok) {
      const errText = await githubRes.text();
      return res.status(githubRes.status).json({ error: 'Failed to fetch from GitHub', details: errText });
    }

    const data = await githubRes.json();

    // Store in Redis (cache for 5 minutes) - gracefully handle if Redis is down
    try {
      await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
    } catch (redisError) {
      console.warn('Redis cache write failed, ignoring:', redisError);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error in /api/github/repos:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
  }
});

// Fetch branches for a specific repository
router.get('/repos/:owner/:repo/branches', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const { owner, repo } = req.params;
    
    const tokenHash = Buffer.from(authHeader).toString('base64').substring(0, 32);
    const cacheKey = `github_branches:${tokenHash}:${owner}:${repo}`;

    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (redisError) {
      console.warn('Redis cache read failed for branches:', redisError);
    }

    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/vnd.github.v3+json',
      }
    });

    if (!githubRes.ok) {
      const errText = await githubRes.text();
      return res.status(githubRes.status).json({ error: 'Failed to fetch branches', details: errText });
    }

    const data = await githubRes.json();

    try {
      await redis.set(cacheKey, JSON.stringify(data), 'EX', 300); // 5 mins cache
    } catch (redisError) {
      console.warn('Redis cache write failed for branches:', redisError);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error in /api/github/repos/branches:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
  }
});

// Trigger a security scan
router.post('/repos/:owner/:repo/scan', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const supabaseToken = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseToken);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found in DB' });
    }
    
    if (!dbUser.openRouterKey) {
      return res.status(400).json({ error: 'OpenRouter API key is missing. Please configure it in your profile.' });
    }

    const { branch, githubToken } = req.body;
    const { owner, repo } = req.params;

    if (!branch || !githubToken) {
      return res.status(400).json({ error: 'Missing branch or githubToken in request body' });
    }

    // create ScanReport
    const scanReport = await prisma.scanReport.create({
      data: {
        userId: dbUser.id,
        repositoryName: `${owner}/${repo}`,
        branchName: branch,
        status: 'pending',
      }
    });

    // send HTTP request to worker
    await fetch('http://localhost:3002/process', {
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

    res.json({ message: 'Scan initiated', reportId: scanReport.id });
  } catch (error: any) {
    console.error('Error initiating scan:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
  }
});

export default router;
