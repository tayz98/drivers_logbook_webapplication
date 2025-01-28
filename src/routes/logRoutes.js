const express = require("express");
const fs = require("fs");
const path = require("path");
const readline = require("node:readline");

const router = express.Router();
const FLUTTER_LOG_FILE = path.join(__dirname, "../logs/flutter_app.log");
const MAX_LOG_ENTRIES = 1000;

// Stream logs
router.get("/stream_flutter_logs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLogUpdate = (logEntry) => {
    res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  };

  let tempBuffer = [];

  // Read existing logs
  const readInterface = readline.createInterface({
    input: fs.createReadStream(FLUTTER_LOG_FILE),
    output: process.stdout,
    console: false,
    terminal: false,
  });

  readInterface.on("line", (line) => {
    tempBuffer.push(line.trim());
    if (line.startsWith("timestamp:")) {
      const logEntry = parseLogLine(tempBuffer.join("\n"));
      sendLogUpdate(logEntry);
      tempBuffer = [];
    }
  });

  readInterface.on("close", () => {
    res.write("event: end\n");
    res.write("data: End of log file\n\n");
  });

  // Watch for new logs
  fs.watchFile(FLUTTER_LOG_FILE, { interval: 500 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      const newReadInterface = readline.createInterface({
        input: fs.createReadStream(FLUTTER_LOG_FILE, { start: prev.size }),
        output: process.stdout,
        console: false,
        terminal: false,
      });

      newReadInterface.on("line", (line) => {
        tempBuffer.push(line.trim());
        if (line.startsWith("timestamp:")) {
          const logEntry = parseLogLine(tempBuffer.join("\n"));
          sendLogUpdate(logEntry);
          tempBuffer = [];
        }
      });
    }
  });

  req.on("close", () => {
    readInterface.close();
    fs.unwatchFile(FLUTTER_LOG_FILE);
  });
});

// Parse a raw log into structured format
function parseLogLine(logString) {
  const logParts = logString.split("\n").reduce((log, part) => {
    const [key, ...valueParts] = part.split(":");
    log[key.trim()] = valueParts.join(":").trim(); // Handle multi-part values
    return log;
  }, {});

  return {
    level: logParts.level || "",
    message: logParts.message || "",
    timestamp: logParts.timestamp || "",
  };
}

// POST API to add logs
router.post("/api/flutter_logs", (req, res) => {
  if (!Object.keys(req.body).length) {
    return res.status(400).json({ error: "Request body is empty" });
  }

  const logEntry = Object.keys(req.body)
    .map((key) => `${key}: ${req.body[key]}`)
    .join("\n");
  const fullLogEntry = `${logEntry}\n`;

  trimLogFile(FLUTTER_LOG_FILE, MAX_LOG_ENTRIES, fullLogEntry, (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save log" });
    }
    res.status(200).json({ message: "Log saved successfully" });
  });
});

// Trim log file to a maximum number of entries
function trimLogFile(filePath, maxEntries, newEntry, callback) {
  const logLines = [];
  const readStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const lineReader = readline.createInterface({ input: readStream });

  lineReader.on("line", (line) => {
    logLines.push(line);
    if (logLines.length > maxEntries) {
      logLines.shift();
    }
  });

  lineReader.on("close", () => {
    logLines.push(newEntry); // Add the new log entry
    const trimmedLogs = logLines.join("\n");

    fs.writeFile(filePath, trimmedLogs, callback);
  });

  readStream.on("error", (err) => {
    if (err.code === "ENOENT") {
      fs.writeFile(filePath, newEntry, callback);
    } else {
      callback(err);
    }
  });
}

module.exports = router;
