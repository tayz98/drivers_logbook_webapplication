const Vehicle = require("../models/vehicleSchema");
const express = require("express");
const router = express.Router();
const {
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  authenticateSessionOrApiKey,
} = require("../services/authenticationService");
const { loadUser } = require("../middleware/userMiddleware");
const WebUser = require("../models/webUserSchema");
const { getIO } = require("../websocket");

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Retrieves all vehicles.
 *     description: Returns a list of vehicles. For admin users, all vehicles are returned; for managers and dispatchers, a filtered list is provided.
 *     tags:
 *       - Vehicles
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of vehicles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized access.
 *       404:
 *         description: No vehicles found or no vehicle assigned.
 *       500:
 *         description: Server error.
 */
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

/**
 * @swagger
 * /api/vehicle/{id}:
 *   get:
 *     summary: Retrieves a vehicle by ID.
 *     description: Returns the vehicle data corresponding to the given ID.
 *     tags:
 *       - Vehicles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID.
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Vehicle data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found.
 *       500:
 *         description: Server error.
 */
router.get(
  "/api/vehicle/:id",
  getVehicle,
  authenticateSessionOrApiKey,
  async (req, res) => {
    res.json(res.vehicle);
  }
);

/**
 * @swagger
 * /api/vehicle:
 *   post:
 *     summary: Creates a new vehicle.
 *     description: Adds a new vehicle to the database.
 *     tags:
 *       - Vehicles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vin:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               licensePlate:
 *                 type: string
 *             required:
 *               - vin
 *     responses:
 *       201:
 *         description: Vehicle created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Vehicle already exists or validation error.
 *       500:
 *         description: Server error.
 */
router.post("/api/vehicle", async (req, res) => {
  console.log(req.body);
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
    getIO().emit("vehicleCreated", newVehicle);
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/vehicle/{id}:
 *   patch:
 *     summary: Updates a vehicle.
 *     description: Updates vehicle data based on the provided ID.
 *     tags:
 *       - Vehicles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID.
 *     requestBody:
 *       description: The vehicle data to update.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               customName:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               licensePlate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation error.
 *       500:
 *         description: Server error.
 */
router.patch(
  "/api/vehicle/:id",
  getVehicle,
  authenticateSessionOrApiKey,
  async (req, res) => {
    console.log(req.body);

    // Erstelle ein Update-Objekt
    const updateData = {};

    if (req.body.brand !== undefined) {
      updateData.brand = req.body.brand;
    }
    if (req.body.customName !== undefined) {
      updateData.customName = req.body.customName;
    }
    if (req.body.manufacturer !== undefined) {
      updateData.manufacturer = req.body.manufacturer;
    }
    if (req.body.model !== undefined) {
      updateData.model = req.body.model;
    }
    if (req.body.year !== undefined) {
      if (req.body.year === null) {
        updateData.$unset = { year: "" }; // Entfernt das Feld
      } else {
        updateData.year = req.body.year;
      }
    }
    if (req.body.licensePlate !== undefined) {
      updateData.licensePlate = req.body.licensePlate;
    }

    try {
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true } // Gibt das aktualisierte Dokument zurück
      );

      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      getIO().emit("vehicleUpdated", updatedVehicle);
      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/vehicles:
 *   delete:
 *     summary: Deletes all vehicles.
 *     description: Removes all vehicles from the database. Requires admin API key.
 *     tags:
 *       - Vehicles
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: All vehicles deleted.
 *       500:
 *         description: Server error.
 */
router.delete("/api/vehicles", authenticateAdminApiKey, async (req, res) => {
  try {
    await Vehicle.deleteMany();
    res.json({ message: "All vehicles deleted from database" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/vehicle/{id}:
 *   delete:
 *     summary: Deletes a vehicle.
 *     description: Removes a vehicle by ID. Requires admin API key.
 *     tags:
 *       - Vehicles
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID.
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully.
 *       500:
 *         description: Server error.
 */
router.delete(
  "/api/vehicle/:id",
  authenticateAdminApiKey,
  getVehicle,
  async (req, res) => {
    try {
      console.log("Deleting vehicle: ", req.params.id);
      await res.vehicle.deleteOne();
      getIO().emit("vehicleDeleted", { vehicleId: req.params.id });
      res.json({ message: "Vehicle deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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
