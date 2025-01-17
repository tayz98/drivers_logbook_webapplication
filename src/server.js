const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const logger = require("./logger");
const readline = require("node:readline");
const FLUTTER_LOG_FILE = path.join(__dirname, "logs", "flutter_app.log");
const cors = require("cors");

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());

app.use((req, res, next) => {
  logger.info(`Access: ${req.method} ${req.url} | IP: ${req.ip}`);
  next();
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message} | Stack: ${err.stack}`);
  res.status(500).send("Internal Server Error");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/flutter_logs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "flutter_logs.html"));
});

app.get("/stream_flutter_logs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLogUpdate = (line) => {
    res.write(`data: ${line}\n\n`);
  };

  const readInterface = readline.createInterface({
    input: fs.createReadStream(FLUTTER_LOG_FILE),
    output: process.stdout,
    console: false,
    terminal: false,
  });

  readInterface.on("line", (line) => {
    sendLogUpdate(line);
  });

  readInterface.on("close", () => {
    res.write("event: end\n");
    res.write("data: End of log file\n\n");
  });

  fs.watchFile(FLUTTER_LOG_FILE, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      const newReadInterface = readline.createInterface({
        input: fs.createReadStream(FLUTTER_LOG_FILE, { start: prev.size }),
        output: process.stdout,
        console: false,
        terminal: false,
      });

      newReadInterface.on("line", (line) => {
        sendLogUpdate(line);
      });
    }
  });

  req.on("close", () => {
    readInterface.close();
    fs.unwatchFile(FLUTTER_LOG_FILE);
  });
});
app.post("/api/flutter_logs", (req, res) => {
  if (!Object.keys(req.body).length) {
    return res.status(400).json({ error: "Request body is empty" });
  }

  const logEntry = Object.keys(req.body)
    .map((key) => `${key}: ${req.body[key]}`)
    .join("\n");
  const fullLogEntry = `${logEntry}\n`;

  fs.appendFile(FLUTTER_LOG_FILE, fullLogEntry, (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save log" });
    }
    res.status(200).json({ message: "Log saved successfully" });
  });
});
