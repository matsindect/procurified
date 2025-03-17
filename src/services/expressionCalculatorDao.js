// expressionCalculator.js

const math = require("mathjs");
const { defaultPoolInstance } = require("../../dbConfig/dbConnection");

class ExpressionCalculatorDao {
  /**
   * Create a new ExpressionCalculatorDao instance
   * @param {Object} dbPool - PostgreSQL pool instance
   */
  constructor(dbPool = defaultPoolInstance.getPool()) {
    this.pool = dbPool;
  }

  /**
   * Process a calculation by ID
   * @param {number} calculationId - ID of the calculation to process
   * @returns {Promise<Object>} The calculation result
   */
  async processCalculationById(calculationId) {
    try {
      let client = await this.pool.connect();
      // Get the calculation record
      const calcQuery =
        "SELECT id, name, expression FROM calculations WHERE id = $1";

      const calcResult = await client.query(calcQuery, [calculationId]);

      if (calcResult.rows.length === 0) {
        throw new Error(`Calculation with ID ${calculationId} not found`);
      }

      const calculation = calcResult.rows[0];

      // Process the expression and get the result
      const result = await this.evaluateExpression(calculation.expression);

      // Update the calculation with the new result
      await this.updateCalculation(calculationId, result);

      client.release();
      return {
        id: calculation.id,
        name: calculation.name,
        expression: calculation.expression,
        calculatedValue: result,
      };
    } catch (error) {
      console.error(`Error processing calculation ${calculationId}:`, error);
      throw error;
    }
  }

  /**
   * Process a calculation directly
   * @param {Object} calculation - Calculation object with id, name, and expression
   * @returns {Promise<Object>} The calculation result
   */
  async processCalculation(calculation) {
    try {
      // Process the expression and get the result
      const result = await this.evaluateExpression(calculation.expression);

      // Update the calculation with the new result
      if (calculation.id) {
        await this.updateCalculation(calculation.id, result);
      }

      return {
        ...calculation,
        calculatedValue: result,
      };
    } catch (error) {
      console.error(`Error processing calculation:`, error);
      throw error;
    }
  }

  /**
   * Evaluate an expression containing variable references
   * @param {string} expression - Expression to evaluate
   * @returns {Promise<number>} The calculated result
   */
  async evaluateExpression(expression) {
    try {
      // Find all JSON snippets in the expression
      const jsonRegex = /\{[^{}]*\}/g;
      const jsonMatches = expression.match(jsonRegex) || [];

      // Create a working copy of the expression
      let processedExpression = expression;

      // Process each JSON snippet
      for (const jsonStr of jsonMatches) {
        try {
          // Parse the JSON to get variable reference
          const variableRef = JSON.parse(jsonStr);

          // Look up the variable value
          const variableValue = await this.lookupVariableValue(variableRef.id);

          // Replace the JSON snippet with the variable value
          processedExpression = processedExpression.replace(
            jsonStr,
            variableValue.toString()
          );
        } catch (jsonError) {
          console.error(`Error parsing JSON snippet ${jsonStr}:`, jsonError);
          throw new Error(`Invalid variable reference: ${jsonStr}`);
        }
      }

      // Evaluate the processed expression
      const result = math.evaluate(processedExpression);
      return result;
    } catch (error) {
      console.error(`Error evaluating expression ${expression}:`, error);
      throw error;
    }
  }

  /**
   * Look up a variable value from the variables table
   * @param {number} variableId - ID of the variable to look up
   * @returns {Promise<number>} The variable value
   */
  async lookupVariableValue(variableId) {
    try {
      let client = await this.pool.connect();
      const query = "SELECT value FROM variables WHERE id = $1";
      const result = await client.query(query, [variableId]);

      if (result.rows.length === 0) {
        throw new Error(`Variable with ID ${variableId} not found`);
      }
      client.release();
      return result.rows[0].value;
    } catch (error) {
      console.error(`Error looking up variable ${variableId}:`, error);
      throw error;
    }
  }

  /**
   * Update a calculation's calculated_value
   * @param {number} calculationId - ID of the calculation to update
   * @param {number} value - New calculated value
   * @returns {Promise<void>}
   */
  async updateCalculation(calculationId, value) {
    try {
      let client = await this.pool.connect();
      const query =
        "UPDATE calculations SET calculated_value = $1 WHERE id = $2";
      await client.query(query, [value, calculationId]);
      client.release();
    } catch (error) {
      console.error(`Error updating calculation ${calculationId}:`, error);
      throw error;
    }
  }

  /**
   * Recalculate all calculations that reference a specific variable
   * @param {number} variableId - ID of the variable that was updated
   * @returns {Promise<Array>} Array of updated calculation results
   */
  async recalculate(variableId) {
    try {
      console.log(`Recalculating calculations for variable ID ${variableId}...`);
      let client = await this.pool.connect();
      // Find all calculations that reference this variable
      // We're looking for expressions containing a JSON snippet with this variable's ID
      const jsonPattern = `%{"id": ${variableId}%`;
      const findQuery = `
        SELECT id, name, expression
        FROM calculations
        WHERE expression LIKE $1
      `;
      
      const result = await client.query(findQuery, [jsonPattern]);
      
      console.log(`Found ${result.rows.length} calculations referencing variable ID ${variableId}`);
      
      // Process each calculation
      const updatedCalculations = [];
      for (const calc of result.rows) {
        try {
          const updatedCalc = await this.processCalculationById(calc.id);
          updatedCalculations.push(updatedCalc);
        } catch (calcError) {
          console.error(`Error processing calculation ${calc.id}:`, calcError);
          // Continue with other calculations even if one fails
        }
      }
      client.release();
      return updatedCalculations;
    } catch (error) {
      console.error(`Error recalculating for variable ${variableId}:`, error);
      throw error;
    }
  }
}

module.exports = ExpressionCalculatorDao;
