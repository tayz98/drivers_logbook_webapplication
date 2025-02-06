const Vehicle = require("../models/vehicle");
const express = require("express");
const router = express.Router();
const {
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  authenticateSessionOrApiKey,
} = require("../services/authenticationService");
const { loadUser } = require("../middleware/userMiddleware");
const WebUser = require("../models/webUser");

// getting all vehicles

router.get(
  "/api/vehicles",
  authenticateSessionOrApiKey,
  loadUser,
  async (req, res) => {
    try {
      if (req.isAdminAuthenticated) {
        console.log("Admin is authenticated");
        const vehicles = await Vehicle.find();
        if (!vehicles) {
          return res.status(404).json({ message: "No vehicles found" });
        }
        return res.json(vehicles);
      }
      console.log("WebUser is authenticated");
      const webUser = res.webUser;
      if (!webUser) {
        return res.status(401).json({ message: "Unauthorized Vehicle access" });
      }

      let query = {};
      // Manager: Show only the vehicle assigned to him.
      if (webUser.role === "manager") {
        if (!webUser.vehicleId) {
          return res
            .status(404)
            .json({ message: "No vehicle assigned to manager" });
        }
        query = { _id: webUser.vehicleId };

        // Dispatcher: Show all vehicles that are not assigned to any webUser.
      } else if (webUser.role === "dispatcher") {
        // Retrieve the list of all vehicle IDs that are assigned to any user.
        const assignedVehicleIds = await WebUser.find({
          vehicleId: { $exists: true, $ne: null },
        }).distinct("vehicleId");
        query = { _id: { $nin: assignedVehicleIds } };
      } else {
        // In case of an unexpected role, you can return an error or handle it accordingly.
        return res
          .status(403)
          .json({ message: "Role not authorized to view vehicles" });
      }
      const vehicles = await Vehicle.find(query);
      return res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// getting one vehicle by id
router.get("/api/vehicle/:id", getVehicle, async (req, res) => {
  res.json(res.vehicle);
});

// creating a vehicle
router.post("/api/vehicle", async (req, res) => {
  if (req.body.vin != null) {
    const findVehicle = await Vehicle.exists({ _id: req.body.vin });
    if (findVehicle) {
      return res.status(400).json({ message: "Vehicle already exists" });
    }
  }
  const vehicle = new Vehicle({
    _id: req.body.vin,
    brand: req.body.brand,
    model: req.body.model,
    year: req.body.year,
    licensePlate: req.body.licensePlate,
  });
  try {
    const newVehicle = await vehicle.save();
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// updating one vehicle by id
router.patch(
  "/api/vehicle/:id",
  getVehicle,
  authenticateSessionOrApiKey,
  async (req, res) => {
    console.log(req.body);
    if (req.body.brand != null) {
      res.vehicle.brand = req.body.brand;
    }
    if (req.body.customName != null) {
      res.vehicle.customName = req.body.customName;
    }
    if (req.body.manufacturer != null) {
      res.vehicle.manufacturer = req.body.manufacturer;
    }
    if (req.body.model != null) {
      res.vehicle.model = req.body.model;
    }
    if (req.body.year != null) {
      res.vehicle.year = req.body.year;
    }
    if (req.body.licensePlate != null) {
      res.vehicle.licensePlate = req.body.licensePlate;
    }
    try {
      const updatedVehicle = await res.vehicle.save();
      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// deleting one vehicle by id
router.delete("/api/vehicle/:id", getVehicle, async (req, res) => {
  try {
    await res.vehicle.deleteOne();
    res.json({ message: "Vehicle deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// middleware
async function getVehicle(req, res, next) {
  let vehicle;
  try {
    vehicle = await Vehicle.findById(req.params.id);
    if (vehicle == null) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.vehicle = vehicle;
  next();
}

module.exports = router;
