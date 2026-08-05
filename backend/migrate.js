require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ScanReport" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "repositoryName" TEXT NOT NULL,
        "branchName" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "issuesFound" INTEGER NOT NULL DEFAULT 0,
        "score" INTEGER NOT NULL DEFAULT 100,
        "summary" TEXT,
        "details" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ScanReport_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Created ScanReport table');

    await pool.query(`
      ALTER TABLE "ScanReport" ADD CONSTRAINT "ScanReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `).catch(e => console.log('FK already exists or error:', e.message));

    await pool.query(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "openRouterKey" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiModel" TEXT DEFAULT 'google/gemini-2.5-flash';
    `);
    console.log('Updated User table');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
migrate();
