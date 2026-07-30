import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected!', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error connecting:', err);
    process.exit(1);
  }
}
test();
