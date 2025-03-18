const express = require("express");
const path = require("path");
const cors = require("cors");
const routes = require("./routes/indexRoutes");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const externalDomain = "novacorp-fahrtenbuch.ipv64.net";
const externalPort = 1516;
const session = require("express-session");
const app = express();
const port = process.env.PORT || 80;
const MongoStore = require("connect-mongo");
const { mongo, default: mongoose } = require("mongoose");
const { isAuthenticated } = require("./services/authenticationService");
const http = require("http");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const allowedOrigins = [
  "http://localhost",
  "http://localhost:3000",
  `http://localhost:${port}`,
  `http://localhost:${externalPort}`,
  "http://novacorp-fahrtenbuch.ipv64.net",
  `http://novacorp-fahrtenbuch.ipv64.net:${port}`,
  `http://novacorp-fahrtenbuch.ipv64.net:${externalPort}`,
];

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);

        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
  })
);

const sessionMiddleware = session({
  secret: "example",
  resave: true,
  saveUninitialized: false,
  rolling: true,
  sameSite: "Lax",
  store: MongoStore.create({ client: mongoose.connection.getClient() }),
  cookie: {
    maxAge: 60000 * 30, // 30 minutes
    secure: false, // set to true when using https
    httpOnly: false, // prevents manipulation in browser, set to true in production
  },
});

app.use(sessionMiddleware);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// app.use(loggerMiddleware);
const liveReloadServer = livereload.createServer({
  host: externalDomain,
  port: externalPort,
  extraExts: ["html", "css", "js"],
  delay: 500,
});

app.use(
  connectLivereload({
    port: externalPort,
    hostname: externalDomain,
    src: `http://${externalDomain}:${externalPort}/livereload.js?snipver=1`,
  })
);

liveReloadServer.server.on("connection", (socket) => {
  console.log("LiveReload client connected");
  socket.on("close", () => {
    console.log("LiveReload client disconnected");
  });
});

liveReloadServer.watch(path.join(__dirname, "..", "frontend", "public"));
liveReloadServer.watch(path.join(__dirname, "..", "frontend", "protected"));
liveReloadServer.watch(path.join(__dirname, "..", "frontend", "models"));
// process.env.TZ = "Europe/Berlin";

// // Error Middleware
app.use(errorMiddleware);

const httpServer = http.createServer(app);
const socket = require("./websocket");
const io = socket.init(httpServer);
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Mount Routes
app.use("/", routes);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "frontend", "public")));
app.use(
  "/protected",
  isAuthenticated,
  express.static(path.join(__dirname, "..", "frontend", "protected"))
);
app.use(
  "/models",
  isAuthenticated,
  express.static(path.join(__dirname, "..", "frontend", "models"))
);

// Start Server
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

module.exports = { httpServer, io };
