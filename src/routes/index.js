const express = require("express");
const staticRoutes = require("./staticRoutes");
const logRoutes = require("./logRoutes");
const tripRoutes = require("./tripRoutes");
const driverRoutes = require("./driverRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const router = express.Router();

router.use("/", staticRoutes);
router.use("/", logRoutes);
router.use("/", tripRoutes);
router.use("/", vehicleRoutes);

module.exports = router;
