const { createClient } = require('redis');

let client = null;

async function connectRedis() {
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) return new Error('Redis max retries exceeded');
        return Math.min(retries * 100, 3000);
      }
    }
  });

  client.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Redis error (non-fatal):', err.message);
    }
  });

  try {
    await client.connect();
  } catch (err) {
    console.warn('⚠️  Redis unavailable, using in-memory fallback');
    client = null;
  }
}

// In-memory fallback for dev without Redis
const memStore = new Map();

async function setEx(key, seconds, value) {
  if (!client) {
    memStore.set(key, { value, exp: Date.now() + seconds * 1000 });
    return;
  }
  await client.setEx(key, seconds, typeof value === 'object' ? JSON.stringify(value) : value);
}

async function get(key) {
  if (!client) {
    const item = memStore.get(key);
    if (!item) return null;
    if (Date.now() > item.exp) { memStore.delete(key); return null; }
    return item.value;
  }
  return await client.get(key);
}

async function del(key) {
  if (!client) { memStore.delete(key); return; }
  await client.del(key);
}

async function exists(key) {
  if (!client) return memStore.has(key);
  return await client.exists(key);
}

module.exports = { connectRedis, setEx, get, del, exists };
