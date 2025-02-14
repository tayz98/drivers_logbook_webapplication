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
        "pages",
        "dashboard.html"
      )
    );
  } else {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    return res.sendFile(
      path.join(
        __dirname,
        "..",
        "..",
        "frontend",
        "public",
        "pages",
        "index.html"
      )
    );
  }
});

router.get("/vehicles", isAuthenticated, (req, res) => {
  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "protected",
      "pages",
      "vehicles.html"
    )
  );
});

router.get("/report", isAuthenticated, (req, res) => {
  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "protected",
      "pages",
      "report.html"
    )
  );
});

router.get("/flutter_logs", (req, res) => {
  return res.sendFile(
    path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "public",
      "pages",
      "flutter_logs.html"
    )
  );
});

module.exports = router;
