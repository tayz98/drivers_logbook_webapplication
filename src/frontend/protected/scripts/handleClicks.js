document.addEventListener("click", async function (e) {
  // Handle trip row clicks
  const clickedRow = e.target.closest(".row.trip-row");
  const logoutButton = e.target.closest("#logoutButton");

  if (logoutButton) {
    handleLogout(e);
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

// Function to handle trip row clicks
async function handleTripRowClick(clickedRow) {
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
    // Deselect any selected trip rows
    document.querySelectorAll(".trip-row.selected-row").forEach((row) => {
      row.classList.remove("selected-row");
    });
    clickedRow.classList.add("selected-row");

    // Show the form and resize the container
    if (editTripForm) {
      editTripForm.style.display = "block";
    }
    if (tripContainer) {
      tripContainer.classList.add("resized-grid");
    }

    // Load vehicle name and update the modal
    const vehicleId = clickedRow.dataset.vehicleId;
    const vehicleNameElement = document.getElementById("vehicleName");
    const vehicleName = await loadVehicleName(vehicleId);
    if (vehicleNameElement) {
      vehicleNameElement.innerText = "Fahrzeug: " + vehicleName;
    }
  }
}

// Function to handle search button clicks
function handleSearchButtonClick(e) {
  const card = e.target.closest(".card");
  if (!card) return;

  const vinElement = card.querySelector(".vin");
  if (vinElement) {
    const vin = vinElement.textContent.trim();
    window.location.href = "/?vehicleId=" + encodeURIComponent(vin);
  }
}

// Function to handle add trip button clicks
function handleAddTripButtonClick(e) {
  console.log("Add trip button clicked");
  const card = e.target.closest(".card");
  if (!card) return;

  const customName = card.getAttribute("data-custom-name");
  const vin = card.getAttribute("data-id");
  const vehicleDisplayName = customName ? customName : vin;

  // Update the modal with the vehicle info
  document.getElementById("vehicleName").textContent = vehicleDisplayName;
  document.getElementById("vehicleVin").value = vin;

  // Show the modal using Bootstrap
  const modalElement = document.getElementById("newTripModal");
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
  modalInstance.show();
}

// Function to handle edit button clicks
function handleEditButtonClick(e) {
  console.log("Edit button clicked");
  const card = e.target.closest(".card");
  if (!card) return;

  // Retrieve vehicle data from the card
  const vehicle = {
    _id: card.getAttribute("data-id"),
    customName: card.getAttribute("data-custom-name"),
    manufacturer: card.getAttribute("data-manufacturer"),
    model: card.getAttribute("data-model"),
    year: card.getAttribute("data-year"),
    licensePlate: card.getAttribute("data-license-plate"),
  };

  // Populate the edit form with the vehicle data
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
