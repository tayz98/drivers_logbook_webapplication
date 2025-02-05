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
    required: false,
  },
  model: {
    type: String,
    required: false,
  },
  year: {
    type: Number,
    required: false,
  },
  // TODO: field not supported yet
  // make: {
  //   type: String,
  //   required: false,
  // },
  licensePlate: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
