const logger = require("./logger");

module.exports = (req, res, next) => {
  logger.info(`Access: ${req.method} ${req.url} | IP: ${req.ip}`);
  next();
};
