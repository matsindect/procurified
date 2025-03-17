const {
  PostgresPool,
  defaultPoolInstance,
} = require("../../dbConfig/dbConnection");

class ResourceDao {
  constructor() {
    this.pool = defaultPoolInstance.getPool();
  }

  /**
   * Get the complete lineage (ancestry chain) for a resource.
   * @param {number} resourceId - The ID of the resource.
   * @returns {Promise<number[]>} Array of ancestor IDs ordered from root to immediate parent.
   */
  async getResourceLineage(resourceId) {
    let client;
    const query = `
      WITH RECURSIVE ancestry AS (
        -- Base case: start with the immediate parent of the target resource
        SELECT 
            s.id, 
            s."parentId", 
            1 AS depth, 
            ARRAY[s.id] AS path
        FROM singleresource s
        WHERE s.id = (SELECT "parentId" FROM singleresource WHERE id = $1)
        
        UNION ALL
        
        -- Recursive case: find each ancestor's parent until reaching the root,
        -- avoiding cycles by ensuring we don't revisit nodes
        SELECT 
            s.id, 
            s."parentId", 
            a.depth + 1,
            a.path || s.id
        FROM singleresource s
        JOIN ancestry a ON s.id = a."parentId"
        WHERE s.id <> ALL(a.path)
        )
        SELECT id FROM ancestry
        ORDER BY depth DESC;
    `;

    try {
      client = await this.pool.connect();
      const result = await client.query(query, [resourceId]);
      client.release();

      return result.rows.map((row) => row.id);
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  }

  /**
   * Check if a resource with the given ID exists.
   * @param {number} parentId - The parent resource ID to check.
   * @returns {Promise<boolean>} True if the parent exists; otherwise, false.
   */
  async checkParentExists(parentId) {
    let client = await this.pool.connect();
    const query = `SELECT 1 FROM singleresource WHERE id = $1`;
    const result = await client.query(query, [parentId]);
    client.release();
    return result.rows.length > 0;
  }

  /**
   * Create a new resource with the given name and parent.
   * @param {string} name - The resource name.
   * @param {number|null} parentId - The parent resource ID (or null).
   * @returns {Promise<number>} The ID of the newly created resource.
   */
  async createResource(name, parentId = null) {
    let client = await this.pool.connect();
    const query = `
      INSERT INTO singleresource (name, "parentId")
      VALUES ($1, $2)
      RETURNING id;
    `;
    const result = await client.query(query, [name, parentId]);
    client.release();
    return result.rows[0].id;
  }

  /**
   * Update the parent of a resource.
   * @param {number} resourceId - The ID of the resource to update.
   * @param {number|null} parentId - The new parent resource ID (or null).
   * @returns {Promise<void>}
   * @throws {Error} If the resource does not exist.
   */

  async updateResourceParent(resourceId, parentId) {
    let client = await this.pool.connect();
    const query = `
        UPDATE singleresource
        SET "parentId" = $2
        WHERE id = $1;
        `;
    await client.query(query, [resourceId, parentId]);
    client.release();
  }
  /**
   * Close the connection pool.
   */
  async close() {
    await defaultPoolInstance.close();
  }
}

module.exports = ResourceDao;
