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

    // this.socket.on("tripUpdated", (updatedTrip) => {
    //   console.log("Trip updated:", updatedTrip);
    //   const index = this.trips.findIndex((t) => t._id === updatedTrip._id);
    //   if (index !== -1) {
    //     this.trips[index] = updatedTrip;
    //   }
    // });

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

    this.socket.on("tripsMarkedAsDeleted", (tripIds) => {
      console.log("Trips marked as deleted:", tripIds);
      this.trips = this.trips.map((trip) => {
        if (tripIds.includes(trip._id)) {
          trip.markAsDeleted = true;
        }
        return trip;
      });
    });

    this.socket.on("tripDeleted", (tripId) => {
      console.log("Trip deleted event received:", tripId);
      this.trips = this.trips.filter((trip) => trip._id !== tripId);
    });

    this.socket.on("tripsDeleted", () => {
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

  //   logAllTrips() {
  //     console.log("All trips (array):", this.trips); // Log the entire trips array

  //     if (this.trips && Array.isArray(this.trips)) {
  //       // Check if trips is an array and not null/undefined
  //       this.trips.forEach((trip, index) => {
  //         console.log(`--- Trip object at index ${index} ---`);
  //         console.log("Trip _id:", trip._id); // Log the _id of each trip object
  //         console.log("All properties of trip:", trip); // Log all properties of each trip object
  //         // You can add more specific properties you want to check here, e.g.,
  //         // console.log("Trip startTimestamp:", trip.startTimestamp);
  //         // console.log("Trip tripCategory:", trip.tripCategory);
  //       });
  //     } else {
  //       console.log("this.trips is not an array or is empty.");
  //     }
  //   }
  // }
}

const tripStore = new TripStore();
