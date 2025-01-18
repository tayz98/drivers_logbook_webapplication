const mongoose = require("mongoose");
const Driver = require("./driver");

const vehicleSchema = new mongoose.Schema({
  _id: {
    // this is the VIN of the vehicle
    type: String,
    required: true,
  },
  brand: {
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
  licensePlate: {
    type: String,
    required: false,
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
    required: false, // only some people own a vehicle, others are shared
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
