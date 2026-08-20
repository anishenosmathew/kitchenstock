import { Pool, types } from 'pg';

// Return DATE columns as plain YYYY-MM-DD strings, not JS Date objects
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err);
});

export default pool;
