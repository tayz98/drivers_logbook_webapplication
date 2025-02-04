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

  // Logout Button
  document
    .getElementById("logoutButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const response = await fetch("/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          window.location.href = window.location.origin;
          window.location.reload(true);
        }
      } catch (error) {
        console.error("Logout error:", error);
        window.location.reload();
      }
    });
});
