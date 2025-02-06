const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").join(__dirname, "..", "..", ".env"),
});

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = { db };
