// src/backend/websocket.js
const { Server } = require("socket.io");
const Vehicle = require("./models/vehicleSchema");
const Trip = require("./models/tripSchema");
const { buildTripQuery } = require("./services/tripService");

let io;
// TODO: check if filtering for vehicle is working as expected
module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer);

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // VEHICLES

      socket.on("vehiclesRequested", async () => {
        const session = socket.request.session;
        const user = session.user;
        let vehicles;

        if (user && user.role === "manager") {
          vehicles = await Vehicle.find({ _id: user.vehicleId });
        } else {
          vehicles = await Vehicle.find();
        }
        socket.emit("vehicles", vehicles);
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

      // TRIPS

      socket.on("tripsRequested", async () => {
        const session = socket.request.session;
        const user = session.user;
        const userRole = user ? user.role : null;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const query = buildTripQuery(userRole, user);
        // IMPORTANT: Uncomment the following line to filter trips the user is allowed to see
        const trips = await Trip.find(query);
        // const trips = await Trip.find({ markAsDeleted: deletedTrips });
        socket.emit("trips", trips);
      });

      socket.on("tripsUpdated", async (trips) => {
        try {
          const session = socket.request.session;
          const user = session.user;

          trips.forEach((trip) => {
            if (shouldEmitTrip(trip, user)) {
              socket.emit("tripUpdated", trip);
            }
          });
        } catch (error) {
          console.error("Error updating trips:", error);
        }
      });

      socket.on("tripCreated", async (trip) => {
        try {
          const session = socket.request.session;
          const user = session.user;
          if (shouldEmitTrip(trip, user)) {
            io.emit("tripCreated", trip);
          }
        } catch (error) {
          console.error("Error creating trip:", error);
        }
      });

      socket.on("tripsMarkedAsDeleted", async (tripIds) => {
        try {
          io.emit("tripsMarkedAsDeleted", tripIds);
        } catch (error) {
          console.error("Error marking trips as deleted:", error);
        }
      });

      socket.on("tripDeleted", async (tripId) => {
        try {
          io.emit("tripDeleted", tripId);
        } catch (error) {
          console.error("Error deleting trip:", error);
        }
      });

      socket.on("tripsDeleted", async () => {
        try {
          io.emit("tripsDeleted");
        } catch (error) {
          console.error("Error deleting trips:", error);
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

function shouldEmitTrip(trip, user) {
  const userRole = user ? user.role : null;
  if (userRole === "admin") {
    return true;
  }
  if (trip.markAsDeleted === true) {
    return false;
  }
  if (userRole === "dispatcher" && trip.tripCategory === "business") {
    return true;
  }
  if (user.vehicleId && trip.vehicleId === user.vehicleId) {
    return true;
  }
  return false;
}
