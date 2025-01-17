const { createLogger, format, transports } = require("winston");
const path = require("path");

// Custom log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message, meta }) => {
    const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}`;
  })
);

// Create the logger instance
const logger = createLogger({
  level: "info", // Default log level
  format: logFormat,
  transports: [
    // Access log file (info and above)
    new transports.File({
      filename: path.join(__dirname, "logs", "access.log"),
      level: "info",
    }),
    // Error log file (error and above)
    new transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
    }),
    // Console log (for development)
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    }),
  ],
});

// Export the logger
module.exports = logger;
