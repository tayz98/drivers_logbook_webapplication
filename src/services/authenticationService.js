const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "yourSecretKeyHere";

// TODO: implement HTTPS later

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token invalid or expired." });
    }
    req.user = decoded;
    next();
  });
}

function roleCheck(requiredRoles = []) {
  return (req, res, next) => {
    // Make sure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    // Check if user's role is in the list of allowed roles
    if (!requiredRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions." });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  roleCheck,
};
