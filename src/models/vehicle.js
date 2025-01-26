const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  _id: {
    // this is the VIN of the vehicle
    type: String,
    required: true,
  },
  customName: {
    type: String,
    required: false,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  make: {
    type: String,
    required: false,
  },
  licensePlate: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
