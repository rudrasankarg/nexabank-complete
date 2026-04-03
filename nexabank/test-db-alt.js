const { Client } = require('pg');

async function test() {
  const url = 'postgresql://postgres:postgres@localhost:5432/nexabank_db';
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('✅ Connection Success with postgres:postgres');
  } catch (err) {
    console.log('❌ Connection Failed with postgres:postgres:', err.message);
  } finally {
    await client.end();
  }
}

test();
