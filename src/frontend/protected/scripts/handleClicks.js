function getDistanceInKm(lat1, lon1, lat2, lon2) {
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
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




async function handleClickEvents() {

  document.addEventListener("click", async (e) => {
    // Handle trip row clicks
    let clickedRow;
    const logoutButton = e.target.closest("#logoutButton");
    const isCheckboxClick = e.target.closest(".form-check, .form-check-input");
    const sidebarToggle = e.target.closest("#sidebarToggle");

    if (sidebarToggle) {
      console.log("Sidebar toggle clicked");
      const sidebar = document.querySelector(".sidebar");
      sidebar.classList.toggle("open");
    }
    if (logoutButton) {
      handleLogout(e);
    }

    if (!isCheckboxClick) {
      const clickedRow = e.target.closest(".row.trip-row");
      if (clickedRow) await handleTripRowClick(clickedRow);
    }

    if (clickedRow) {
      await handleTripRowClick(clickedRow);
    }

    // Handle search button clicks
    if (e.target.closest(".search-button") || e.target.id === "search-button") {
      handleSearchButtonClick(e);
    }

    // Handle add trip button clicks
    if (
      e.target.closest(".add-trip-button") ||
      e.target.id === "add-trip-button"
    ) {
      handleAddTripButtonClick(e);
    }

    // Handle edit button clicks
    if (e.target.closest(".edit-button") || e.target.id === "edit-button") {
      handleEditButtonClick(e);
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
  console.log("Add trip button clicked");
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
  console.log("Edit button clicked");
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

async function handleLogout(e) {
  e.preventDefault();
  logOutUser();
}


/**
 * Render a Leaflet map showing the route between the trip's start and end addresses.
 * Uses Nominatim to geocode the addresses.
 */
async function renderRouteMap(tripData) {
  const mapContainer = document.getElementById("routeMap");
  if (!mapContainer) {
    console.error("Route map container element (id 'routeMap') not found in the DOM.");
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
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startAddress)}`
    );
    const startData = await startRes.json();
    const endRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endAddress)}`
    );
    const endData = await endRes.json();

    if (startData.length === 0 || endData.length === 0) {
      mapContainer.style.display = "none";
      return;
    }

    const startCoords = [parseFloat(startData[0].lat), parseFloat(startData[0].lon)];
    const endCoords = [parseFloat(endData[0].lat), parseFloat(endData[0].lon)];

    // Remove previous map instance if it exists.
    if (window.routeMapInstance) {
      window.routeMapInstance.remove();
    }

    // Create new map instance and set initial view.
    window.routeMapInstance = L.map("routeMap").setView(startCoords, 13);

    // Add OpenStreetMap tile layer.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(window.routeMapInstance);

    // Add markers for start and end.
    L.marker(startCoords).addTo(window.routeMapInstance)
      .bindPopup("Start: " + startAddress).openPopup();
    L.marker(endCoords).addTo(window.routeMapInstance)
      .bindPopup("End: " + endAddress);

    // Draw a polyline connecting the two points.
    const routeLine = L.polyline([startCoords, endCoords], { color: "blue" }).addTo(window.routeMapInstance);

    // Compute the distance between the two points.
    const distanceKm = getDistanceInKm(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    // Determine an appropriate maxZoom based on the distance.
    let maxZoom;
    if (distanceKm < 1) {
      maxZoom = 16;
    } else if (distanceKm < 5) {
      maxZoom = 14;
    } else if (distanceKm < 20) {
      maxZoom = 12;
    } else {
      maxZoom = 10;
    }
    // Fit bounds with the computed maxZoom.
    window.routeMapInstance.fitBounds(routeLine.getBounds(), { padding: [20, 20], maxZoom: maxZoom });

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

