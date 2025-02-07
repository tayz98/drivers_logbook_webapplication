// src/backend/websocket.js
const { Server } = require("socket.io");
const Vehicle = require("./models/vehicleSchema");
const Trip = require("./models/tripSchema");

let io;
// TODO: check if some events are missing
module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer);

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("vehiclesRequested", async () => {
        const vehicles = await Vehicle.find();
        socket.emit("vehiclesUpdated", vehicles);
      });

      socket.on("vehicleUpdated", async (vehicle) => {
        try {
          if (vehicle) {
            io.emit("vehicleUpdated", vehicle);
          }
        } catch (error) {
          console.error("Error updating vehicle:", error);
        }
      });

      socket.on("vehicleCreated", async (vehicle) => {
        try {
          io.emit("vehicleCreated", vehicle);
        } catch (error) {
          console.error("Error creating vehicle:", error);
        }
      });

      socket.on("vehicleDeleted", async (vehicleId) => {
        try {
          io.emit("vehicleDeleted", vehicleId);
        } catch (error) {
          console.error("Error deleting vehicle:", error);
        }
      });

      socket.on("tripsRequested", async () => {
        const trips = await Trip.find();
        socket.emit("tripsUpdated", trips);
      });

      socket.on("tripUpdated", async (trip) => {
        try {
          if (trip) {
            io.emit("tripUpdated", trip);
          }
        } catch (error) {
          console.error("Error updating trip:", error);
        }
      });

      socket.on("tripsUpdated", async (trips) => {
        try {
          if (trips) {
            io.emit("tripsUpdated", trips);
          }
        } catch (error) {
          console.error("Error updating trips:", error);
        }
      });

      socket.on("tripsDeleted", async () => {
        try {
          io.emit("tripsDeleted");
        } catch (error) {
          console.error("Error deleting trips:", error);
        }
      });

      socket.on("tripsMarkedAsDeleted", async (tripIds) => {
        try {
          io.emit("tripsMarkedAsDeleted", tripIds);
        } catch (error) {
          console.error("Error marking trips as deleted:", error);
        }
      });

      socket.on("tripCreated", async (trip) => {
        try {
          io.emit("tripCreated", trip);
        } catch (error) {
          console.error("Error creating trip:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    console.log("WebSocket server initialized from websocket.js");
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.IO not initialized!");
    }
    return io;
  },
};
