const express = require("express");
const path = require("path");
const cors = require("cors");
const routes = require("./routes");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(cors());
// app.use(loggerMiddleware);

// Mount Routes
app.use("/", routes);

// // Error Middleware
app.use(errorMiddleware);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
