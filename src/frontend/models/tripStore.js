const { makeAutoObservable, autorun, autoBind, observable } = mobx;

class TripStore {
  trips = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.socket = io("http://localhost:80");
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.socket.emit("tripsRequested");
    });

    this.socket.on("tripsUpdated", (trips) => {
      console.log("Trips updated:", trips);
      this.trips = trips;
    });

    this.socket.on("tripUpdated", (updatedTrip) => {
      console.log("Trip updated:", updatedTrip);
      const index = this.trips.findIndex((t) => t._id === updatedTrip._id);
      if (index !== -1) {
        this.trips[index] = updatedTrip;
      }
    });

    this.socket.on("tripCreated", (newTrip) => {
      console.log("New trip created:", newTrip);
      this.trips.push(newTrip);
    });

    this.socket.on("tripsMarkedAsDeleted", (tripIds) => {
      console.log("Trips marked as deleted:", tripIds);
      this.trips = this.trips.map((trip) => {
        if (tripIds.includes(trip._id)) {
          trip.markAsDeleted = true;
        }
        return trip;
      });
    });

    this.socket.on("tripsDeleted", () => {
      console.log("Trips deleted event received");
      this.trips = [];
    });

    this.socket.on("tripDeleted", (tripId) => {
      console.log("Trip deleted event received:", tripId);
      this.trips = this.trips.filter((trip) => trip._id !== tripId);
    });
  }

  async loadTrips() {
    try {
      const trips = await fetchTrips();
      if (trips) {
        this.trips = trips;
      }
    } catch (error) {
      console.error("Fehler beim Laden der Fahrten:", error);
    }
  }
}
const tripStore = new TripStore();
