const mongoose = require("mongoose");
const Vehicle = require("./vehicle");

// TODO: add encryption for password

const webUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["manager", "admin", "dispatcher"],
    // manager - can see and manage all his trips with a specific vehicle_id
    // admin - full access to all data
    // dispatcher - can view and manage all business trips and manage vehicles
    required: true,
  },
  vehicleId: {
    type: String,
    ref: "Vehicle",
    required: false,
    validate: {
      validator: async function (v) {
        const vehicle = await Vehicle.exists({ _id: v });
        return vehicle !== null;
      },
      message: "Vehicle does not exist",
    },
  },
});

module.exports = mongoose.model("WebUser", webUserSchema);
