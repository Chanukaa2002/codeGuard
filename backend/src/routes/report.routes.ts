import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { redis } from '../utils/redis';

const router = Router();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabaseUrl = process.env.SUPABASE_URL?.replace('/rest/v1/', '') || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all reports for the authenticated user
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = user.id;

    // Check Redis Cache
    const cacheKey = `reports:user:${userId}`;
    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (redisError) {
      console.warn('Redis cache read failed for reports:', redisError);
    }

    // Fetch from database
    const reports = await prisma.scanReport.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Save to Redis (cache for 1 minute)
    try {
      await redis.set(cacheKey, JSON.stringify(reports), 'EX', 60);
    } catch (redisError) {
      console.warn('Redis cache write failed for reports:', redisError);
    }

    return res.json(reports);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
  }
});

// Get a specific report by ID
router.get('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const reportId = req.params.id;
    const report = await prisma.scanReport.findUnique({
      where: {
        id: reportId,
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
  }
});

// Delete a specific report by ID
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const reportId = req.params.id;
    const report = await prisma.scanReport.findUnique({
      where: {
        id: reportId,
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.scanReport.delete({
      where: {
        id: reportId,
      },
    });

    // Invalidate cache
    try {
      await redis.del(`reports:user:${user.id}`);
    } catch (redisError) {
      console.warn('Redis cache delete failed:', redisError);
    }

    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
  }
});

export default router;
