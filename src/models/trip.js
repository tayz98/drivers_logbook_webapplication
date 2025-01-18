const mongoose = require("mongoose");
const Vehicle = require("./vehicle");
const Driver = require("./driver");
const locationSchema = require("./location");

const tripSchema = new mongoose.Schema({
  startLocation: {
    type: locationSchema,
    required: true,
  },
  endLocation: {
    type: locationSchema,
    required: false,
  },
  startTimestamp: {
    type: Date,
    required: true,
  },
  startTimestamp: {
    type: Date,
    required: true,
  },
  startMileage: {
    type: Number,
    required: true,
  },
  endMileage: {
    type: Number,
    required: false,
  },
  tripCategory: {
    type: String,
    enum: ["business", "commute", "private"],
    required: true,
  },
  tripPurpose: {
    type: String,
    required: false,
  },
  tripNotes: {
    type: String,
    required: false,
    default: "",
  },
  tripStatus: {
    type: String,
    enum: ["finished", "cancelled"],
    required: true,
  },
  driverId: {
    type: String,
    ref: "Driver",
    validate: {
      validator: async (driverId) => {
        const driver = await Driver.exists({ _id: driverId });
        return driver !== null;
      },
      message: "Driver does not exist",
    },
    required: true,
  },
  vehicleId: {
    type: String,
    ref: "Vehicle",
    required: true,
    validate: {
      validator: async (vehicleId) => {
        const vehicle = await Vehicle.exists({ _id: vehicleId });
        return vehicle !== null;
      },
      message: "Vehicle does not exist",
    },
  },
  replacedByTripId: {
    type: String,
    ref: "Trip",
    required: false,
    validate: {
      validator: async (replacedByTripId) => {
        const trip = await Trip.exists({ _id: replacedByTripId });
        return trip !== null;
      },
      message: "Trip does not exist",
    },
  },
});

module.exports = mongoose.model("Trip", tripSchema);
