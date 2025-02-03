const express = require("express");
const staticRoutes = require("./staticRoutes");
const logRoutes = require("./logRoutes");
const tripRoutes = require("./tripRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const userRoutes = require("./webUserRoutes");
const router = express.Router();

// router.use("/", staticRoutes);
// router.use("/", logRoutes);
// router.use("/", tripRoutes);
// router.use("/", vehicleRoutes);
// router.use("/", userRoutes);
router.use(staticRoutes);
router.use(logRoutes);
router.use(tripRoutes);
router.use(vehicleRoutes);
router.use(userRoutes);

module.exports = router;
