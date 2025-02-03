const express = require("express");
const router = express.Router();
const User = require("../models/webUser");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const jwt = require("jsonwebtoken");
const {
  authenticateAdminApiKey,
} = require("../services/authenticationService");
const { create } = require("../models/vehicle");
require("dotenv").config();

// getting all users
router.get("/users", authenticateAdminApiKey, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// getting one user by id
router.get("/user/:id", authenticateAdminApiKey, getUser, async (req, res) => {
  res.json(res.user);
});

router.get("/user", async (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
    });
  }
  return res.status(401).json({ message: "Not authorized" });
});

router.get("/session-info", (req, res) => {
  if (req.session && req.session.cookie) {
    const expireTimestamp = Date.now() + req.session.cookie.maxAge;
    res.json({ expireTimestamp });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

// creating a user
router.post("/user", authenticateAdminApiKey, async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  const user = new User({
    username: req.body.username,
    password: hashedPassword,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    role: req.body.role,
    vehicleId: req.body.vehicleId,
  });
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// TODO: anmeldung sitzungsbasiert (kann ablaufen)

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Missing username or password" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare password with the hashed version in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.user = user;
    console.log("Session set: ", req.session);

    return res.redirect("/");
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ message: error.message });
  }
});

// delete cookie when logging out
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// updating one user by id e.g. changing password
router.patch("/user/:id", getUser, async (req, res) => {
  if (req.body.username != null) {
    res.user.username = req.body.username;
  }
  if (req.body.password != null) {
    res.user.password = req.body.password;
  }
  if (req.body.email != null) {
    res.user.email = req.body.email;
  }
  if (req.body.role != null) {
    res.user.role = req.body.role;
  }
  if (req.body.vehicleId != null) {
    res.user.vehicleId = req.body.vehicleId;
  }
  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete(
  "/user/:id",
  getUser,
  authenticateAdminApiKey,
  async (req, res) => {
    try {
      await res.user.deleteOne();
      res.json({ message: "Deleted user" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// middleware
async function getUser(req, res, next) {
  let user;
  try {
    user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  res.user = user;
  next();
}

module.exports = router;
