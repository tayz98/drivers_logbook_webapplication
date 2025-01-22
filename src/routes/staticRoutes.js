const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

router.get("/flutter_logs", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/flutter_logs.html"));
});

module.exports = router;
