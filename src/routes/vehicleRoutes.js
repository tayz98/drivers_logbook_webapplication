const Vehicle = require("../models/vehicle");
const express = require("express");
const router = express.Router();

// getting all vehicles

router.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// getting one vehicle by id
router.get("/vehicle/:id", getVehicle, async (req, res) => {
  res.json(res.vehicle);
});

// creating a vehicle
router.post("/vehicle", async (req, res) => {
  const vehicle = new Vehicle({
    _id: req.body.vin,
    brand: req.body.brand,
    model: req.body.model,
    year: req.body.year,
    licensePlate: req.body.licensePlate,
    driverId: req.body.driverId,
  });
  try {
    const newVehicle = await vehicle.save();
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// updating one vehicle by id
router.patch("/vehicle/:id", getVehicle, async (req, res) => {
  if (req.body.brand != null) {
    res.vehicle.brand = req.body.brand;
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
  if (req.body.driverId != null) {
    res.vehicle.driverId = req.body.driverId;
  }
  try {
    const updatedVehicle = await res.vehicle.save();
    res.json(updatedVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// deleting one vehicle by id
router.delete("/vehicle/:id", getVehicle, async (req, res) => {
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
