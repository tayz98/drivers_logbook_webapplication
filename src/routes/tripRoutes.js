const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");
const { mergeTrips } = require("../services/tripService");

// TODO: implement authentication middleware

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
router.get("/trip/:id", getTrip, async (req, res) => {
  res.json(res.trip);
});

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
router.patch("/trip/:id", getTrip, async (req, res) => {
  if (req.body.startLocation != null) {
    res.trip.startLocation = req.body.startLocation;
    res.trip.tripNotes +=
      "Start-Standort wurde von " +
      res.trip.startLocation +
      " auf " +
      req.body.startLocation +
      " geändert.";
  }
  if (req.body.endLocation != null) {
    res.trip.endLocation = req.body.endLocation;
    res.trip.tripNotes +=
      "End-Standort wurde von " +
      res.trip.endLocation +
      " auf " +
      req.body.endLocation +
      " geändert.";
  }

  if (req.body.startMileage != null) {
    res.trip.startMileage = req.body.startMileage;
    res.trip.tripNotes +=
      "Start-Kilometerstand wurde von " +
      res.trip.startMileage +
      " auf " +
      req.body.startMileage +
      " geändert.";
  }
  if (req.body.endMileage != null) {
    res.trip.endMileage = req.body.endMileage;
    res.trip.tripNotes +=
      "End-Kilometerstand wurde von " +
      res.trip.endMileage +
      " auf " +
      req.body.endMileage +
      " geändert.";
  }
  if (req.body.tripCategory != null) {
    res.trip.tripCategory = req.body.tripCategory;
    res.trip.tripNotes +=
      "Kategorie wurde von " +
      res.trip.tripCategory +
      " auf " +
      req.body.tripCategory +
      " geändert.";
  }
  if (req.body.tripPurpose != null) {
    res.trip.tripPurpose = req.body.tripPurpose;
    res.trip.tripNotes +=
      "Zweck wurde von " +
      res.trip.tripPurpose +
      " auf " +
      req.body.tripPurpose +
      " geändert.";
  }
  if (req.body.tripNotes != null) {
    res.trip.tripNotes += " " + req.body.tripNotes;
  }
  if (req.body.vehicleId != null) {
    res.trip.vehicleId = req.body.vehicleId;
    res.trip.tripNotes +=
      "Fahrzeug wurde von " +
      res.trip.vehicleId +
      " auf " +
      req.body.vehicleId +
      " geändert.";
  }
  try {
    const updatedTrip = await res.trip.save();
    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// deleting one trip by id
router.delete("/trip/:id", getTrip, async (req, res) => {
  try {
    await res.trip.deleteOne();
    res.json({ message: "Trip deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// middleware
async function getTrip(req, res, next) {
  let trip;
  try {
    trip = Trip.findById(req.params.id);
    if (trip == null) {
      return res.status(404).json({ message: "Trip not found!" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.trip = trip;
  next();
}

// merge two trips
router.post("/merge-trips", async (req, res) => {
  try {
    const { tripIds, newTripData } = req.body;
    if (!Array.isArray(tripIds) || tripIds.length != 2) {
      return res
        .status(400)
        .json({ message: "Two trip IDs are required for merging" });
    }

    const mergedTrip = await mergeTrips(tripIds, newTripData);
    res.status(201).json(mergedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
