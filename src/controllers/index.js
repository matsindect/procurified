const ResourceDao = require("../services/resourcesDao");

class ResourceLineageController {
    constructor() {
      // Create a single instance of ResourceDao
      this.resourceDao = new ResourceDao();
    }
  
    getIndex(req, res) {
      res.send("Welcome to the Procurified ResourceLineage APIs!");
    }
  
    /**
   * Get the complete lineage (ancestry chain) for a resource
   * @param {number} resourceId - The ID of the resource to get lineage for
   * @returns {Promise<number[]>} Array of ancestor IDs ordered from root to immediate parent
   * @throws {Error} If there is an issue getting the lineage
   */
    async getResourceLineage(req, res) {
      try {
        const resourceId = req.params.id;
        const lineage = await this.resourceDao.getResourceLineage(resourceId);
        res.send({ lineage });
      } catch (error) {
        console.error("Error getting resource lineage:", error);
        res.status(500).send("Error getting resource lineage");
      }
    }
  
    /**
   * Create a new resource with the specified parent
   * @param {string} name - The name of the new resource
   * @param {number} parentId - The ID of the parent resource
   * @returns {Promise<number>} The ID of the newly created resource
   * @throws {Error} If the parent resource does not exist
   */
    async createResource(req, res) {
      try {
        const { name, parentId = null } = req.body;
  
        if (parentId) {
            // Check if the parent resource exists, to avoid orphaned resources
          const parentExists = await this.resourceDao.checkParentExists(parentId);
          // If the parent resource does not exist, return a 404 error
          if (!parentExists) {
            res.status(404).send("Parent resource not found");
            return;
          }
        }
        // Create the new resource
        const id = await this.resourceDao.createResource(name, parentId);
        res.send({ id });
      } catch (error) {
        console.error("Error creating resource:", error);
        res.status(500).send("Error creating resource");
      }
    }
    /**
     * Update the parent of a resource
     * @param {number} resourceId - The ID of the resource to update
     * @param {number} parentId - The ID of the new parent resource
     * @returns {Promise<void>}
     * @throws {Error} If the resource does not exist
     * @throws {Error} If the parent resource does not exist
     * @throws {Error} If the parent resource is the same as the resource
     * @throws {Error} If the parent resource is a descendant of the resource
     * @throws {Error} If the parent resource is a circular reference
     */

    async updateResourceParent(req, res) {
      try {
        const resourceId = req.params.id;
        const { parentId } = req.body;
  
        // Check if the resource exists
        const resourceExists = await this.resourceDao.checkParentExists(resourceId);
        if (!resourceExists) {
          res.status(404).send("Resource not found");
          return;
        }
  
        // Check if the parent resource exists
        const parentExists = await this.resourceDao.checkParentExists(parentId);
        if (!parentExists) {
          res.status(404).send("Parent resource not found");
          return;
        }
  
        // Check if the parent resource is the same as the resource
        if (resourceId === parentId) {
          res.status(400).send("Resource cannot be its own parent");
          return;
        }
  
        // Check if the parent resource is a descendant of the resource
        const lineage = await this.resourceDao.getResourceLineage(parentId);
        if (lineage.includes(resourceId)) {
          res.status(400).send("Parent resource cannot be a descendant of the resource");
          return;
        }
  
        // Check if the parent resource creates a circular reference
        const parentLineage = await this.resourceDao.getResourceLineage(parentId);
        if (parentLineage.includes(resourceId)) {
          res.status(400).send("Parent resource creates a circular reference");
          return;
        }
  
        // Update the parent resource
        await this.resourceDao.updateResourceParent(resourceId, parentId);
        res.send("Resource parent updated successfully");
      } catch (error) {
        console.error("Error updating resource parent:", error);
        res.status(500).send("Error updating resource parent");
      }
    }
  }
  
  module.exports = ResourceLineageController;