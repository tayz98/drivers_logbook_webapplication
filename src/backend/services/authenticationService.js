require("dotenv").config({
  path: require("path").join(__dirname, "..", "..", "..", ".env"),
});

const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const DRIVER_API_KEY = process.env.DRIVER_API_KEY;
const { db } = require("../mongodb");
const mongoose = require("mongoose");
const session = require("express-session");

function authenticateAdminApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }
  console.log(apiKey);
  console.log(ADMIN_API_KEY);
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next();
}

function authenticateDriverApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }
  if (apiKey !== DRIVER_API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next();
}
function authenticateSessionOrApiKey(req, res, next) {
  console.log("Authenticating session or API key");
  if (req.session && req.session.user) {
    console.log("Session is authenticated");

    return next();
  }

  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (apiKey !== ADMIN_API_KEY && apiKey !== DRIVER_API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  if (apiKey === ADMIN_API_KEY) {
    req.isAdminAuthenticated = true;
  } else {
    req.isDriverAuthenticated = true;
  }
  req.isAuthenticatedByAnyKey = true;
  next();
}
function authenticateAnyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (apiKey !== ADMIN_API_KEY && apiKey !== DRIVER_API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next();
}

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "Not authorized" });
}

module.exports = {
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  authenticateSessionOrApiKey,
  authenticateAnyApiKey,
  isAuthenticated,
};
