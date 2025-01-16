const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

const FLUTTER_LOG_FILE = path.join(__dirname, "logs", "flutter_app.txt");
let lastSentLength = 0;

app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/flutter_logs", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendLogs = () => {
    fs.readFile(FLUTTER_LOG_FILE, "utf8", (err, data) => {
      if (err) {
        console.error("Failed to read log:", err);
        res.write("event: error\ndata: Failed to read log\n\n");
        return;
      }

      const newLogs = data.slice(lastSentLength);
      if (newLogs) {
        res.write(`${newLogs}`);
        lastSentLength = data.length;
      }
    });
  };
  sendLogs();

  const watcher = fs.watch(FLUTTER_LOG_FILE, sendLogs);

  req.on("close", () => {
    watcher.close();
    res.end();
  });
});

app.post("/api/logs", (req, res) => {
  const logMessage = req.body.message;

  if (!logMessage) {
    return res.status(400).json({ error: "Log message is required" });
  }

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${logMessage}\n`;

  fs.appendFile(FLUTTER_LOG_FILE, logEntry, (err) => {
    if (err) {
      console.error("Failed to write log:", err);
      return res.status(500).json({ error: "Failed to save log" });
    }

    res.status(200).json({ message: "Log saved successfully" });
  });
});
