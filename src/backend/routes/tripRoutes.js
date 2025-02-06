const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");
const Vehicle = require("../models/vehicle");
const { mergeTrips } = require("../services/tripService");
const { formatDate } = require("../utility");
const WebUser = require("../models/webUser");
const mongoose = require("mongoose");
const { loadUser } = require("../middleware/userMiddleware");

const {
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  authenticateSessionOrApiKey,
} = require("../services/authenticationService");
const vehicle = require("../models/vehicle");

// getting all trips
router.get(
  "/api/trips",
  authenticateSessionOrApiKey,
  loadUser,
  async (req, res) => {
    try {
      const { vehicleId: queryVehicleId } = req.query;
      if (req.isAdminAuthenticated) {
        // return all trips when using api key
        const trips = await Trip.find(
          queryVehicleId ? { vehicleId: queryVehicleId } : {}
        );
        return res.json(trips);
      }

      const webUser = res.webUser;
      if (!webUser) {
        return res.status(401).json({ message: "Unauthorized Trips access" });
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const query = {
        tripCategory: "business",
        startTimestamp: { $gte: thirtyDaysAgo },
        $or: [{ markAsDeleted: false }, { markAsDeleted: { $exists: false } }],
      };

      // return trips based on user role
      // but always restrict to last 7 days
      switch (webUser.role) {
        case "dispatcher":
          query.tripCategory = "business";
          if (queryVehicleId) query.vehicleId = queryVehicleId;
          break;
        case "manager":
          query.vehicleId = webUser.vehicleId;
          break;
        case "admin":
          if (queryVehicleId) query.vehicleId = queryVehicleId;

          break;
        default:
          return res.status(403).json({ message: "Forbidden" });
      }

      const trips = await Trip.find(query);

      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// getting one trip by id
router.get("/trip/:id", getTrip, authenticateAdminApiKey, async (req, res) => {
  res.json(res.trip);
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

// creating a trip
// TODO: think about how to assign a trip without a vehicle to a vehicle
router.post("/api/trip", authenticateSessionOrApiKey, async (req, res) => {
  const timestamp = formatDate(new Date().toLocaleString());
  console.log(req.body);
  let vehicleId;
  if (req.body.vehicle && req.body.vehicle.vin !== "") {
    const vehicleData = req.body.vehicle;
    try {
      let vehicle = await Vehicle.find({ _id: vehicleData.vin });
      if (!vehicle) {
        vehicle = new Vehicle({
          _id: vehicleData.vin,
          manufacturer: vehicleData.manufacturer ?? "",
          year: vehicleData.year ?? 0,
          region: vehicleData.region ?? "",
        });
        await vehicle.save();
        console.log(`New vehicle created: ${vehicleData.vin}`);
      }
      vehicleId = vehicleData.vin;
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error checking or creating vehicle", error });
      console.log(error);
      return;
    }
  }
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
    vehicleId: vehicleId,
    recorded: req.body.recorded,
  });
  if (req.body.recorded === false) {
    trip.tripNotes.push(
      `Die Fahrt wurde aufgrund eines technischen Ausfalls nicht aufgezeichnet und am ${timestamp} nachgetragen.`
    );
  }
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
router.patch("/api/trip/:id", getTrip, async (req, res) => {
  if (!req.authenticatedBySession && !req.authenticatedByApiKey) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (!isTripEditableWithinSevenDays(res.trip)) {
    return res.status(403).json({
      message: "You are not allowed to edit trips older than 7 days!",
    });
  }

  const timestamp = formatDate(new Date().toLocaleString());

  res.trip.checked = true; // mark as checked

  if (req.body.clientCompany != null) {
    res.body.clientCompany = req.body.clientCompany;
  }

  if (req.body.client != null) {
    res.body.client = req.body.client;
  }

  if (req.body.detourNote != null) {
    res.trip.detourNote = req.body.detourNote;
  }

  if (req.body.tripCategory != null) {
    res.trip.tripNotes.push(
      `Die Kategorie wurde am ${timestamp} von *${res.body.tripCategory}* auf *${req.body.tripCategory}* korrigiert.`
    );
    res.trip.tripCategory = req.body.tripCategory;
  }

  if (req.body.tripPurpose != null) {
    res.tripPurpose = req.body.tripPurpose;
  }

  if (req.body.tripNotes != null) {
    res.trip.tripNotes.push(`${req.body.tripNotes} | (${timestamp})`);
  }

  // not possible to change data that was recorded
  // if needed, replace the current trip

  try {
    const updatedTrip = await res.trip.save();
    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete multiple trips at once
router.delete("/api/trips", authenticateAdminApiKey, async (req, res) => {
  try {
    await Trip.deleteMany();
    res.json({ message: "All trips deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// deleting one trip by id
router.delete(
  "/api/trip/:id",
  authenticateAdminApiKey,
  getTrip,
  async (req, res) => {
    try {
      if (req.isAdminAuthenticated) {
        await res.trip.deleteOne();
        res.json({ message: "Trip deleted from database" });
      } else {
        res.trip.markAsDeleted = true;
        res.json({ message: "Trip marked as deleted" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// middleware
// TODO test if working
async function getAllTrips(req, res, next) {
  try {
    const tripIds = req.body.tripIds;

    if (!Array.isArray(tripIds) || tripIds.length < 2) {
      return res.status(400).json({
        message: "Please provide at least two trip IDs to merge.",
      });
    }

    const trips = await Trip.find({ _id: { $in: tripIds } });

    if (trips.length !== tripIds.length) {
      return res.status(404).json({ message: "Some trips were not found." });
    }

    res.trips = trips;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

router.post("/api/trips/merge", getAllTrips, async (req, res) => {
  try {
    const trips = res.trips;
    // if (trips.some((trip) => tripStatus === "incorrect")) {
    //   return res.status(403).json({
    //     message: "You are not allowed to merge invalid trips!",
    //   });
    // }

    if (trips.some((trip) => !isTripEditableWithinSevenDays(trip))) {
      return res.status(403).json({
        message: "You are not allowed to merge trips older than 7 days!",
      });
    }
    const mergedTrip = await mergeTrips(res.trips);
    res.status(201).json(mergedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// for export
// TODO: check later, add authentication etc.
router.get("/api/trips/range", async (req, res) => {
  try {
    // user provides ?fromDate=...&toDate=... as query parameters
    const { fromDate, toDate } = req.query;
    // Validate query parameters if needed

    const trips = await getTripsWithinPeriod(fromDate, toDate);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function isTripEditableWithinSevenDays(trip) {
  const today = new Date();
  let tripDate = trip.startTimestamp;

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const diffInMs = today.getTime() - tripDate.getTime();
  if (diffInMs > sevenDaysInMs) {
    return false; // older than 7 days
  }
  return true; // within 7 days
}

module.exports = router;
