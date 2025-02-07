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
    notesContainer.textContent = "ist kein array";
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

document.addEventListener("click", async function (e) {
  // Handle trip row clicks
  let clickedRow;
  const logoutButton = e.target.closest("#logoutButton");
  const isCheckboxClick = e.target.closest(".form-check, .form-check-input");

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

async function handleTripRowClick(clickedRow) {
  console.log("Trip row clicked:", clickedRow.dataset.tripId);
  const tripId = clickedRow.dataset.tripId;
  const vehicleId = clickedRow.dataset.vehicleId;
  const editTripForm = document.getElementById("editTripForm");
  const tripContainer = document.getElementById("gridContainer");

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
  } else {
    document.querySelectorAll(".trip-row.selected-row").forEach((row) => {
      row.classList.remove("selected-row");
    });
    clickedRow.classList.add("selected-row");

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
