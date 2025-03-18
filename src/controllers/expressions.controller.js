const express = require('express');
const ExpressionCalculatorDao = require('../services/expressionCalculatorDao');

/**
 * Expressions controller
 * @module controllers/expressions
 */

class ExpressionsController {
    constructor() {
        // Initialize the expressions DAO
        this.expressionsDao = new ExpressionCalculatorDao();
    }

    /**
     * Retrieves all expressions for a given calculation ID.
     * 
     * @param {Object} req - The request object.
     * @param {Object} req.params - The parameters of the request.
     * @param {string} req.params.id - The ID of the calculation to process.
     * @param {Object} res - The response object.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @throws {Error} - If there is an error processing the calculation.
     */
    async getAllExpressions(req, res) {
        try {
            // Extract the calculation ID from the request parameters
            const calulationId = req.params.id;
            
            // Process the calculation by ID using the DAO and get the result
            const result = await this.expressionsDao.processCalculationById(calulationId);
            
            // Send the result back to the client
            res.send(result);
        } catch (error) {
            // Send an error response if there is an issue processing the calculation
            res.status(500).send('Error processing calculation');
        }
    }

    /**
     * Process a calculation directly
     * 
     * @param {Object} req - The request object.
     * @param {Object} req.body - The body of the request.
     * @param {Object} req.body.calculation - The calculation object with id, name, and expression.
     * @param {Object} res - The response object.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @throws {Error} - If there is an error processing the calculation.
     */
    async processCalculation(req, res) {
        try {
            // Extract the calculation object from the request body
            const { calculation } = req.body;

            // Process the calculation using the DAO and get the result
            const result = await this.expressionsDao.processCalculation(calculation);

            // Send the result back to the client
            res.send(result);
        } catch (error) {
            // Send an error response if there is an issue processing the calculation
            res.status(500).send('Error processing calculation');
        }
    }

    /**
     * Update the value of the variable with the specified ID
     */

    async updateVariableValue(req, res) {
        try {
            // Extract the variable ID and new value from the request body
            const { id, value } = req.body;

            // Update the variable value using the DAO
            await this.expressionsDao.updateVariableValue(id, value);

            // Send a success response back to the client
            res.send('Variable updated successfully');
        } catch (error) {
            // Send an error response if there is an issue updating the variable value
            res.status(500).send('Error updating variable value');
        }
    }

    /**
     * Recalculate all calculations that reference a specific variable
     */
    
    async recalculateCalculation(req, res) {
        try {
            // Extract the calculation ID from the request parameters
            const calculationId = req.params.id;

            // Process the calculation by ID using the DAO and get the result
            const result = await this.expressionsDao.recalculate(calculationId);

            // Send the result back to the client
            res.send(result);
        } catch (error) {
            // Send an error response if there is an issue processing the calculation
            res.status(500).send('Error processing calculation');
        }
    }
}

module.exports = ExpressionsController