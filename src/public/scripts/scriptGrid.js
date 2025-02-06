async function loadTrips() {
  try {
    const vehicleId = getVehicleIdFromUrl();
    let endpoint = "/api/trips";

    if (vehicleId) {
      endpoint += `?vehicleId=${encodeURIComponent(vehicleId)}`;
    }

    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const trips = await response.json();
    console.log("Trips received:", trips);
    displayTrips(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
  }
}
const options = {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

function getVehicleIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("vehicleId");
}

function displayTrips(trips) {
  const container = document.getElementById("gridContainer");
  container.innerHTML = "";

  trips.sort((a, b) => new Date(a.startTimestamp) - new Date(b.startTimestamp));

  let lastDate = null;

  trips.forEach((trip) => {
    const startAddress = formattedAddress(trip.startLocation);
    const endAddress = formattedAddress(trip.endLocation);
    const tripDate = new Date(trip.startTimestamp).toLocaleDateString();

    if (tripDate !== lastDate) {
      lastDate = tripDate;
      const formattedDate = new Date(trip.startTimestamp).toLocaleDateString(
        "de-DE",
        options
      );
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
      container.appendChild(dateRow);
    }

    const tripRow = document.createElement("div");
    tripRow.className =
      "row trip-row border bg-white rounded fixed-height mb-2";
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
            <i class="bi bi-briefcase"></i>
          </div>
        `;
    container.appendChild(tripRow);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const allowedFields = ["notes", "category", "tripId"];
  const categorySelect = document.getElementById("category");
  categorySelect.addEventListener("change", function () {
    const selectedValue = this.value.toLowerCase();
    const shouldDisable =
      selectedValue === "private" || selectedValue === "commute";
    const formElements = document.querySelectorAll(
      "#editTripForm input, #newTripForm textarea"
    );

    // enable or disable fields based on the selected category
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

function calculateDistance(trip) {
  if (!trip.startMileage || !trip.endMileage) {
    return "N/A";
  } else {
    return (trip.endMileage - trip.startMileage).toString() + " km";
  }
}

function formattedAddress(location) {
  return `${location.street}, ${location.postalCode} ${location.city}`;
}
