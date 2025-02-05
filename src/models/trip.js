const mongoose = require("mongoose");
const Vehicle = require("./vehicle");
const locationSchema = require("./location");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const Trip = require("./trip");

const tripSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: false,
  },
  // if a trip is created manually
  recorded: {
    type: Boolean,
    required: false,
    default: true,
  },
  // if a trip has been checked
  checked: {
    type: Boolean,
    required: false,
    default: false,
  },
  startLocation: {
    type: locationSchema,
    required: false,
  },
  endLocation: {
    type: locationSchema,
    required: false,
  },
  startTimestamp: {
    type: Date,
    required: true,
  },
  endTimestamp: {
    type: Date,
    required: true,
  },
  startMileage: {
    type: Number,
    required: false,
  },
  endMileage: {
    type: Number,
    required: false,
  },
  markAsDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
  tripCategory: {
    type: String,
    enum: ["business", "commute", "private"],
    required: true,
  },
  // purpose of the trip, e.g. meeting, customer visit, etc.
  tripPurpose: {
    type: String,
    required: false,
  },
  // every later change of the trip data is stored in the trip notes
  tripNotes: {
    type: [String],
    required: false,
    default: [],
  },
  clientCompany: {
    type: String,
    required: false,
  },
  client: {
    type: String,
    required: false,
  },
  // comment if a detour was taken during the trip
  detourNote: {
    type: String,
    required: false,
    default: "",
  },
  // trips can be recorded as completed or incorrect
  // completed = all trip data is correct
  // incorrect = missing data
  tripStatus: {
    type: String,
    enum: ["completed", "incorrect"],
    required: true,
  },
  // every trip belongs to a vehicle
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
  // trips that are merged or replaced by another trip
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
});

tripSchema.plugin(AutoIncrement, { id: "trip_seq", inc_field: "_id" });

module.exports = mongoose.model("Trip", tripSchema);
