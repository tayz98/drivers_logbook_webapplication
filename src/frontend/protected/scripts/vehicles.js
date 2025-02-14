// click handling for vehicle cards
async function handleVehiclesClickEvents() {
  document.addEventListener("click", async (e) => {
    const addTripButton = e.target.closest(".add-trip-button");
    const editButton = e.target.closest(".edit-button");
    const searchButton = e.target.closest(".search-button");

    if (addTripButton) {
      handleAddTripButtonClick(e);
    }

    if (editButton) {
      handleEditButtonClick(e);
    }

    if (searchButton) {
      handleSearchButtonClick(e);
    }
  });
}

function handleSearchButtonClick(e) {
  const card = e.target.closest(".card");
  if (!card) return;

  const vinElement = card.querySelector(".vin");
  if (vinElement) {
    const vin = vinElement.textContent.trim();
    window.location.href = "/?vehicleId=" + encodeURIComponent(vin);
  }
}

function handleAddTripButtonClick(e) {
  const card = e.target.closest(".card");
  if (!card) return;

  const customName = card.getAttribute("data-custom-name");
  const vin = card.getAttribute("data-id");
  const vehicleDisplayName = customName ? customName : vin;

  document.getElementById("vehicleName").textContent = vehicleDisplayName;
  document.getElementById("vehicleVin").value = vin;

  const modalElement = document.getElementById("newTripModal");
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
  modalInstance.show();
}

function handleEditButtonClick(e) {
  const card = e.target.closest(".card");
  if (!card) return;

  const vehicle = {
    _id: card.getAttribute("data-id"),
    customName: card.getAttribute("data-custom-name"),
    manufacturer: card.getAttribute("data-manufacturer"),
    model: card.getAttribute("data-model"),
    year: card.getAttribute("data-year"),
    licensePlate: card.getAttribute("data-license-plate"),
  };

  document.getElementById("vehicleId").textContent = vehicle._id;
  document.getElementById("vehicleCustomName").value = vehicle.customName;
  document.getElementById("vehicleManufacturer").value = vehicle.manufacturer;
  document.getElementById("vehicleModel").value = vehicle.model;
  document.getElementById("vehicleYear").value = vehicle.year;
  document.getElementById("vehicleLicensePlate").value = vehicle.licensePlate;
}

// edit form submission
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
    updateVehicle(vehicleId, data);
    const modalEl = document.getElementById("editVehicleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();

      const modalBackdrop = document.querySelector(".modal-backdrop");
      if (modalBackdrop) {
        modalBackdrop.remove();
      }
    }
  } catch (error) {
    console.error("Update failed:", error);
  }
});

// edit form validation
const allowedFieldsInEdit = [
  "mileage",
  "mileageEnd",
  "notes",
  "category",
  "startTimestamp",
  "endTimestamp",
  "vehicleVin",
];

const categorySelect = document.getElementById("category");
categorySelect.addEventListener("change", function () {
  const selectedValue = this.value.toLowerCase();
  const shouldDisable =
    selectedValue === "private" || selectedValue === "commute";
  const formElements = document.querySelectorAll(
    "#newTripForm input, #newTripForm textarea"
  );

  // enable or disable fields based on the selected category
  formElements.forEach((element) => {
    if (allowedFieldsInEdit.includes(element.id)) {
      element.disabled = false;
    } else {
      element.disabled = shouldDisable;
      if (shouldDisable) {
        element.value = "";
      }
    }
  });
});

// new trip form validation
const tripForm = document.getElementById("newTripForm");
const tripFormToClose = tripForm.querySelector("form");
const submitButton = tripForm.querySelector('button[type="submit"]');
const formFields = tripForm.querySelectorAll("input, textarea, select");

// fields that are optional and don't need to be filled out
const optionalFieldsInNewTripForm = ["notes", "detour", "vehicleVin"];

