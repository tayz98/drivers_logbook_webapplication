const timeOptions = {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

function displayTrips(trips) {
  const container = document.getElementById("gridContainer");
  container.innerHTML = "";
  let groupCounter = 0;
  const sortedTrips = trips.slice().sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }

    return new Date(a.startTimestamp) - new Date(b.startTimestamp);
  });

  let lastDate = null;
  sortedTrips.forEach((trip) => {
    console.log("Trip category:", trip.tripCategory);
    const formattedDate = new Date(trip.startTimestamp).toLocaleDateString(
      "de-DE",
      timeOptions
    );
    const startAddress = formattedAddress(
      trip.startLocation,
      trip.tripCategory
    );
    const endAddress = formattedAddress(trip.endLocation, trip.tripCategory);
    const category = trip.tripCategory;

    if (!lastDate || formattedDate !== lastDate) {
      lastDate = formattedDate;
      groupCounter++;

      const dateRow = document.createElement("div");

      dateRow.className =
        "row date-row text-secondary fw-bold mb-1 fixed-height";
      dateRow.innerHTML = `
          <div class="col-auto d-flex align-items-center">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="">
                  </div>
                </div>
                <div class="col d-flex align-items-center">
                  <span>${formattedDate}</span>
                </div>
                <div class="col-auto d-flex align-items-center">
                  <i class="bi bi-union"></i>
                  <i class="bi bi-trash me-2"></i>
                </div>
              </div>
            </div>
          `;
      dateRow.dataset.groupId = `group-${groupCounter}`;
      container.appendChild(dateRow);
    }

    const tripRow = document.createElement("div");
    tripRow.className = `row trip-row border bg-white rounded fixed-height mb-2 ${trip.checked ? "trip-checked" : ""
      } ${trip.tripStatus === "incorrect" ? "trip-incorrect" : ""
      }`;
    tripRow.dataset.groupId = `group-${groupCounter}`;

    tripRow.dataset.tripId = trip._id;
    tripRow.dataset.vehicleId = trip.vehicleId;
    tripRow.innerHTML = `
            <div class="col-auto d-flex align-items-center">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="">
              </div>
            </div>
            <div class="col-auto d-flex flex-column align-items-center justify-content-center">
              <span>${new Date(trip.startTimestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}</span>
              <span>${new Date(trip.endTimestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}</span>
            </div>
            <div class="col d-flex align-items-center">
              <div class="d-flex flex-column align-items-start">
                <div class="d-flex align-items-center">
                  <span>${startAddress}</span>
                  <i class="bi bi-pencil-fill fs-6 ms-2"></i>
                </div>
                <span>${endAddress}</span>
              </div>
            </div>
            <div class="col-auto d-flex align-items-center">
              <span>${calculateDistance(
      trip
    )}</span> <!-- Implement this function -->
            </div>
            <div class="col-auto d-flex align-items-center">
              <i class="${getIconForCategory(category)}"></i>
            </div>
          `;
    container.appendChild(tripRow);
  });
  setTimeout(setupCheckboxListeners, 0);
}
let specificVehicleId = null;
function checkUrlForVehicleId() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    specificVehicleId = urlParams.get("vehicleId");
  } catch (error) {
    console.error("Error parsing URL:", error);
    specificVehicleId = null;
  }
}

