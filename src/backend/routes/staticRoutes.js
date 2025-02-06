const express = require("express");
const path = require("path");
const { isAuthenticated } = require("../services/authenticationService");
const router = express.Router();

router.get("/", (req, res) => {
  if (req.session && req.session.user) {
    return res.sendFile(
      path.join(
        __dirname,
        "..",
        "..",
        "frontend",
        "protected",
        "dashboard.html"
      )
    );
  } else {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    return res.sendFile(
      path.join(__dirname, "..", "..", "frontend", "public", "index.html")
    );
  }
});

router.get("/vehicles", isAuthenticated, (req, res) => {
  return res.sendFile(
    path.join(__dirname, "..", "..", "frontend", "protected", "vehicles.html")
  );
});

router.get("/flutter_logs", (req, res) => {
  return res.sendFile(
    path.join(__dirname, "..", "..", "frontend", "public", "flutter_logs.html")
  );
});

module.exports = router;
