const express = require("express");
const router = express.Router();
const User = require("../models/webUser");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const {
  authenticateAdminApiKey,
} = require("../services/authenticationService");
const { create } = require("../models/vehicle");
const webUser = require("../models/webUser");
const { loadUser } = require("../middleware/userMiddleware");
require("dotenv").config();

// getting all users
router.get("/api/users", authenticateAdminApiKey, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// returns the session user
router.get("/api/user/session", (req, res) => {
  console.log("GET /user/session route hit");

  if (req.session && req.session.user && req.session.cookie) {
    const expireTimestamp = Date.now() + req.session.cookie.maxAge;
    return res.json({
      user: {
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName,
        webUserId: req.session.user._id,
      },
      session: {
        expireTimestamp,
      },
    });
  }
  return res.status(401).json({ message: "Unauthorized User-Session" });
});

//getting one user by id
router.get(
  "/api/user/:id",
  authenticateAdminApiKey,
  loadUser,
  async (req, res) => {
    res.json(res.user);
  }
);

// creating a user
router.post("/api/user", authenticateAdminApiKey, async (req, res) => {
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

router.post("/api/login", async (req, res) => {
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

    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    console.log("Session set: ", req.session);

    return res.redirect("/");
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ message: error.message });
  }
});

// delete cookie when logging out
router.post("/api/logout", (req, res) => {
  console.log("Logout called");
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid", {
      path: "/",
      sameSite: "Lax",
      httpOnly: false,
      secure: false,
    });
    console.log("Session destroyed");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// updating one user by id e.g. changing password
router.patch("/api/user/:id", loadUser, async (req, res) => {
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
  "/api/user/:id",
  loadUser,
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

module.exports = router;
