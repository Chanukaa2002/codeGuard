import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Setup Supabase Client for backend
// Need to handle potential /rest/v1/ suffix in SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL?.replace('/rest/v1/', '') || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token and get user using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Prepare user data
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.user_name || 'Anonymous';
    const avatarUrl = user.user_metadata?.avatar_url || null;
    const githubId = user.user_metadata?.provider_id || null;

    // Upsert user in Prisma database
    const dbUser = await prisma.user.upsert({
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

    res.json({ user: dbUser });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/config', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { openRouterKey: true, aiModel: true },
    });

    res.json(dbUser);
  } catch (error: any) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/config', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { openRouterKey, aiModel } = req.body;

    const dbUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        openRouterKey: openRouterKey !== undefined ? openRouterKey : undefined,
        aiModel: aiModel !== undefined ? aiModel : undefined,
      },
    });

    res.json({ message: 'Configuration updated successfully' });
  } catch (error: any) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
