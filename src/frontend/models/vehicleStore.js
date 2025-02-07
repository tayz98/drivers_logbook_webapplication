const {
  observable,
  action,
  computed,
  autorun,
  makeObservable,
  makeAutoObservable,
} = mobx;

class VehicleStore {
  vehicles = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.socket = io("http://localhost:80");
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.socket.emit("vehiclesRequested");
    });

    this.socket.on("vehiclesUpdated", (vehicles) => {
      console.log("Vehicles updated:", vehicles);
      this.vehicles = vehicles;
    });

    this.socket.on("vehicleUpdated", (updatedVehicle) => {
      console.log("Vehicle updated:", updatedVehicle);
      const index = this.vehicles.findIndex(
        (v) => v._id === updatedVehicle._id
      );
      if (index !== -1) {
        this.vehicles[index] = updatedVehicle;
      }
    });

    this.socket.on("vehicleCreated", (newVehicle) => {
      console.log("New vehicle created:", newVehicle);
      this.vehicles.push(newVehicle);
    });

    this.socket.on("vehicleDeleted", (data) => {
      console.log("Vehicle deleted event received:", data);
      const vehicleId = data.vehicleId || data;
      this.vehicles = this.vehicles.filter(
        (vehicle) => vehicle._id !== vehicleId
      );
    });
  }

  async loadVehicles() {
    try {
      const vehicles = await fetchVehicles();
      if (vehicles) {
        this.vehicles = vehicles;
      }
    } catch (error) {
      console.error("Fehler beim Laden der Fahrzeuge:", error);
    }
  }
}

const vehicleStore = new VehicleStore();
