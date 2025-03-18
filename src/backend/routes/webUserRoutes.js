const express = require("express");
const router = express.Router();
const User = require("../models/webUserSchema");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const {
  authenticateAdminApiKey,
  authenticateSessionOrApiKey,
} = require("../services/authenticationService");
const { loadUser } = require("../middleware/userMiddleware");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     apiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         vehicleId:
 *           type: string
 */

// getting all users
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieves all users.
 *     description: Returns a list of all users. Requires admin API key.
 *     tags:
 *       - Users
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error.
 */
router.get("/api/users", authenticateAdminApiKey, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.delete("/api/users/", authenticateAdminApiKey, async (req, res) => {
//   try {
//     await User.deleteMany();
//     res.json({ message: "Deleted all users" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// returns the session user
/**
 * @swagger
 * /api/user/session:
 *   get:
 *     summary: Retrieves the session user.
 *     description: Returns the currently authenticated user's session data.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Session user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     webUserId:
 *                       type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     expireTimestamp:
 *                       type: number
 *       401:
 *         description: Unauthorized User-Session.
 */
router.get("/api/user/session", (req, res) => {
  console.log("GET /user/session route hit");

  if (req.session && req.session.user && req.session.cookie) {
    let expireTimestamp;
    if (req.session.cookie.expires) {
      console.log("test");
      expireTimestamp = req.session.cookie.expires.getTime();
    } else {
      console.log("test2");
      expireTimestamp = Date.now() + req.session.cookie.maxAge;
    }

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
/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Retrieves a user by ID.
 *     description: Returns a specific user based on their ID. Requires admin API key.
 *     tags:
 *       - Users
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID.
 *     responses:
 *       200:
 *         description: A user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 */
router.get(
  "/api/user/:id",
  authenticateAdminApiKey,
  loadUser,
  async (req, res) => {
    res.json(res.user);
  }
);

// creating a user
/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Creates a new user.
 *     description: Creates a new user. Requires admin API key.
 *     tags:
 *       - Users
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request.
 */
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

/**
 * @swagger
 * /api/user/{id}:
 *   patch:
 *     summary: Updates a user.
 *     description: Updates user data. The authenticated user can update their own data.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 */
router.patch("/api/user/:id", loadUser, async (req, res) => {
  // check if session id is same as endpoint user id
  if (req.session.user._id !== req.params.id) {
    return res.status(401).json({ message: "Unauthorized User" });
  }
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

/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     summary: Deletes a user.
 *     description: Deletes a user by ID. Requires admin API key.
 *     tags:
 *       - Users
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to delete.
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       500:
 *         description: Server error.
 */
router.delete("/api/user/:id", authenticateAdminApiKey, async (req, res) => {
  // check if session id is same as endpoint user id
  if (req.session.user._id !== req.params.id) {
    return res.status(401).json({ message: "Unauthorized User" });
  }
  try {
    await res.user.deleteOne();
    res.json({ message: "Deleted user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Authenticates a user.
 *     description: Logs in a user using username and password. On success, a session is created.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       302:
 *         description: Redirects to home on successful login.
 *       400:
 *         description: Missing username or password.
 *       401:
 *         description: Invalid username or password.
 *       500:
 *         description: Server error.
 */
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
      role: user.role,
      vehicleId: user.vehicleId,
    };
    console.log("Session set: ", req.session);
    console.log("User logged in: ", req.session.user);

    return res.redirect("/");
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ message: error.message });
  }
});

// delete cookie when logging out
/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Logs out the current user.
 *     description: Destroys the user session and clears the session cookie.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *       500:
 *         description: Logout failed.
 */
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
