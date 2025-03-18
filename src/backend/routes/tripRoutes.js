const express = require("express");
const router = express.Router();
const Trip = require("../models/tripSchema");
const Vehicle = require("../models/vehicleSchema");
const { mergeTrips, generateReportData } = require("../services/tripService");
const { formatDate } = require("../utility");
const WebUser = require("../models/webUserSchema");
const mongoose = require("mongoose");
const { loadUser } = require("../middleware/userMiddleware");
const { getIO } = require("../websocket");

const {
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  authenticateSessionOrApiKey,
} = require("../services/authenticationService");

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Retrieves trips.
 *     description: Returns a list of trips. Admins can view all trips. managers can only view their own vehicle's trips. dispatchers can view all business trips.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *         description: Optional filter for vehicle ID.
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of trips.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Server error.
 */
router.get(
  "/api/trips",
  authenticateSessionOrApiKey,
  loadUser,
  async (req, res) => {
    console.log("Getting all trips");
    try {
      const { vehicleId: queryVehicleId } = req.query;
      if (req.isAdminAuthenticated) {
        console.log("Admin API Key Authentication successful");

        const trips = await Trip.find(
          queryVehicleId ? { vehicleId: queryVehicleId } : {}
        );
        console.log("Trips fetched:", trips);

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

      return res.json(trips);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/trip/{id}:
 *   get:
 *     summary: Retrieves a specific trip.
 *     description: Returns a trip identified by its ID.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID.
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: A single trip.
 *       404:
 *         description: Trip not found.
 *       500:
 *         description: Server error.
 */
router.get(
  "/api/trip/:id",
  getTrip,
  authenticateSessionOrApiKey,
  async (req, res) => {
    return res.json(res.trip);
  }
);

// middleware
async function getTrip(req, res, next) {
  let trip;
  try {
    trip = await Trip.find({ _id: req.params.id });
    if (trip == null || trip.length === 0) {
      return res.status(404).json({ message: "Trip not found!" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.trip = trip[0];
  next();
}

/**
 * @swagger
 * /api/trip:
 *   post:
 *     summary: Creates a new trip.
 *     description: Creates a new trip entry.
 *     tags:
 *       - Trips
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startLocation:
 *                 type: string
 *               endLocation:
 *                 type: string
 *               startTimestamp:
 *                 type: string
 *                 format: date-time
 *               endTimestamp:
 *                 type: string
 *                 format: date-time
 *               startMileage:
 *                 type: number
 *               endMileage:
 *                 type: number
 *               tripCategory:
 *                 type: string
 *               tripPurpose:
 *                 type: string
 *               tripNotes:
 *                 type: array
 *                 items:
 *                   type: string
 *               tripStatus:
 *                 type: string
 *               recorded:
 *                 type: boolean
 *               vehicle:
 *                 type: object
 *                 properties:
 *                   vin:
 *                     type: string
 *                   manufacturer:
 *                     type: string
 *                   year:
 *                     type: number
 *                   region:
 *                     type: string
 *     responses:
 *       201:
 *         description: Trip created successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post("/api/trip", authenticateSessionOrApiKey, async (req, res) => {
  const timestamp = formatDate(new Date());
  let startTimestamp = null;
  let endTimestamp = null;
  if (req.body.startTimestamp) {
    const num = Number(req.body.startTimestamp);
    if (isNaN(num)) {
      console.log("Invalid startTimestamp:", req.body.startTimestamp);
      return res.status(400).json({ message: "Invalid startTimestamp" });
    }
    startTimestamp = new Date(num);
    console.log("Parsed startTimestamp:", startTimestamp);
  } else {
    startTimestamp = null;
  }
  if (req.body.endTimestamp) {
    const numEnd = Number(req.body.endTimestamp);
    if (isNaN(numEnd)) {
      console.log("Invalid startTimestamp:", req.body.startTimestamp);
      return res.status(400).json({ message: "Invalid startTimestamp" });
    }
    endTimestamp = new Date(numEnd);
    console.log("Parsed endTimestamp:", endTimestamp);
  } else {
    endTimestamp = null;
  }
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
        getIO().emit("vehicleCreated", vehicle);
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
    clientCompany: req.body.clientCompany,
    client: req.body.client,
    detourNote: req.body.detourNote,
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
    getIO().emit("tripCreated", newTrip);
    res.status(201).json(newTrip);
    console.log("Trip created");
  } catch (error) {
    res.status(400).json({ message: error.message });
    console.log(error);
  }
});

/**
 * @swagger
 * /api/trip/{id}:
 *   patch:
 *     summary: Updates a trip.
 *     description: Updates an existing trip. Editing is allowed only if the trip is within the permitted time span.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID.
 *     requestBody:
 *       description: Trip data to update.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tripNotes:
 *                 type: string
 *               clientCompany:
 *                 type: string
 *               client:
 *                 type: string
 *               detourNote:
 *                 type: string
 *               tripCategory:
 *                 type: string
 *               tripPurpose:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trip updated successfully.
 *       400:
 *         description: Bad request.
 *       403:
 *         description: Editing not allowed.
 *       500:
 *         description: Server error.
 */
router.patch(
  "/api/trip/:id",
  getTrip,
  authenticateSessionOrApiKey,
  async (req, res) => {
    // console.log("Trip received in patch route:" + res.trip);
    try {
      if (!isTripEditableWithinSevenDays(res.trip.startTimestamp)) {
        return res.status(403).json({
          message: "You are not allowed to edit trips older than 7 days!",
        });
      }

      const timestamp = formatDate(new Date());

      res.trip.checked = true;

      if (req.body.tripNotes != null) {
        if (req.body.tripNotes.trim() !== "") {
          res.trip.tripNotes.push(
            `${req.body.tripNotes} | Letzte Änderung: ${timestamp}`
          );
        }
      }

      if (req.body.clientCompany != null) {
        res.trip.clientCompany = req.body.clientCompany;
      }

      if (req.body.client != null) {
        res.trip.client = req.body.client;
      }

      if (req.body.detourNote != null) {
        res.trip.detourNote = req.body.detourNote;
      }

      if (req.body.tripCategory != null) {
        if (res.trip.tripCategory !== req.body.tripCategory) {
          res.trip.tripNotes.push(
            `Die Kategorie wurde am ${timestamp} von ${formatCategory(
              res.trip.tripCategory
            )} auf ${formatCategory(req.body.tripCategory)} korrigiert.`
          );
          res.trip.tripCategory = req.body.tripCategory;
        }
      }

      if (req.body.tripPurpose != null) {
        res.trip.tripPurpose = req.body.tripPurpose;
      }

      const updatedTrip = await res.trip.save();
      // getIO().emit("tripUpdated", updatedTrip);
      getIO().emit("tripsUpdated", [updatedTrip]);
      return res.json(updatedTrip);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

function formatCategory(category) {
  if (category === "business") {
    return "Dienstlich";
  } else if (category === "private") {
    return "Privat";
  } else if (category === "commute") {
    return "Arbeitsweg";
  } else {
    return "Unbekannt";
  }
}

/**
 * @swagger
 * /api/trips:
 *   delete:
 *     summary: Deletes multiple trips.
 *     description: Deletes (or marks as deleted) multiple trips by trip IDs. Requires admin API key for full deletion.
 *     tags:
 *       - Trips
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       description: Object with an array of trip IDs.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tripIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Trips deleted or marked as deleted.
 *       400:
 *         description: No trip IDs provided.
 *       500:
 *         description: Server error.
 */
router.delete(
  "/api/trips",
  authenticateSessionOrApiKey,
  getAllTrips,
  async (req, res) => {
    try {
      if (req.isAdminAuthenticated) {
        await Trip.deleteMany();
        getIO().emit("allTripsDeleted");
        return res.json({ message: "All trips deleted from database" });
      } else if (res.trips) {
        for (let trip of res.trips) {
          trip.markAsDeleted = true;
          await trip.save();
        }
        const tripIds = res.trips.map((trip) => trip._id);
        getIO().emit("tripsDeleted", tripIds);
        return res.json({ message: "Trips marked as deleted" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/trip/{id}:
 *   delete:
 *     summary: Deletes a trip.
 *     description: Deletes (or marks as deleted) a specific trip. Admins delete permanently.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID.
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Trip deleted or marked as deleted.
 *       500:
 *         description: Server error.
 */
router.delete(
  "/api/trip/:id",
  authenticateSessionOrApiKey,
  getTrip,
  async (req, res) => {
    try {
      if (req.isAdminAuthenticated) {
        await res.trip.deleteOne();
        getIO().emit("tripsDeleted", [res.trip._id]);
        return res.json({ message: "Trip deleted from database" });
      } else {
        res.trip.markAsDeleted = true;
        await res.trip.save();
        getIO().emit("tripsDeleted", [res.trip._id]);
        return res.json({ message: "Trip marked as deleted" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// middleware
async function getAllTrips(req, res, next) {
  console.log("Getting all trips");
  try {
    if (req.isAdminAuthenticated) {
      console.log("Admin API Key Authentication successful");
      const trips = await Trip.find();
      res.trips = trips;
      return next();
    }
    const tripIds = req.body.tripIds;
    if (!tripIds) {
      return res.status(400).json({ message: "No trip ids provided." });
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

/**
 * @swagger
 * /api/trips/merge:
 *   post:
 *     summary: Merges multiple trips.
 *     description: Merges the trips specified by an array of trip IDs. All trips must be editable and valid.
 *     tags:
 *       - Trips
 *     requestBody:
 *       description: Object containing an array of trip IDs.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tripIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Trips merged successfully.
 *       400:
 *         description: Bad request.
 *       403:
 *         description: Forbidden merge.
 */
router.post("/api/trips/merge", getAllTrips, async (req, res) => {
  try {
    const trips = res.trips;
    if (trips.some((trip) => trip.tripStatus === "incorrect")) {
      return res.status(403).json({
        message: "You are not allowed to merge invalid trips!",
      });
    }

    if (
      trips.some((trip) => !isTripEditableWithinSevenDays(trip.startTimestamp))
    ) {
      return res.status(403).json({
        message: "You are not allowed to merge trips older than 7 days!",
      });
    }
    const mergedTrip = await mergeTrips(res.trips);
    getIO().emit(
      "tripsDeleted",
      res.trips.map((trip) => trip._id)
    );
    getIO().emit("tripCreated", mergedTrip);
    res.status(201).json(mergedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/report:
 *   get:
 *     summary: Generates a trip report.
 *     description: Generates a report based on a date range provided as query parameters.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date.
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date.
 *     responses:
 *       200:
 *         description: Report data.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Server error.
 */
router.get("/api/report", async (req, res) => {
  try {
    // user provides ?fromDate=...&toDate=... as query parameters
    const { fromDate, toDate } = req.query;
    // Validate query parameters if needed

    const trips = await generateReportData(fromDate, toDate);
    return res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function isTripEditableWithinSevenDays(timestamp) {
  if (!timestamp) {
    console.log("Trip has no start timestamp");
    return false;
  }
  console.log("Checking if trip is editable within 7 days");
  const today = new Date();
  let tripDate = new Date(timestamp);

  if (isNaN(tripDate.getTime())) {
    console.log("Trip start timestamp is not a valid date");
    return false;
  }

  // for test purposes change to 30 days
  const sevenDaysInMs = 30 * 24 * 60 * 60 * 1000;
  console.log("sevenDaysInMs:", sevenDaysInMs); // Log 7 days in milliseconds

  const diffInMs = today.getTime() - tripDate.getTime();
  console.log("diffInMs:", diffInMs); // Log the time difference

  const isEditable = diffInMs <= sevenDaysInMs;
  console.log("isEditable:", isEditable); // Log the final boolean result
  return isEditable;
}

module.exports = router;
