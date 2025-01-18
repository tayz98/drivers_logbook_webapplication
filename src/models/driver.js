const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  _id: {
    type: String, // uuid from the client
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  drivePermissions: {
    type: String,
    enum: ["business", "personal", "both"],
    required: true,
  },
});

module.exports = mongoose.model("Driver", driverSchema);
