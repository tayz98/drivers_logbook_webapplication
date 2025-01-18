const express = require("express");
const staticRoutes = require("./staticRoutes");
const logRoutes = require("./logRoutes");
const tripRoutes = require("./tripRoutes");
const router = express.Router();

router.use("/", staticRoutes);
router.use("/", logRoutes);
router.use("/", tripRoutes);

module.exports = router;
