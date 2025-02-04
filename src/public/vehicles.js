async function loadVehicles() {
  try {
    const userData = await loadUser();

    if (!userData) {
      console.error("No user data found");
      return;
    }
    const response = await fetch("/vehicles", {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const vehicles = await response.json();
    console.log("Vehicles received:", vehicles);
    displayVehicles(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
  }
}

async function displayVehicles(vehicles) {
  const container = document.getElementById("vehicleContainer");
  container.innerHTML = "";
}
