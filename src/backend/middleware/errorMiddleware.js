const logger = require("./logger");

module.exports = (err, req, res, next) => {
  logger.error(
    `Error: ${err.message} | Request: ${req.body} | Stack: ${err.stack}`
  );
  res.status(500).send("Internal Server Error");
};
