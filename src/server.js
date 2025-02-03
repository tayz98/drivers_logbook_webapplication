const express = require("express");
const path = require("path");
const cors = require("cors");
const routes = require("./routes");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const externalDomain = "novacorp-fahrtenbuch.ipv64.net";
const externalPort = 1516;
const session = require("express-session");
const app = express();
const port = process.env.PORT || 80;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost",
        "http://localhost:80",
        "http://localhost:1516",
        "http://novacorp-fahrtenbuch.ipv64.net",
        "http://novacorp-fahrtenbuch.ipv64.net:1516",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);

        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// app.use(cors());

app.use(
  session({
    secret: "example",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    sameSite: "Lax",
    cookie: {
      maxAge: 60000 * 30, // 30 minutes
      secure: false, // set to true when using https
      httpOnly: false, // prevents manipulation in browser, set to true in production
    },
  })
);

// app.use(loggerMiddleware);
const liveReloadServer = livereload.createServer({
  host: externalDomain,
  port: externalPort,
  extraExts: ["html", "css", "js", "ejs"],
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

liveReloadServer.watch(path.join(__dirname, "public"));
liveReloadServer.watch(path.join(__dirname, "protected"));

app.use(express.urlencoded({ extended: true }));

// Mount Routes
app.use("/", routes);

app.use(express.static(path.join(__dirname, "public")));

// // Error Middleware
app.use(errorMiddleware);

// Start Server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://${externalDomain}:${port}`);
  console.log(`LiveReload active on http://${externalDomain}:${externalPort}`);
});
