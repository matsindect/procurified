const { PostgresPool, defaultPoolInstance } = require("./dbConnection");

class Migration {
  constructor() {
    // Initialize a connection pool to the default database
    this.defaultPool = new PostgresPool({
      database: "postgres",
    });
  }

  /**
   * Runs the database migration to create the 'procurifieddb' database and the 'singleresource' table.
   *
   * This function performs the following steps:
   * 1. Connects to the default PostgreSQL database.
   * 2. Checks if the 'procurifieddb' database exists.
   * 3. Creates the 'procurifieddb' database if it does not exist.
   * 4. Connects to the 'procurifieddb' database.
   * 5. Creates the 'singleresource' table if it does not exist.
   *
   * @async
   * @function run
   * @throws Will throw an error if there is an issue during the migration process.
   */
  async run() {
    let client;
    try {
      // Connect to the default PostgreSQL database
      const pool = this.defaultPool.getPool();

      // Connect to the procurifieddb database
      client = await pool.connect();
      console.log("Connected to PostgreSQL");

      // Check if the procurifieddb database exists
      const dbCheckResult = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = 'procurifieddb'"
      );

      // Create the procurifieddb database if it doesn't exist
      if (dbCheckResult.rows.length === 0) {
        console.log("Creating database procurifieddb...");
        await client.query("CREATE DATABASE procurifieddb");
        console.log("Database procurifieddb created successfully");
      } else {
        console.log("Database procurifieddb already exists");
      }

      // Release the client back to the default pool
      client.release();

      // Initialize a new connection pool to the procurifieddb database
      const procurifiedPool = defaultPoolInstance.getPool();

      // Connect to the procurifieddb database
      client = await procurifiedPool.connect();
      // Create the singleresource table if it doesn't exist
      const createSingleResourceTableQuery = `
        CREATE TABLE IF NOT EXISTS singleresource (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          "parentId" INTEGER,
          CONSTRAINT fk_parent FOREIGN KEY ("parentId") REFERENCES singleresource(id)
        )
      `;
      const createVarablesTableQuery = `
      CREATE TABLE IF NOT EXISTS variables (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value FLOAT NOT NULL
      )
    `;
      const createCalculationsTableQuery = `
      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        expression TEXT NOT NULL,
        calculated_value FLOAT
      )
    `;
      // Create the singleresource table if it doesn't exist
      await client.query(createSingleResourceTableQuery);

      // Create the variables table if it doesn't exist
      await client.query(createVarablesTableQuery);

      // Create the calculations table if it doesn't exist
      await client.query(createCalculationsTableQuery);

      console.log("Tables singleresource created successfully");

      // Release the client back to the procurifieddb pool
      client.release();

      // Set up test data
      await this.setupTestData();
      // End the procurifieddb pool
      await defaultPoolInstance.close();
      console.log("Migration completed successfully");
    } catch (err) {
      console.error("Error during migration:", err);
      if (client) {
        client.release();
      }
      process.exit(1);
    } finally {
      // End the default pool
      await this.defaultPool.close();
    }
  }
  async setupTestData() {
    try {
      
      // Initialize a new connection pool to the procurifieddb database
      const procurifiedPool = defaultPoolInstance.getPool();

      // Connect to the procurifieddb database
      let client = await procurifiedPool.connect();
      // Clear existing data
      await client.query('TRUNCATE TABLE variables, calculations RESTART IDENTITY CASCADE');
  
      // Insert sample variables
      await client.query(`
        INSERT INTO variables (id, name, value) VALUES
          (1, 'base_price', 2.5),
          (2, 'tax_rate', 0.08),
          (3, 'discount', 5.0)
      `);
  
      // Insert sample calculations
      await client.query(`
        INSERT INTO calculations (id, name, expression) VALUES
          (1, 'price_with_markup', '{ "id": 1, "name": "base_price" } + 10 * 2'),
          (2, 'price_with_tax', '{ "id": 1, "name": "base_price" } * (1 + { "id": 2, "name": "tax_rate" })'),
          (3, 'discounted_price', '{ "id": 1, "name": "base_price" } * 10 - { "id": 3, "name": "discount" }')
      `);
      // Insert sample resources
      await client.query(`
        INSERT INTO singleresource (id, name, "parentId")
        VALUES 
          (1, 'Resource A', NULL),
          (2, 'Resource B', 1),
          (3, 'Resource C', 2)
        ON CONFLICT (id) DO NOTHING;
      `);
      
      client.release();
      console.log('Test data set up successfully');
    } catch (error) {
      console.error('Error setting up test data:', error);
      throw error;
    }
  }
}

module.exports = Migration;
