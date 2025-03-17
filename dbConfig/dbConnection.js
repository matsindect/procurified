// db.js - Database connection pool module
const { Pool } = require('pg');
const {DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT} = process.env;
 
// Configure PostgreSQL connection options
const defaultConfig = {
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: DB_PORT,
};

class PostgresPool {
  constructor(config = {}) {
    // Merge default config with any provided config
    this.config = { ...defaultConfig, ...config };
    this.pool = new Pool(this.config);
    
    // Add event listeners for pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  // Get the pool instance
  getPool() {
    return this.pool;
  }

  // Execute a query
  async query(text, params) {
    return this.pool.query(text, params);
  }

  // Close the pool
  async close() {
    return this.pool.end();
  }
}

// Export a singleton instance with default config
const defaultPool = new PostgresPool();

module.exports = {
  PostgresPool,
  defaultPoolInstance:defaultPool
};