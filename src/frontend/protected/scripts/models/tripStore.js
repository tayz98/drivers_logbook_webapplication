const { makeAutoObservable, autorun, autoBind, observable } = mobx;

class TripStore {
  trips = [];
  specificVehicleId = null;

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

    this.socket.on("trips", (trips) => {
      console.log("Received trips from server:", trips);
      this.trips = trips;
    });

    this.socket.on("tripsUpdated", (updatedTrips) => {
      console.log("Trips updated:", updatedTrips);
      updatedTrips.forEach((updatedTrip) => {
        const index = this.trips.findIndex(
          (trip) => trip._id === updatedTrip._id
        );
        if (index !== -1) {
          this.trips[index] = updatedTrip;
        }
      });
    });

    this.socket.on("tripCreated", (newTrip) => {
      console.log("New trip created:", newTrip);
      this.trips.push(newTrip);
    });

    this.socket.on("tripsDeleted", (tripIds) => {
      console.log("Trips deleted event received:", tripIds);
      this.trips = this.trips.filter((trip) => !tripIds.includes(trip._id));
    });

    this.socket.on("allTripsDeleted", () => {
      console.log("Trips deleted event received");
      this.trips = [];
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
  getTripById(tripId) {
    const tripIdNumber = Number(tripId);
    return this.trips.find((trip) => trip._id === tripIdNumber);
  }
}

const tripStore = new TripStore();
