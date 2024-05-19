const { Client } = require('pg');
const express = require('express');

const app = express();

function decodeEnv(encodedValue) {
  if (!encodedValue) return null;
  const buff = Buffer.from(encodedValue, 'base64');
  return buff.toString('utf-8');
}

function connectToPostgreSQL() {
  const client = new Client({
    user: decodeEnv(process.env.POSTGRES_USER),
    host: decodeEnv(process.env.POSTGRES_HOST),
    database: decodeEnv(process.env.POSTGRES_DB),
    password: decodeEnv(process.env.POSTGRES_PASSWORD),
    port: decodeEnv(process.env.POSTGRES_PORT),
  });
  let envVar={
    user: decodeEnv(process.env.POSTGRES_USER),
    host: decodeEnv(process.env.POSTGRES_HOST),
    database: decodeEnv(process.env.POSTGRES_DB),
    password: decodeEnv(process.env.POSTGRES_PASSWORD),
    port: decodeEnv(process.env.POSTGRES_PORT),
  }
  console.log(JSON.stringify(envVar))
  client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch((err) => console.error('Connection error', err.stack));

  client.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
    console.log(err ? err.stack : res.rows[0].message);
    client.end();
  });
}


async function checkHealth() {
  try {
    // Get process memory usage
    const { rss, heapTotal, heapUsed } = process.memoryUsage();
    const memoryUsage = {
      rss: rss / (1024 * 1024), // Convert bytes to megabytes
      heapTotal: heapTotal / (1024 * 1024),
      heapUsed: heapUsed / (1024 * 1024),
    };

    // Check database connection
    connectToPostgreSQL();
    return {
      status: 'OK',
      memoryUsage,
    };
  } catch (err) {
    console.error('Health check failed:', err);
    return {
      status: 'ERROR',
      memoryUsage: null,
    };
  }

}

app.get('/health', async (req, res) => {
  try {
    const result = await checkHealth();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function runApp() {
  connectToPostgreSQL();
  setTimeout(runApp, 10000); // Run every minute (60000 milliseconds)
}

runApp();
