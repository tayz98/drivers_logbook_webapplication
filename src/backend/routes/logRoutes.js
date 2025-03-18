const express = require("express");
const fs = require("fs");
const path = require("path");
const TailFile = require("tail-file");

const router = express.Router();
const FLUTTER_LOG_FILE = path.join(__dirname, "../logs/flutter_app.log");
const MAX_LOG_ENTRIES = 1000;
const THROTTLE_INTERVAL = 100; // ms

const connections = new Set();
router.use(express.json());

/**
 * @swagger
 * /stream_flutter_logs:
 *   get:
 *     summary: Streams flutter logs via Server-Sent Events.
 *     description: Reads the last 100 log entries from the log file and streams new log entries as JSON batches.
 *     tags:
 *       - Flutter Logs
 *     produces:
 *       - text/event-stream
 *     responses:
 *       200:
 *         description: Event stream containing log data.
 */
router.get("/stream_flutter_logs", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const data = await fs.promises.readFile(FLUTTER_LOG_FILE, "utf8");
    const lines = data.split("\n").filter(Boolean).slice(-100);
    const recentLogs = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (err) {
          console.error("Error parsing existing log line:", err);
          return null;
        }
      })
      .filter((entry) => entry !== null);

    res.write(`data: ${JSON.stringify(recentLogs)}\n\n`);
  } catch (err) {
    console.error("Error sending initial logs:", err);
  }

  let batch = [];
  let isThrottled = false;

  const sendBatch = () => {
    if (batch.length > 0 && res.writable) {
      res.write(`data: ${JSON.stringify(batch)}\n\n`);
      batch = [];
    }
  };

  const tail = new TailFile(FLUTTER_LOG_FILE, {
    lineSeparator: /\r?\n/,
  });

  tail.on("line", (line) => {
    try {
      const logEntry = JSON.parse(line);
      batch.push(logEntry);

      if (!isThrottled) {
        isThrottled = true;
        setTimeout(() => {
          sendBatch();
          isThrottled = false;
        }, THROTTLE_INTERVAL);
      }
    } catch (err) {
      console.error("Error parsing log line:", err);
    }
  });

  tail.on("error", (err) => {
    console.error("Tail error:", err);
    cleanup();
  });

  const cleanup = () => {
    connections.delete(res);
    tail.stop();
    res.end();
  };

  connections.add(res);
  tail.start();

  req.on("close", cleanup);
  req.on("end", cleanup);
});

/**
 * @swagger
 * /api/flutter_logs:
 *   post:
 *     summary: Saves a new flutter log entry.
 *     description: Appends the provided JSON log data as a new line to the log file.
 *     tags:
 *       - Flutter Logs
 *     requestBody:
 *       description: JSON object containing the log data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Log saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Empty request body.
 *       500:
 *         description: Failed to save log.
 */
router.post("/api/flutter_logs", (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Empty request body" });
  }

  const jsonLine = JSON.stringify(req.body) + "\n";

  fs.appendFile(FLUTTER_LOG_FILE, jsonLine, (err) => {
    if (err) {
      console.error("Log write error:", err);
      return res.status(500).json({ error: "Failed to save log" });
    }
    res.json({ message: "Log saved" });
  });
});

setInterval(() => {
  fs.readFile(FLUTTER_LOG_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return;
      console.error("Trimming error:", err);
      return;
    }

    const lines = data.split("\n").filter(Boolean);
    if (lines.length > MAX_LOG_ENTRIES) {
      const trimmed = lines.slice(-MAX_LOG_ENTRIES).join("\n") + "\n";
      fs.writeFile(FLUTTER_LOG_FILE, trimmed, (writeErr) => {
        if (writeErr) console.error("Trim write error:", writeErr);
      });
    }
  });
}, 300_000);

module.exports = router;
