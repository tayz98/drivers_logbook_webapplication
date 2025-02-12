async function login() {
  document
    .getElementById("togglePassword")
    .addEventListener("click", function () {
      var passwordInput = document.getElementById("password");
      var currentType = passwordInput.getAttribute("type");

      if (currentType === "password") {
        passwordInput.setAttribute("type", "text");
        this.querySelector("i").classList.remove("bi-eye");
        this.querySelector("i").classList.add("bi-eye-slash");
      } else {
        passwordInput.setAttribute("type", "password");
        this.querySelector("i").classList.remove("bi-eye-slash");
        this.querySelector("i").classList.add("bi-eye");
      }
    });
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      document.getElementById("errorMsg").innerHTML = "";

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        if (!response.ok) {
          const data = await response.json();
          const errorText = data.error || data.message || "An error occurred";
          document.getElementById("errorMsg").innerHTML =
            '<div class="alert alert-danger" role="alert">' +
            errorText +
            "</div>";
        }
      } catch (error) {
        console.error("Error during login:", error);
        document.getElementById("errorMsg").innerHTML =
          '<div class="alert alert-danger" role="alert">Unexpected error occurred.</div>';
      }
    });
}
