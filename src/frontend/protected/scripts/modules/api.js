/*
Since the switch to socket.io, the fetch methods are not used (except for user methods).
*/

let countdownIntervalId = null;

/*
--- User Methods ---
*/
async function fetchUserAndSessionInfo() {
  try {
    const response = await fetch("/api/user/session", {
      credentials: "include",
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("User data received:", data);

      document.getElementById("userFirstName").textContent =
        data.user.firstName;
      document.getElementById("userLastName").textContent =
        " " + data.user.lastName;

      startCountdown(data.session.expireTimestamp);
    } else {
      console.error("Failed to retrieve user info");
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
  }
}

async function logOutUser() {
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
}

function startCountdown(expireTimestamp) {
  const timerElement = document.getElementById("session-timer");

  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
  }

  function updateTimer() {
    const now = Date.now();
    let diff = Math.max(expireTimestamp - now, 0);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    timerElement.textContent =
      String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

    if (diff <= 0) {
      clearInterval(countdownIntervalId);
      timerElement.textContent = "00:00";
    }
  }

  updateTimer();
  countdownIntervalId = setInterval(updateTimer, 1000);
}

/*
--- Vehicle Methods ---
*/
async function fetchVehicleName(vehicleId) {
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

async function fetchVehicles() {
  try {
    const response = await fetch("/api/vehicles", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const vehicles = await response.json();
    return vehicles;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw error;
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

    return await response.json();
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Fahrzeugs:", error);
  }
}

/*
--- Trip Methods ---
*/

async function fetchTrip(tripId) {
  try {
    const response = await fetch(`/api/trip/${tripId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const trip = await response.json();
    return trip;
  } catch (error) {
    console.error("Error fetching trip:", error);
    return null;
  }
}

async function updateTrip(tripId, formData) {
  console.log("FormData in Json:");
  console.log(JSON.stringify(formData));
  try {
    const response = await fetch(`/api/trip/${tripId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error updating trip:", errorData);
      return;
    }

    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function postTrip(formData) {
  try {
    const response = await fetch("/api/trip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error posting trip:", errorData);
      return;
    }
    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function deleteTrip(tripId) {
  try {
    const response = await fetch(`/api/trip/${tripId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error deleting trip:", errorData);
      return;
    }

    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function mergeTrips(tripIds) {
  try {
    const response = await fetch("/api/trips/merge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tripIds: tripIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error merging trips:", errorData);
      return;
    }

    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function generateReport(fromDate, toDate) {
  try {
    const url = `/api/report?fromDate=${encodeURIComponent(
      fromDate
    )}&toDate=${encodeURIComponent(toDate)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error generating report:", errorData);
      return;
    }
    console.log("Report generated:", response);
    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}
