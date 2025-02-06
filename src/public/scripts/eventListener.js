async function loadVehicleName(vehicleId) {
  try {
    const response = await fetch(`/api/vehicle/${vehicleId}`);
    if (!response.ok) {
      throw new Error("Error in getting a response for the vehicleId");
    }
    const data = await response.json();
    return data.customName || vehicleId;
  } catch (error) {
    console.error("Error fetching vehicle Name :", error);
    return vehicleId;
  }
}

// Event Listeners on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // Logout Button
  document
    .getElementById("logoutButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        window.location.href = "/";
      } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/";
      }
    });
});

document.addEventListener("click", async function (e) {
  // Selecting a trip row

  const clickedRow = e.target.closest(".row.trip-row");
  if (clickedRow) {
    const editTripForm = document.getElementById("editTripForm");
    const tripContainer = document.getElementById("gridContainer");

    if (clickedRow.classList.contains("selected-row")) {
      clickedRow.classList.remove("selected-row");

      if (editTripForm) {
        editTripForm.style.display = "none";
      }
      if (tripContainer) {
        tripContainer.classList.remove("resized-grid");
      }
    } else {
      document.querySelectorAll(".trip-row.selected-row").forEach((row) => {
        row.classList.remove("selected-row");
      });
      clickedRow.classList.add("selected-row");

      // Formular anzeigen
      if (editTripForm) {
        editTripForm.style.display = "block";
      }
      // Grid-Container vergrößern
      if (tripContainer) {
        tripContainer.classList.add("resized-grid");
      }
      const vehicleId = clickedRow.dataset.vehicleId;
      const vehicleNameElement = document.getElementById("vehicleName");
      const vehicleName = await loadVehicleName(vehicleId);
      if (vehicleNameElement) {
        vehicleNameElement.innerText = "Fahrzeug: " + vehicleName;
      }
    }
  }

  // search button of a vehicle
  if (e.target.closest(".search-button" || e.target.id === "search-button")) {
    const card = e.target.closest(".card");
    const vinElement = card.querySelector(".vin");
    if (vinElement) {
      const vin = vinElement.textContent.trim();
      window.location.href = "/?vehicleId=" + encodeURIComponent(vin);
    }
  }

  // add trip button of a vehicle
  if (
    e.target.closest(".add-trip-button") ||
    e.target.id === "add-trip-button"
  ) {
    console.log("Add trip button clicked");
    // get data of vehicle card
    const card = e.target.closest(".card");
    const customName = card.getAttribute("data-custom-name");
    const vin = card.getAttribute("data-id");
    const vehicleDisplayName = customName ? customName : vin;
    // insert vehicle name into modal title
    document.getElementById("vehicleName").textContent = vehicleDisplayName;
    document.getElementById("vehicleVin").value = vin;
    const modalElement = document.getElementById("newTripModal");
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.show();
  }

  // edit button of a vehicle
  if (e.target.closest(".edit-button") || e.target.id === "edit-button") {
    console.log("Edit button clicked");
    const card = e.target.closest(".card");
    // get data of vehicle card
    const vehicle = {
      _id: card.getAttribute("data-id"),
      customName: card.getAttribute("data-custom-name"),
      manufacturer: card.getAttribute("data-manufacturer"),
      model: card.getAttribute("data-model"),
      year: card.getAttribute("data-year"),
      licensePlate: card.getAttribute("data-license-plate"),
    };
    // insert vehicle data into modal form
    document.getElementById("vehicleId").textContent = vehicle._id;
    document.getElementById("vehicleCustomName").value = vehicle.customName;

    document.getElementById("vehicleManufacturer").value = vehicle.manufacturer;
    document.getElementById("vehicleModel").value = vehicle.model;
    document.getElementById("vehicleYear").value = vehicle.year;
    document.getElementById("vehicleLicensePlate").value = vehicle.licensePlate;
  }

  if (e.target.closest("logoutButton") || e.target.id === "logoutButton") {
    console.log("Logout button clicked");
  }
});
