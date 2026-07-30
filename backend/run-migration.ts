import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function execute() {
  try {
    let sql = fs.readFileSync('migrate.sql', 'utf16le');
    if (sql.charCodeAt(0) === 0xFEFF) {
      sql = sql.slice(1);
    }
    console.log('Executing SQL...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error executing migration:', err);
    process.exit(1);
  }
}
execute();