function validateForm() {
  let valid = true;

  formFields.forEach((field) => {
    if (!field.disabled && field.tagName.toLowerCase() !== "button") {
      if (optionalFieldsInNewTripForm.includes(field.id)) {
        return;
      }
      if (field.value.trim() === "") {
        valid = false;
      }
    }
  });
  submitButton.disabled = !valid;

  if (!valid) {
    submitButton.classList.add("disabled");
  } else {
    submitButton.classList.remove("disabled");
  }
}

formFields.forEach((field) => {
  field.addEventListener("input", validateForm);
  field.addEventListener("change", validateForm);
  field.addEventListener("blur", validateForm);
});

validateForm();

// new trip form submission
tripForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const startTimestamp = document.getElementById("startTimestamp").value;
  const startDate = new Date(startTimestamp);
  startDate.setSeconds(0, 0);
  const endTimestamp = document.getElementById("endTimestamp").value;
  const endDate = new Date(endTimestamp);
  endDate.setSeconds(0, 0);
  let startLocation = null;
  let endLocation = null;
  let startStreet = document.getElementById("startStreet").value.trim();
  if (startStreet === "") {
    startStreet = null;
  }
  let startCity = document.getElementById("startCity").value.trim();
  if (startCity === "") {
    startCity = null;
  }
  let startPostalCode = document.getElementById("startPostalCode").value.trim();
  if (startPostalCode === "") {
    startPostalCode = null;
  }
  let endStreet = document.getElementById("endStreet").value.trim();
  if (endStreet === "") {
    endStreet = null;
  }
  let endCity = document.getElementById("endCity").value.trim();
  if (endCity === "") {
    endCity = null;
  }
  let endPostalCode = document.getElementById("endPostalCode").value.trim();
  if (endPostalCode === "") {
    endPostalCode = null;
  }
  const vin = document.getElementById("vehicleVin").value.trim();

  if (startStreet && startCity && startPostalCode) {
    startLocation = {
      street: startStreet,
      city: startCity,
      postalCode: startPostalCode,
    };
  }
  if (endStreet && endCity && endPostalCode) {
    endLocation = {
      street: endStreet,
      city: endCity,
      postalCode: endPostalCode,
    };
  }
  const formData = {
    startTimestamp: startDate,
    endTimestamp: endDate,
    startLocation: startLocation,
    endLocation: endLocation,
    startMileage: document.getElementById("mileage").value,
    endMileage: document.getElementById("mileageEnd").value,
    client: document.getElementById("businessPartner").value,
    clientCompany: document.getElementById("client").value,
    tripPurpose: document.getElementById("purpose").value,
    tripCategory: document.getElementById("category").value,
    tripNotes: document.getElementById("notes").value,
    vehicle: {
      vin: vin,
    },
    recorded: false,
    tripCategory: document.getElementById("category").value,
    tripStatus: "completed",
    detourNote: document.getElementById("detour").value,
    checked: true,
  };
  const response = await postTrip(formData);
  const result = await response.json();
  console.log("Trip created:", result);
  tripFormToClose.reset();
  const modalElement = document.getElementById("newTripModal");
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
  modalInstance.hide();
});

// show vehicle cards
async function displayVehicles(vehicles) {
  const container = document.getElementById("vehicleContainer");
  container.innerHTML = "";

  vehicles.forEach((vehicle) => {
    console.log(vehicle);

    container.innerHTML += `
      <div class="col-auto">
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
                    class="btn btn-link p-0 text-white add-trip-button"
                    title="Fahrt hinzufügen"
                  >
                    <i class="bi bi-plus-circle fs-5"></i>
                  </button>
              <button
                class="btn btn-link p-0 text-white edit-button"
                data-bs-toggle="modal"
                data-bs-target="#editVehicleModal"
                title="Bearbeiten"
              >
                <i class="bi bi-pencil-square fs-5"></i>
              </button>
              <a href="#" class="text-white ms-1 search-button" title="Fahrten anzeigen">
                <i class="bi bi-search fs-5"></i>
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

// trigger new vehicle loading when the vehicleStore changes
autorun(() => {
  console.log("Vehicles changed:", vehicleStore.vehicles);
  displayVehicles(vehicleStore.vehicles);
});
