# Procurified Project

This project is a Node.js application that uses Express to create a web server and connects to a PostgreSQL database.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd Procucified
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the server, run the following command:
```
npm start
```

The server will be running on `http://localhost:3000`.

## Initial setup data

The project runs an initial setup data migration to create databases and tables. This enable yout to directly start testing using the APIs
```
POST /: Create a new resource.
GET /:id: Retrieve the lineage of a specific resourc
PUT /:id: Update the parentId of a specific resource.
GET /expressions/:id: Retrieve the variable value associated with a specific calculation.
PUT /expressions/:id: Recalculate a specific expression.
```

## Database Configuration

Make sure to configure your PostgreSQL database connection in `./config.env` before starting the server.
```
DB_USER=your_db_user
DB_HOST=localhost
DB_DATABASE=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
```

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.
# Expression Calculator

This system provides a way to manage variables and calculations in a PostgreSQL database. It supports automatic recalculation of dependent calculations when variable values change.

## Features

- Variable management with automatic recalculation
- Expression evaluation with variable references
- Transaction support for safe updates
- Modular design for flexibility and reusability

## Prerequisites

- Node.js (v12 or later)
- PostgreSQL (v10 or later)
- npm packages: `pg`, `mathjs`

## Database Schema

The system uses two tables:

### variables

- `id` (integer, primary key)
- `name` (text)
- `value` (float)

### calculations

- `id` (integer, primary key)
- `name` (text)
- `expression` (text)
- `calculated_value` (float)
