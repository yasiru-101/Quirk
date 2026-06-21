const { Client } = require('pg');
require('dotenv').config();

const TIMEOUT_MS = 10000;

async function testConnection(label, connString) {
  console.log(`\n--- ${label} ---`);
  console.log('URL:', connString.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: TIMEOUT_MS,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db');
    console.log('✅ Connected!', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

(async () => {
  const txPooler = process.env.DATABASE_URL;
  const sessionPooler = txPooler
    .replace(':6543/', ':5432/')
    .replace('?pgbouncer=true', '');

  await testConnection('Transaction Pooler (port 6543)', txPooler);
  await testConnection('Session Pooler (port 5432)', sessionPooler);

  // Also try without SSL
  console.log('\n--- Transaction Pooler (port 6543, NO SSL) ---');
  const client3 = new Client({
    connectionString: txPooler,
    ssl: false,
    connectionTimeoutMillis: TIMEOUT_MS,
  });
  try {
    await client3.connect();
    const res = await client3.query('SELECT NOW()');
    console.log('✅ Connected (no SSL)!', res.rows[0]);
    await client3.end();
  } catch (err) {
    console.error('❌ Failed (no SSL):', err.message);
  }

  console.log('\nDiagnostics complete.');
  process.exit(0);
})();
