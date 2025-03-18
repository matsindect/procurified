const express = require('express');
const { setRoutes } = require('./src/routes/index');
const Migration = require('./dbConfig/runMigration');

const app = express();
const PORT = process.env.PORT || 3000;
/**
 * This is the entry point of the application.
 * It connects to the database, runs the migration, and starts the server.
 */

/**
 * Run the migration to create the database and table, if they do not exist.
 */
const migration = new Migration();
migration.run();

// Set up the express app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
setRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});