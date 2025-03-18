const express = require("express");
const IndexController = require("../controllers/index");
const ExpressionsController = require("../controllers/expressions.controller");

/**
 * Sets up the routes for the application.
 *
 * @param {Object} app - The Express application instance.
 *
 * @description
 * This function initializes the routes for the application by creating a router instance,
 * defining route handlers for various endpoints, and binding the appropriate controller methods.
 * The routes include:
 * - GET and POST requests to the root path ("/") handled by IndexController.
 * - GET and PUT requests to the path with an ID parameter ("/:id") handled by IndexController.
 * - GET and PUT requests to the path with an ID parameter under "expressions" ("/expressions/:id") handled by ExpressionsController.
 *
 * @example
 * const express = require('express');
 * const app = express();
 * setRoutes(app);
 */
const setRoutes = (app) => {
  const router = express.Router();
  const indexController = new IndexController();
  const expressionsController = new ExpressionsController();

  router
    .route("/")
    .get(indexController.getIndex.bind(indexController))
    .post(indexController.createResource.bind(indexController));
  router
    .route("/:id")
    .get(indexController.getResourceLineage.bind(indexController))
    .put(indexController.updateResourceParent.bind(indexController));

  router
    .route("/expressions/:id")
    .get(expressionsController.getAllExpressions.bind(expressionsController))
    .put(expressionsController.recalculateCalculation.bind(expressionsController));
    router
    .route("/expressions")
    .post(expressionsController.updateVariableValue.bind(expressionsController));

  app.use("/", router);
};

module.exports = { setRoutes };
