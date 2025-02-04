const express = require("express");
const router = express.Router();
const Trip = require("../models/trip");
const Vehicle = require("../models/vehicle");
const { mergeTrips } = require("../services/tripService");
const { calculateTripDistance } = require("../utility");
const WebUser = require("../models/webUser");
const mongoose = require("mongoose");
const { loadUser } = require("../middleware/userMiddleware");

const {
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  authenticateAnyApiKey,
  authenticateSessionOrApiKey,
} = require("../services/authenticationService");
const vehicle = require("../models/vehicle");

// getting all trips
router.get(
  "/trips",
  authenticateSessionOrApiKey,
  loadUser,
  async (req, res) => {
    try {
      if (req.adminAuthenticated) {
        const trips = await Trip.find();
        return res.json(trips);
      }

      const webUser = res.webUser;
      if (!webUser) {
        return res.status(401).json({ message: "Unauthorized Trips access" });
      }

      const sevenDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const matchStage = { startDate: { $gte: sevenDaysAgo } };

      // Role-specific filters
      switch (webUser.role) {
        case "dispatcher":
          matchStage.tripCategory = "business";
          break;
        case "manager":
          matchStage.vehicleId = webUser.vehicleId;
          break;
        case "admin":
          break;
        default:
          return res.status(403).json({ message: "Forbidden" });
      }

      // TODO: maybe change from aggregate to find, but first need to check data-format (string/date)
      const trips = await Trip.aggregate([
        {
          $addFields: {
            startDate: { $dateFromString: { dateString: "$startTimestamp" } },
          },
        },
        { $match: matchStage },
      ]);

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

// creating a trip
router.post("/trip", authenticateAnyApiKey, async (req, res) => {
  const timestamp = new Date().toLocaleString();
  console.log(req.body);
  let vehicleId = null;
  if (req.body.vehicle) {
    const vehicleData = req.body.vehicle;
    try {
      let vehicle = await Vehicle.findOne({ _id: vehicleData.vin });
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
    startTimestamp: startTimestamp,
    endTimestamp: endTimestamp,
    startMileage: req.body.startMileage,
    endMileage: req.body.endMileage,
    tripCategory: req.body.tripCategory,
    tripPurpose: req.body.tripPurpose,
    tripNotes: req.body.tripNotes,
    tripStatus: req.body.tripStatus,
    vehicleId: vehicleData.vin ?? null,
    recorded: req.body.recorded,
  });
  if (req.body.recorded == false) {
    trip.tripNotes.push(
      `Die Fahrt konnte aufgrund technischer Probleme nicht aufgezeichnet werden und wurde am ${timestamp} nachgetragen.`
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
// TODO: rethink what is editable and what now
router.patch("/trip/:id", getTrip, async (req, res) => {
  if (!isTripEditableWithinSevenDays(res.trip)) {
    return res.status(403).json({
      message: "You are not allowed to edit trips older than 7 days!",
    });
  }

  const timestamp = new Date().toLocaleString();

  if (req.body.checked != null) {
    res.trip.checked = req.body.checked;
  }
  if (req.body.permittedPrivate != null) {
    res.trip.permittedPrivate = req.body.permittedPrivate;
  }
  if (
    req.body.tripStatus != null &&
    ["finished", "cancelled"].includes(req.body.tripStatus)
  ) {
    if (res.body.tripStatus != null) {
      res.trip.tripNotes.push(
        `Der Status wurde am ${timestamp} von *${res.body.tripStatus}* auf *${req.body.tripStatus}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Der Status *${req.body.tripStatus}* hat gefehlt und wurde am ${timestamp} nachgetragen.`
      );
    }
    res.trip.tripStatus = req.body.tripStatus;
  }
  if (req.body.startTimestamp != null) {
    if (res.body.startTimestamp != null) {
      res.trip.tripNotes.push(
        `Die Startzeit wurde am ${timestamp} von *${res.body.startTimestamp}* auf *${req.body.startTimestamp}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Die Startzeit *${req.body.startTimestamp}* wurde nicht aufgezeichnet und am ${timestamp} nachgetragen.`
      );
    }
    res.trip.startTimestamp = req.body.startTimestamp;
  }
  if (req.body.endTimestamp != null) {
    if (res.body.endTimestamp != null) {
      res.trip.tripNotes.push(
        `Die Endzeit wurde am ${timestamp} von *${res.body.endTimestamp}* auf *${req.body.endTimestamp}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Die Endzeit *${req.body.endTimestamp}* wurde nicht aufgezeichnet und am ${timestamp} nachgetragen.`
      );
    }
    res.trip.endTimestamp = req.body.endTimestamp;
  }
  if (req.body.startLocation != null) {
    if (res.body.startLocation != null) {
      res.trip.tripNotes.push(
        `Der Startstandort wurde am ${timestamp} von *${res.body.startLocation}* auf *${req.body.startLocation}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Der Startstandort *${req.body.startLocation}* wurde nicht aufgezeichnet und am ${timestamp} nachgetragen.`
      );
    }
    res.trip.startLocation = req.body.startLocation;
  }
  if (req.body.endLocation != null) {
    if (res.body.endLocation != null) {
      res.trip.tripNotes.push(
        `Der Endstandort wurde am ${timestamp} von *${res.body.endLocation}* auf *${req.body.endLocation}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Der Endstandort *${req.body.endLocation}* wurde nicht aufgezeichnet am ${timestamp} nachgetragen.`
      );
    }
    res.trip.endLocation = req.body.endLocation;
  }

  if (req.body.startMileage != null) {
    if (res.body.startMileage != null) {
      res.trip.tripNotes.push(
        `Der Startkilometerstand wurde am ${timestamp} von *${res.body.startMileage}* auf *${req.body.startMileage}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Der Startkilometerstand *${req.body.startMileage}* wurde nicht aufgezeichnet und am ${timestamp} nachgetragen.`
      );
    }
    res.trip.startMileage = req.body.startMileage;
  }
  if (req.body.endMileage != null) {
    if (res.body.endMileage != null) {
      res.trip.tripNotes.push(
        `Der EndKilometerstand wurde am ${timestamp} von *${res.body.endMileage}* auf *${req.body.endMileage}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Der Endkilometerstand *${req.body.endMileage}* nicht aufgezeichnet und am ${timestamp} nachgetragen.`
      );
    }
    res.trip.endMileage = req.body.endMileage;
  }
  if (req.body.tripCategory != null) {
    if (res.body.tripCategory != null) {
      res.trip.tripNotes.push(
        `Die Kategorie wurde am ${timestamp} von *${res.body.tripCategory}* auf *${req.body.tripCategory}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Die Kategorie ${req.body.tripCategory} hat gefehlt und wurde ${timestamp} am hinzugefügt.`
      );
    }
    res.trip.tripCategory = req.body.tripCategory;
  }
  if (req.body.tripPurpose != null) {
    if (res.trip.tripPurpose != null) {
      res.trip.tripNotes.push(
        `Der Anlass wurde am ${timestamp} von *${res.body.tripPurpose}* auf *${req.body.tripPurpose}* korrigiert.`
      );
    } else {
      res.trip.tripNotes.push(
        `Der Anlass *${req.body.tripPurpose}* wurde am ${timestamp} hinzugefügt.`
      );
    }
    res.trip.tripPurpose = req.body.tripPurpose;
  }
  if (req.body.tripNotes != null) {
    res.trip.tripNotes.push(
      `Eigene Bemerkung (${timestamp}): ${req.body.tripNotes}`
    );
  }

  try {
    const updatedTrip = await res.trip.save();
    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete multiple trips at once
router.delete("/trips", authenticateAdminApiKey, async (req, res) => {
  try {
    await Trip.deleteMany();
    res.json({ message: "All trips deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
// middleware
// TODO increase length, allow more than two trips
async function getAllTrips(req, res, next) {
  try {
    const tripIds = req.body.tripIds;

    if (!Array.isArray(tripIds) || tripIds.length !== 2) {
      return res.status(400).json({
        message: "Exactly two trip IDs must be provided and must be an array.",
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

// TODO: allow more than two trips
router.post("/merge-trips", getAllTrips, async (req, res) => {
  try {
    const trips = res.trips;
    if (trips.some((trip) => tripStatus === "incorrect")) {
      return res.status(403).json({
        message: "You are not allowed to merge invalid trips!",
      });
    }

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
router.get("/tripsInRange", async (req, res) => {
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
  let tripDate;
  if (trip.endTimestamp != null) {
    tripDate = new Date(trip.endTimestamp);
  } else if (trip.startTimestamp != null) {
    tripDate = new Date(trip.startTimestamp);
  } else {
    tripDate = trip.res.receivedDate;
  }

  if (isNaN(tripDate.getTime())) {
    throw new Error("Invalid trip end timestamp.");
  }
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const diffInMs = today.getTime() - tripDate.getTime();
  if (diffInMs > sevenDaysInMs) {
    return false; // older than 7 days
  }
  return true; // within 7 days
}

module.exports = router;
