const express = require("express");
const staticRoutes = require("./staticRoutes");
const logRoutes = require("./logRoutes");
const tripRoutes = require("./tripRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const userRoutes = require("./webUserRoutes");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const fs = require("fs");
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     apiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         vehicleId:
 *           type: string
 *     Vehicle:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         year:
 *           type: number
 *         licensePlate:
 *           type: string
 */

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Drivers Logbook Web Application API",
      version: "1.0.0",
      description: "API documentation for the Drivers Logbook Web Application.",
    },
    servers: [
      {
        url: "http://localhost/",
        description: "Local development server",
      },
    ],
  },
  apis: [path.join(__dirname, "*.js")],
};

const swaggerSpec = swaggerJsdoc(options);
const swaggerPath = path.join(__dirname, "swagger.json");
// fs.writeFileSync(swaggerPath, JSON.stringify(swaggerSpec, null, 2));
// [2][4];

router.use(staticRoutes);
router.use(logRoutes);
router.use(tripRoutes);
router.use(vehicleRoutes);
router.use(userRoutes);
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
module.exports = router;
