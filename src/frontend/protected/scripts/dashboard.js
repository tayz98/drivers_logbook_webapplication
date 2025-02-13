function checkUrlForVehicleId() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    tripStore.specificVehicleId = urlParams.get("vehicleId");
  } catch (error) {
    console.error("Error parsing URL:", error);
    specificVehicleId = null;
  }
}

// click handling for rows and checkboxes in the dashboard
async function handleDashboardClickEvents() {
  document.addEventListener("click", async (e) => {
    let clickedRow;
    const isCheckboxClick = e.target.closest(".form-check, .form-check-input");

    if (!isCheckboxClick) {
      const clickedRow = e.target.closest(".row.trip-row");
      if (clickedRow) await handleTripRowClick(clickedRow);
    }

    if (clickedRow) {
      await handleTripRowClick(clickedRow);
    }
  });
}

async function handleTripRowClick(clickedRow) {
  console.log("Trip row clicked:", clickedRow.dataset.tripId);
  const tripId = clickedRow.dataset.tripId;
  const vehicleId = clickedRow.dataset.vehicleId;
  const editTripForm = document.getElementById("editTripForm");
  const tripContainer = document.getElementById("gridContainer");
  const formContainer = document.getElementById("formContainer");
  const gridFormContainer = document.querySelector(".grid-form-container");

  if (clickedRow.classList.contains("selected-row")) {
    clickedRow.classList.remove("selected-row");
    if (editTripForm) {
      editTripForm.style.display = "none";
      console.log("Hiding form");
    }
    if (tripContainer) {
      tripContainer.classList.remove("resized-grid");
      console.log("Resizing grid");
    }
    const mapContainer = document.getElementById("routeMap");
    if (mapContainer) {
      mapContainer.style.display = "none";
    }
    if (gridFormContainer) {
      gridFormContainer.style.flexDirection = "row";
    }
    if (formContainer) {
      formContainer.style.display = "none";
    }
  } else {
    document.querySelectorAll(".trip-row.selected-row").forEach((row) => {
      row.classList.remove("selected-row");
    });
    clickedRow.classList.add("selected-row");

    if (formContainer) {
      formContainer.style.display = "flex";
    }

    if (editTripForm) {
      console.log("Showing form");
      editTripForm.style.display = "block";
      editTripForm.reset();
      document.getElementById("tripId").value = tripId;
      document.getElementById("vehicleVin").value = vehicleId;
      const tripData = tripStore.getTripById(tripId);
      console.log();
      console.log("Trip data:", tripData);
      if (tripData) {
        console.log("Trip data:", tripData);
        editTripForm.elements["tripCategory"].value =
          tripData.tripCategory ?? "business";
        editTripForm.elements["tripPurpose"].value = tripData.tripPurpose ?? "";
        editTripForm.elements["detour"].value = tripData.detourNote ?? "";
        editTripForm.elements["client"].value = tripData.client ?? "";
        editTripForm.elements["businessPartner"].value =
          tripData.clientCompany ?? "";
        displayTripNotes(tripData.tripNotes);
        editTripForm.elements["tripCategory"].dispatchEvent(
          new Event("change")
        );
        renderRouteMap(tripData);
      }
    } else {
      console.error("Edit trip form not found");
    }
    if (tripContainer) {
      tripContainer.classList.add("resized-grid");
    }

    const vehicleNameElement = document.getElementById("vehicleName");
    const vehicleName = await fetchVehicleName(vehicleId);
    if (vehicleNameElement) {
      vehicleNameElement.innerText = "Fahrzeug: " + vehicleName;
    }
  }
}

function displayTripNotes(tripNotesArray) {
  const notesContainer = document.getElementById("tripNotesDisplay");
  console.log("notesContainer", notesContainer);

  if (!notesContainer) {
    console.error(
      "Error: 'tripNotesDisplay' container element not found in HTML."
    );
    return;
  }

  notesContainer.innerHTML = "";

  if (
    !tripNotesArray ||
    !Array.isArray(tripNotesArray) ||
    tripNotesArray.length === 0
  ) {
    notesContainer.textContent = "";
    return;
  }

  const notesList = document.createElement("ul");
  notesList.className = "trip-notes-list";

  tripNotesArray.forEach((note) => {
    const trimmedNote = note ? note.trim() : "";

    if (trimmedNote !== "") {
      // Only display non-empty notes
      const noteItem = document.createElement("li");
      noteItem.className = "trip-note-item";
      noteItem.textContent = trimmedNote;
      notesList.appendChild(noteItem);
    }
  });

  notesContainer.appendChild(notesList);
}

