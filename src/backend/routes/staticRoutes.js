const express = require("express");
const path = require("path");
const { isAuthenticated } = require("../services/authenticationService");
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Serves the web portal.
 *     description: Returns the dashboard if a session exists; otherwise, returns the login page.
 *     tags:
 *       - Static Pages
 *     responses:
 *       200:
 *         description: HTML file delivered.
 */
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

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Serves the vehicles page.
 *     description: Returns the vehicles HTML page. Authentication is required.
 *     tags:
 *       - Static Pages
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: HTML file for the vehicles page.
 */
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

/**
 * @swagger
 * /report:
 *   get:
 *     summary: Serves the report page.
 *     description: Returns the report HTML page. Authentication is required.
 *     tags:
 *       - Static Pages
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: HTML file for the report page.
 */
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

/**
 * @swagger
 * /flutter_logs:
 *   get:
 *     summary: Serves the flutter logs page.
 *     description: Returns the HTML page for flutter logs.
 *     tags:
 *       - Static Pages
 *     responses:
 *       200:
 *         description: HTML file for the flutter logs page.
 */
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
