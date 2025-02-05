document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", function (event) {
    const clickedRow = event.target.closest(".row.trip-row");

    document.querySelectorAll(".trip-row.selected-row").forEach((row) => {
      row.classList.remove("selected-row");
    });

    if (clickedRow) {
      clickedRow.classList.add("selected-row");
    }
  });

  // Add Trip Button
  // document.getElementById("addTripBtn").addEventListener("click", function () {
  //   const tripContainer = document.getElementById("gridContainer");
  //   const newTripForm = document.getElementById("newTripForm");

  //   tripContainer.classList.add("resized-grid");
  //   newTripForm.style.display = "block";
  // });

  // // Category Dropdown
  // document.querySelector("#category").addEventListener("change", function () {
  //   const label = this.parentElement.querySelector("label");
  //   if (this.value) {
  //     label?.classList.add("active");
  //   } else {
  //     label?.classList.remove("active");
  //   }
  // });
  // document
  //   .getElementById("vehicleButton")
  //   .addEventListener("click", function () {
  //     window.location.href = "/vehicles";
  //   });

  document.addEventListener("click", function (e) {
    if (e.target.closest(".search-button")) {
      const card = e.target.closest(".card");
      const vinElement = card.querySelector(".vin");
      if (vinElement) {
        const vin = vinElement.textContent.trim();
        window.location.href = "/?vehicleId=" + encodeURIComponent(vin);
      }
    }

    // TODO: add click event for add button
    if (e.target.closest(".")) {
    }

    if (e.target.closest(".edit-button")) {
      console.log("Edit button clicked");
      const card = e.target.closest(".card");
      const vehicle = {
        _id: card.getAttribute("data-id"),
        customName: card.getAttribute("data-custom-name"),
        manufacturer: card.getAttribute("data-manufacturer"),
        model: card.getAttribute("data-model"),
        year: card.getAttribute("data-year"),
        licensePlate: card.getAttribute("data-license-plate"),
      };

      // Jetzt die Modal-Felder füllen
      document.getElementById("vehicleId").textContent = vehicle._id;
      document.getElementById("vehicleCustomName").value = vehicle.customName;

      document.getElementById("vehicleManufacturer").value =
        vehicle.manufacturer;
      document.getElementById("vehicleModel").value = vehicle.model;
      document.getElementById("vehicleYear").value = vehicle.year;
      document.getElementById("vehicleLicensePlate").value =
        vehicle.licensePlate;
    }
  });

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
