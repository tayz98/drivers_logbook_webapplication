const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const DRIVER_API_KEY = process.env.DRIVER_API_KEY;
const { db } = require("../mongodb");
const mongoose = require("mongoose");

function authenticateAdminApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"]; // Custom header for API key
  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }
  console.log(apiKey);
  console.log(ADMIN_API_KEY);
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next(); // API key is valid, proceed to the next middleware or route
}

function authenticateDriverApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"]; // Custom header for API key
  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }
  if (apiKey !== DRIVER_API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next(); // API key is valid, proceed to the next middleware or route
}

function authenticateAnyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"]; // Custom header for API key
  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }
  if (apiKey !== ADMIN_API_KEY && apiKey !== DRIVER_API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next(); // API key is valid, proceed to the next middleware or route
}

function authToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token invalid or expired." });
    }
    req.user = decoded;
    next();
  });
}

async function authorize(req, res, next) {
  const apiKey = req.headers["x-api-key"]; // Admin API key
  const authHeader = req.headers["authorization"]; // Bearer Token

  if (apiKey && apiKey === API_KEY) {
    // Admin API key is valid
    req.isAdmin = true;
    return next();
  } else if (authHeader) {
    const token = authHeader.split(" ")[1]; // Extract token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
      }
      req.isAdmin = false;
      req.user = decoded;
      return next();
    });
  } else {
    return res.status(401).json({ message: "Unauthorized access." });
  }
}

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

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, expires: "150d" },
});

const RefreshToken = db.model("RefreshToken", refreshTokenSchema);

module.exports = {
  authToken,
  authenticateAdminApiKey,
  authenticateDriverApiKey,
  authorize,
  restrictToOwnData,
  authenticateAnyApiKey,
  RefreshToken,
};
