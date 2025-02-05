async function loadVehicles() {
  try {
    const response = await fetch("/api/vehicles", {
      method: "GET",
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

async function updateVehicle(vehicleId, data) {
  try {
    const response = await fetch(`/api/vehicle/${vehicleId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP-Fehler! Status: ${response.status}`);
    }

    const updatedVehicle = await response.json();
    console.log("Fahrzeug aktualisiert:", updatedVehicle);
    return updatedVehicle;
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Fahrzeugs:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const editForm = document.getElementById("editVehicleForm");

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const vehicleId = document.getElementById("vehicleId").textContent.trim();
    const customName = document.getElementById("vehicleCustomName").value;

    const manufacturer = document.getElementById("vehicleManufacturer").value;
    const model = document.getElementById("vehicleModel").value;
    const year = document.getElementById("vehicleYear").value;
    const licensePlate = document.getElementById("vehicleLicensePlate").value;

    const data = {
      manufacturer,
      customName,
      model,
      year,
      licensePlate,
    };

    try {
      await updateVehicle(vehicleId, data);

      const updatedCard = document.querySelector(
        `.compact-card[data-id="${vehicleId}"]`
      );
      if (updatedCard) {
        updatedCard.dataset.customName = data.customName;
        updatedCard.dataset.manufacturer = data.manufacturer;
        updatedCard.dataset.model = data.model;
        updatedCard.dataset.year = data.year;
        updatedCard.dataset.licensePlate = data.licensePlate;

        updatedCard.querySelector(".card-header h6").textContent =
          data.customName;
        updatedCard.querySelectorAll(".compact-info dd")[1].textContent =
          data.manufacturer;
        updatedCard.querySelectorAll(".compact-info dd")[2].textContent =
          data.model;
        updatedCard.querySelectorAll(".compact-info dd")[3].textContent =
          data.year;
        updatedCard.querySelectorAll(".compact-info dd")[4].textContent =
          data.licensePlate;
      }

      // Close modal
      const modalEl = document.getElementById("editVehicleModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    } catch (error) {
      console.error("Update failed:", error);
    }
  });
});

async function displayVehicles(vehicles) {
  const container = document.getElementById("vehicleContainer");
  container.innerHTML = "";

  vehicles.forEach((vehicle) => {
    console.log(vehicle);

    // TODO: add buttons here...

    container.innerHTML += `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <div class="card shadow-sm mb-2 compact-card"
             data-id="${vehicle._id}"
             data-custom-name="${vehicle.customName ?? "Unbekannt"}"
             data-manufacturer="${vehicle.manufacturer ?? "Unbekannt"}"
             data-model="${vehicle.model ?? "Unbekannt"}"
             data-year="${vehicle.year ?? "Unbekannt"}"
            data-license-plate="${vehicle.licensePlate ?? "Unbekannt"}">
          <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center bg-primary text-white">
            <h6 class="mb-0 small">${vehicle.customName ?? "Unbekannt"}</h6>
            <div>
              <button
                class="btn btn-link p-0 text-white edit-button"
                data-bs-toggle="modal"
                data-bs-target="#editVehicleModal"
                title="Bearbeiten"
              >
                <i class="bi bi-pencil-square fs-6"></i>
              </button>
              <a href="#" class="text-white ms-1 search-button" title="Fahrten anzeigen">
                <i class="bi bi-search fs-6"></i>
              </a>
            </div>
          </div>
          <div class="card-body p-2">
            <dl class="row mb-0 compact-info">
              <dt class="col-5 small text-muted">VIN:</dt>
              <dd class="col-7 small vin">${vehicle._id}</dd>

              <dt class="col-5 small text-muted">Hersteller:</dt>
              <dd class="col-7 small">${
                vehicle.manufacturer ?? "Unbekannt"
              }</dd>

              <dt class="col-5 small text-muted">Modell:</dt>
              <dd class="col-7 small">${vehicle.model ?? "Unbekannt"}</dd>

              <dt class="col-5 small text-muted">Jahr:</dt>
              <dd class="col-7 small">${vehicle.year ?? "Unbekannt"}</dd>
              
              <dt class="col-5 small text-muted">Kennzeichen:</dt>
              <dd class="col-7 small">${
                vehicle.licensePlate ?? "Unbekannt"
              }</dd>
            </dl>
          </div>
        </div>
      </div>
    `;
  });
}
