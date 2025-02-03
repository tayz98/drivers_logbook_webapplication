async function loadUserFirstAndLastNames() {
  try {
    const response = await fetch("/user");
    if (response.ok) {
      const data = await response.json();
      console.log("User data received:", data);

      document.getElementById("userFirstName").textContent = data.firstName;
      document.getElementById("userLastName").textContent = " " + data.lastName;
    } else {
      console.error("Failed to retrieve user info");
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
  }
}

async function loadSessionInfo() {
  try {
    const response = await fetch("/session-info", { credentials: "include" });
    if (response.ok) {
      const data = await response.json();
      const expireTimestamp = data.expireTimestamp;
      startCountdown(expireTimestamp);
    } else {
      console.error("Failed to retrieve session info");
    }
  } catch (error) {
    console.error("Error fetching session info:", error);
  }
}

function startCountdown(expireTimestamp) {
  const timerElement = document.getElementById("session-timer");

  function updateTimer() {
    const now = Date.now();
    let diff = Math.max(expireTimestamp - now, 0);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    timerElement.textContent =
      String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

    if (diff <= 0) {
      clearInterval(intervalId);
      timerElement.textContent = "00:00";
    }
  }

  updateTimer();

  const intervalId = setInterval(updateTimer, 1000);
}
