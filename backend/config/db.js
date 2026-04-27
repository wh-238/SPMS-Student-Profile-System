const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const rawDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = rawDatabaseUrl
  ? rawDatabaseUrl.trim().replace(/^['\"]|['\"]$/g, '')
  : '';

if (databaseUrl) {
  console.log('DB config: using DATABASE_URL');
} else {
  console.warn(
    `DB config: DATABASE_URL is missing, fallback to DB_HOST=${process.env.DB_HOST || '(pg default localhost)'}`
  );
}

const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
);

module.exports = pool;
