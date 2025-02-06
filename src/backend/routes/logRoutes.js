const express = require("express");
const fs = require("fs");
const path = require("path");
const TailFile = require("tail-file");

const router = express.Router();
const FLUTTER_LOG_FILE = path.join(__dirname, "../logs/flutter_app.log");
const MAX_LOG_ENTRIES = 1000;
const THROTTLE_INTERVAL = 100; // ms

const connections = new Set();

// Browser crash fixes implemented:
// 1. Throttled event batching
// 2. Efficient log tailing
// 3. Proper resource cleanup
// 4. Backpressure handling
// 5. Memory leak prevention

router.use(express.json());

// Stream logs with crash protection
router.get("/stream_flutter_logs", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send recent history first (last 100 lines of the log)
  try {
    const data = await fs.promises.readFile(FLUTTER_LOG_FILE, "utf8");
    const lines = data.split("\n").filter(Boolean).slice(-100);

    // Each line is a JSON string. Parse them so we get an array of objects.
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

    // Send as an array in SSE data
    res.write(`data: ${JSON.stringify(recentLogs)}\n\n`);
  } catch (err) {
    console.error("Error sending initial logs:", err);
  }

  // Setup event batching
  let batch = [];
  let isThrottled = false;

  const sendBatch = () => {
    if (batch.length > 0 && res.writable) {
      // Send the batch as an array of objects
      res.write(`data: ${JSON.stringify(batch)}\n\n`);
      batch = [];
    }
  };

  // Use TailFile to watch for new lines
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

// Safe log writing endpoint
router.post("/api/flutter_logs", (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Empty request body" });
  }

  // We'll just assume 'level', 'message', and 'timestamp' come from the Dart code
  const jsonLine = JSON.stringify(req.body) + "\n";

  fs.appendFile(FLUTTER_LOG_FILE, jsonLine, (err) => {
    if (err) {
      console.error("Log write error:", err);
      return res.status(500).json({ error: "Failed to save log" });
    }
    res.json({ message: "Log saved" });
  });
});

// Periodic log trimming (runs every 5 minutes)
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
}, 300_000); // 5 minutes

module.exports = router;
