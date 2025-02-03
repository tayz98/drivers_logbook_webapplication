require("dotenv").config();

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

function authenticateAnyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
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

// TODO: look at it again later
function restrictToOwnData(req, res, next) {
  if (req.isAdmin) {
    // Admin can update any user
    return next();
  }
  if (req.user && req.user.userId === req.params.id) {
    // User can update only their own data
    return next();
  }
  return res
    .status(403)
    .json({ message: "You are not authorized to update this user." });
}

module.exports = {
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  restrictToOwnData,
  authenticateAnyApiKey,
  isAuthenticated,
};
