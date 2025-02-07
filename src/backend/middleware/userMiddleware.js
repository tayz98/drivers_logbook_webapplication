const mongoose = require("mongoose");
const WebUser = require("../models/webUserSchema");

async function loadUser(req, res, next) {
  if (
    req.isAuthenticatedByAnyKey ||
    req.isAdminAuthenticated ||
    req.isDriverAuthenticated
  ) {
    console.log("getWebUser: Skipping session check for API key");
    return next();
  }

  console.log("Printing session in getWebUser:", req.session);
  if (!req.session || !req.session.user) {
    console.log("No user in session");
    return res.status(401).json({ message: "Unauthorized User" });
  }

  let userId;
  try {
    userId = req.session.user._id;
  } catch (err) {
    console.log("Invalid user ID format:", req.session.user._id);
    return res.status(401).json({ message: "Invalid user session" });
  }

  const user = await WebUser.findById(userId).lean();
  if (!user) {
    console.log("User not found in database");
    return res.status(401).json({ message: "User account not found" });
  }

  res.webUser = user;
  next();
}

module.exports = {
  loadUser,
};
