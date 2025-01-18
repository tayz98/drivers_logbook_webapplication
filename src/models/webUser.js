const mongoose = require("mongoose");
const Driver = require("./driver");

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
    enum: ["driver", "admin", "dispatcher", "manager"],
    // driver - basic role: can permit private trips to be viewed by dispatcher
    // admin - full access to all data
    // dispatcher - can view all business trips and manage vehicles
    // manager - a more privileged driver role
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
    required: false,
  },
});

module.exports = mongoose.model("WebUser", webUserSchema);
