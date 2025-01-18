const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");

// getting all trips
router.get("/trips", async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// getting one trip by id
router.get("/trip/:id", async (req, res) => {});

// creating a trip
router.post("/trip/", async (req, res) => {
  console.log(req.body);
  const trip = new Trip({
    startLocation: req.body.startLocation,
    endLocation: req.body.endLocation,
    startTimestamp: req.body.startTimestamp,
    endTimestamp: req.body.endTimestamp,
    startMileage: req.body.startMileage,
    endMileage: req.body.endMileage,
    tripCategory: req.body.tripCategory,
    tripPurpose: req.body.tripPurpose,
    tripNotes: req.body.tripNotes,
    tripStatus: req.body.tripStatus,
    driverId: req.body.driverId,
    vehicleId: req.body.vin,
  });
  try {
    const newTrip = await trip.save();
    res.status(201).json(newTrip);
    console.log("Trip created");
  } catch (error) {
    res.status(400).json({ message: error.message });
    console.log(error);
  }
});

// updating one trip by id
router.patch("/trip/:id", async (req, res) => {
  const { id } = req.params;
  res.send(`Trip ${id} updated`);
});

// deleting one trip by id
router.delete("/trip/:id", async (req, res) => {
  const { id } = req.params;
  res.send(`Trip ${id} deleted`);
});

module.exports = router;
