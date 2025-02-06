let countdownIntervalId = null;

async function loadUserAndSessionInfo() {
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
