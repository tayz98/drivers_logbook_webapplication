const mongoose = require("mongoose");
const Vehicle = require("./vehicle");
const Driver = require("./driver");
const locationSchema = require("./location");

const tripSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: false,
  },
  recorded: {
    type: Boolean,
    required: false,
    default: true,
  },
  checked: {
    type: Boolean,
    required: false,
    default: false,
  },
  startLocation: {
    type: locationSchema,
    required: true,
  },
  endLocation: {
    type: locationSchema,
    required: false,
  },
  startTimestamp: {
    type: String,
    required: true,
  },
  endTimestamp: {
    type: String,
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
    type: [String],
    required: false,
    default: [],
  },
  detourNote: {
    type: String,
    required: false,
    default: "",
  },
  tripStatus: {
    type: String,
    enum: ["finished", "cancelled"],
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
    type: Number,
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
  receivedDate: {
    type: Date,
    required: false,
    default: Date.now,
  },
  isInvalid: {
    type: Boolean,
    required: false,
    default: false,
  },
});

tripSchema.plugin(AutoIncrement, { id: "trip_seq", inc_field: "_id" });

module.exports = mongoose.model("Trip", tripSchema);