const timeOptions = {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

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

// Validate form fields
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

// Submit form
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

// edit trip form validation
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
  const modalActionButton = document.getElementById("modalActionButton");

  const modal = new bootstrap.Modal(document.getElementById("actionModal"));
  document.getElementById("modalTitle").textContent = modalTitle;
  document.getElementById("modalBody").textContent = modalBody;
  modal.show();
  modalActionButton.onclick = async () => {
    if (actionType === "delete") {
      await deleteTrip(tripIds[0]);
    } else {
      await mergeTrips(tripIds);
    }
    modal.hide();
  };
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

/**
 * Render a Leaflet map showing the route between the trip's start and end addresses.
 * Uses Nominatim to geocode the addresses.
 */
async function renderRouteMap(tripData) {
  const mapContainer = document.getElementById("routeMap");
  if (!mapContainer) {
    console.error(
      "Route map container element (id 'routeMap') not found in the DOM."
    );
    return;
  }
  // Check that both addresses exist.
  if (
    !tripData.startLocation ||
    !tripData.endLocation ||
    !tripData.startLocation.street ||
    !tripData.startLocation.city ||
    !tripData.startLocation.postalCode ||
    !tripData.endLocation.street ||
    !tripData.endLocation.city ||
    !tripData.endLocation.postalCode
  ) {
    mapContainer.style.display = "none";
    return;
  }

  const startAddress = `${tripData.startLocation.street}, ${tripData.startLocation.postalCode} ${tripData.startLocation.city}`;
  const endAddress = `${tripData.endLocation.street}, ${tripData.endLocation.postalCode} ${tripData.endLocation.city}`;

  try {
    const startRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        startAddress
      )}`
    );
    const startData = await startRes.json();
    const endRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        endAddress
      )}`
    );
    const endData = await endRes.json();

    if (startData.length === 0 || endData.length === 0) {
      mapContainer.style.display = "none";
      return;
    }

    const startCoords = [
      parseFloat(startData[0].lat),
      parseFloat(startData[0].lon),
    ];
    const endCoords = [parseFloat(endData[0].lat), parseFloat(endData[0].lon)];

    // Remove previous map instance if it exists.
    if (window.routeMapInstance) {
      window.routeMapInstance.remove();
    }

    // Create new map instance and set initial view.
    window.routeMapInstance = L.map("routeMap").setView(startCoords, 13);

    // Add OpenStreetMap tile layer.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(window.routeMapInstance);

    // Add markers for start and end.
    L.marker(startCoords)
      .addTo(window.routeMapInstance)
      .bindPopup("Start: " + startAddress)
      .openPopup();
    L.marker(endCoords)
      .addTo(window.routeMapInstance)
      .bindPopup("End: " + endAddress);

    // Draw a polyline connecting the two points.
    const routeLine = L.polyline([startCoords, endCoords], {
      color: "blue",
    }).addTo(window.routeMapInstance);

    // Compute the distance between the two points.
    const distanceKm = getDistanceInKm(
      startCoords[0],
      startCoords[1],
      endCoords[0],
      endCoords[1]
    );
    // Determine an appropriate maxZoom based on the distance.
    let maxZoom;
    if (distanceKm < 1) {
      maxZoom = 14;
    } else if (distanceKm < 5) {
      maxZoom = 12;
    } else if (distanceKm < 20) {
      maxZoom = 10;
    } else {
      maxZoom = 8;
    }
    // Fit bounds with the computed maxZoom.
    window.routeMapInstance.fitBounds(routeLine.getBounds(), {
      padding: [20, 20],
      maxZoom: maxZoom,
    });

    // Show the map container.
    mapContainer.style.display = "block";
    // Recalculate the map size after a short delay.
    setTimeout(() => {
      if (window.routeMapInstance) {
        window.routeMapInstance.invalidateSize();
      }
    }, 200);
  } catch (error) {
    console.error("Error rendering route map:", error);
    mapContainer.style.display = "none";
  }
}

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
    tripRow.className = `row trip-row border bg-white rounded fixed-height mb-2 ${
      trip.checked ? "trip-checked" : ""
    } ${trip.tripStatus === "incorrect" ? "trip-incorrect" : ""}`;
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

autorun(() => {
  console.log("Trips changed:", tripStore.trips);
  if (tripStore.specificVehicleId) {
    displayTrips(
      tripStore.trips.filter(
        (trip) => trip.vehicleId === tripStore.specificVehicleId
      )
    );
  } else {
    displayTrips(tripStore.trips);
  }
});
