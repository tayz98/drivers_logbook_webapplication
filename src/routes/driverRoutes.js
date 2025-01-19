const express = require("express");
const router = express.Router();
const Driver = require("../models/driver");
const {
  authMiddleware,
  roleCheck,
} = require("../services/authenticationService");

router.use(authMiddleware);
// getting all drivers
router.get("/drivers", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// getting one driver by id
router.get("/driver/:id", getDriver, async (req, res) => {
  res.json(res.driver);
});

// creating a driver
router.post("/driver", async (req, res) => {
  let existingDriver = await Driver.findOne({ _id: req.body._id });
  if (existingDriver) {
    return res.status(400).json({ message: "Driver already exists" });
  }
  const driver = new Driver({
    _id: req.body._id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    drivePermissions: req.body.drivePermissions,
  });
  try {
    const newDriver = await driver.save();
    res.status(201).json(newDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// middleware
async function getDriver(req, res, next) {
  let driver;
  try {
    driver = await Driver.findById(req.params.id);
    if (driver == null) {
      return res.status(404).json({ message: "Driver not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.driver = driver;
  next();
}

// updating one driver
router.patch("/driver/:id", getDriver, async (req, res) => {
  if (req.body.firstName != null) {
    res.driver.firstName = req.body.firstName;
  }
  if (req.body.lastName != null) {
    res.driver.lastName = req.body.lastName;
  }
  if (
    req.body.drivePermissions != null &&
    ["business", "personal", "both"].includes(req.body.drivePermissions)
  ) {
    res.driver.drivePermissions = req.body.drivePermissions;
  }
  try {
    const updatedDriver = await res.driver.save();
    res.json(updatedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// deleting one driver by id
router.delete(
  "/driver/:id",
  getDriver,
  roleCheck(["admin"]),
  async (req, res) => {
    try {
      await res.driver.deleteOne();
      res.json({ message: "Driver deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
