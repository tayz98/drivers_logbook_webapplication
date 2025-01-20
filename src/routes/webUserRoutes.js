const express = require("express");
const router = express.Router();
const User = require("../models/webUser");
const {
  authorize,
  authToken,
  restrictToOwnData,
  authenticateAdminApiKey,
  authenticateAdminApiKey,
  RefreshToken,
} = require("../services/authenticationService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authenticateAdminApiKey } = require("../services/apiKeyService");
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

// creating a user
router.post("/user", authenticateAdminApiKey, async (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
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
    const accessToken = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    const newRefreshToken = new RefreshToken({
      token: refreshToken,
      userId: user._id,
    });

    await newRefreshToken.save();

    res.json({ accessToken: accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/token", async (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token is missing." });

  // Check if token exists in the database
  const storedToken = await RefreshToken.findOne({ token: refreshToken });
  if (!storedToken)
    return res.status(403).json({ message: "Invalid refresh token." });

  // Verify the token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Token expired or invalid." });

    const accessToken = generateAccessToken({
      userId: user._id,
      username: user.username,
    });
    res.json({ accessToken });
  });
});

app.delete("/logout", async (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken) return res.sendStatus(401);

  // Delete token from the database
  await RefreshToken.deleteOne({ token: refreshToken });

  res.sendStatus(204);
});

// updating one user by id
router.patch(
  "/user/:id",
  getUser,
  authorize,
  restrictToOwnData,
  async (req, res) => {
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
  }
);

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