function getIconForCategory(category) {
  switch (category) {
    case "business":
      return "bi bi-briefcase-fill";
    case "private":
      return "bi bi-incognito";
    case "commute":
      return "bi bi-building-fill";
    default:
      return "bi bi-question";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const allowedFields = ["notes", "category", "tripId", "vehicleVin"];
  const categorySelect = document.getElementById("category");
  categorySelect.addEventListener("change", function () {
    const selectedValue = this.value.toLowerCase();
    const shouldDisable =
      selectedValue === "private" || selectedValue === "commute";
    const formElements = document.querySelectorAll(
      "#editTripForm input, #editTripForm textarea"
    );

    formElements.forEach((element) => {
      if (allowedFields.includes(element.id)) {
        element.disabled = false;
      } else {
        element.disabled = shouldDisable;
        if (shouldDisable) {
          element.value = "";
        }
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const tripForm = document.getElementById("editTripForm");
  const submitButton = tripForm.querySelector('button[type="submit"]');
  const formFields = tripForm.querySelectorAll("input, textarea, select");

  const optionalFields = [
    "notes",
    "detour",
    "vehicleVin",
    "client",
    "businessPartner",
  ];

  function validateForm() {
    let valid = true;

    formFields.forEach((field) => {
      if (!field.disabled && field.tagName.toLowerCase() !== "button") {
        if (optionalFields.includes(field.id)) {
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
  });

  validateForm();

  tripForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const tripId = tripForm.tripId.value;
    console.log("Trip ID:", tripId);
    const formData = {
      tripCategory: tripForm.category.value,
      client: tripForm.client.value,
      clientCompany: tripForm.businessPartner.value,
      tripPurpose: tripForm.purpose.value,
      tripNotes: tripForm.notes.value,
      detourNote: tripForm.detour.value,
      tripStatus: "completed",
      checked: true,
    };
    const result = await updateTrip(tripId, formData);
    console.log("Update result:", result);
    tripForm.style.display = "none";
    document.getElementById("gridContainer").classList.remove("resized-grid");
    document.querySelectorAll(".trip-row.selected-row").forEach((row) => {
      row.classList.remove("selected-row");
    });
  });
});

function setupCheckboxListeners() {
  document
    .querySelectorAll(".date-row .form-check-input")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const groupId = this.closest(".date-row").dataset.groupId;
        const tripRows = document.querySelectorAll(
          `.trip-row[data-group-id="${groupId}"]`
        );

        tripRows.forEach((row) => {
          const tripCheckbox = row.querySelector(".form-check-input");
          tripCheckbox.checked = this.checked;
        });

        updateIconsVisibility();
      });
    });

  document
    .querySelectorAll(".trip-row .form-check-input")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", updateIconsVisibility);
    });

  document.querySelectorAll(".bi-trash, .bi-union").forEach((icon) => {
    icon.addEventListener("click", function () {
      const selectedTrips = getSelectedTripIds();
      if (selectedTrips.length > 0) {
        showActionModal(
          this.classList.contains("bi-trash") ? "delete" : "merge",
          selectedTrips
        );
      }
    });
  });
}

function getSelectedTripIds() {
  return Array.from(
    document.querySelectorAll(".trip-row .form-check-input:checked")
  ).map((checkbox) => checkbox.closest(".trip-row").dataset.tripId);
}

function updateIconsVisibility() {
  const dateRows = document.querySelectorAll(".date-row");

  dateRows.forEach((dateRow) => {
    const groupId = dateRow.dataset.groupId;

    const selectedInGroup = Array.from(
      document.querySelectorAll(
        `.trip-row[data-group-id="${groupId}"] .form-check-input:checked`
      )
    ).length;

    const trashIcon = dateRow.querySelector(".bi-trash");
    const unionIcon = dateRow.querySelector(".bi-union");

    if (trashIcon) {
      trashIcon.classList.toggle("visible", selectedInGroup === 1);
    }
    if (unionIcon) {
      unionIcon.classList.toggle("visible", selectedInGroup >= 2);
    }
  });
}

// TODO: add implementation for deleting and merging trips
function showActionModal(actionType, tripIds) {
  const modalTitle =
    actionType === "delete" ? "Fahrt löschen" : "Fahrten zusammenführen";
  const modalBody =
    actionType === "delete"
      ? "Möchten Sie diese Fahrt wirklich löschen?"
      : "Möchten Sie diese Fahrten wirklich zusammenführen?";

  const modal = new bootstrap.Modal(document.getElementById("actionModal"));
  document.getElementById("modalTitle").textContent = modalTitle;
  document.getElementById("modalBody").textContent = modalBody;
  document.getElementById("modalActionButton").dataset.tripIds =
    tripIds.join(",");
  modal.show();
}

function calculateDistance(trip) {
  if (!trip.startMileage || !trip.endMileage) {
    return "N/A";
  } else {
    return (trip.endMileage - trip.startMileage).toString() + " km";
  }
}

function formattedAddress(location, category) {
  if (!location || !location.street || !location.postalCode || !location.city) {
    return "Adresse unbekannt";
  }
  return `${location.street}, ${location.postalCode} ${location.city}`;
}

autorun(() => {
  console.log("Trips changed:", tripStore.trips);
  if (specificVehicleId) {
    displayTrips(tripStore.trips.filter((trip) => trip.vehicleId === specificVehicleId));
  } else {
    displayTrips(tripStore.trips);
  }
});
